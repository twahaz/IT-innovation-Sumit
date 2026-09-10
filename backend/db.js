require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'it_innovation_summit',
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || ''),
});

/**
 * Initializes database connection and verifies/creates schema and indexes.
 */
async function initDb() {
  const dbName = process.env.DB_NAME || 'it_innovation_summit';
  try {
    let client;
    try {
      client = await pool.connect();
    } catch (connErr) {
      // If the database does not exist (PostgreSQL error code 3D000), attempt to create it
      if (connErr.code === '3D000') {
        console.log(`[Database] Database "${dbName}" not found. Attempting to create it...`);
        const rootPool = new Pool({
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          database: 'postgres',
          user: process.env.DB_USER || 'postgres',
          password: String(process.env.DB_PASSWORD || ''),
        });
        const rootClient = await rootPool.connect();
        await rootClient.query(`CREATE DATABASE "${dbName}";`);
        rootClient.release();
        await rootPool.end();
        console.log(`[Database] Database "${dbName}" created successfully.`);

        client = await pool.connect();
      } else {
        throw connErr;
      }
    }

    const testRes = await client.query('SELECT NOW() AS current_time');
    console.log(`[Database] PostgreSQL database "${dbName}" connected successfully (Server time: ${testRes.rows[0].current_time})`);

    // Create registrations table if it does not exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL,
        phone VARCHAR(30) NOT NULL,
        institution VARCHAR(150),
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createTableQuery);

    // Safe additive migration: Add email_sent column to registrations
    await client.query(`
      ALTER TABLE registrations ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE;
    `);

    // =========================================================================
    // PHASE 2A: ANNUAL EVENT ARCHITECTURE MIGRATION
    // =========================================================================
    
    // 1. Create events table
    const createEventsTableQuery = `
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        year INTEGER UNIQUE NOT NULL,
        event_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        venue VARCHAR(255),
        description TEXT,
        image_url TEXT,
        registration_open BOOLEAN DEFAULT TRUE,
        is_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createEventsTableQuery);

    // 2. Partial unique index to enforce only one active event at a time
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS events_single_active_idx
      ON events (is_active)
      WHERE is_active = TRUE;
    `);

    // 3. Seed/verify the current 2026 event
    const seedEventQuery = `
      INSERT INTO events (name, year, event_date, start_time, end_time, venue, description, registration_open, is_active)
      VALUES (
        'IT Innovation Summit 2026',
        2026,
        '2026-10-10',
        '08:00',
        '14:00',
        'Arusha International Conference Centre',
        'The flagship summit bringing together students, developers, entrepreneurs, technology enthusiasts, and innovators to exchange game-changing ideas and shape the future of digital transformation.',
        TRUE,
        TRUE
      )
      ON CONFLICT (year) DO NOTHING;
    `;
    await client.query(seedEventQuery);

    // 4. Safe additive migration: Add event_id to registrations
    await client.query(`
      ALTER TABLE registrations ADD COLUMN IF NOT EXISTS event_id INTEGER;
    `);

    // 5. Backfill any registrations that have null event_id with the 2026 event
    await client.query(`
      UPDATE registrations
      SET event_id = (SELECT id FROM events WHERE year = 2026 LIMIT 1)
      WHERE event_id IS NULL;
    `);

    // 6. Add foreign key constraint to registrations(event_id)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'fk_registrations_event' AND table_name = 'registrations'
        ) THEN
          ALTER TABLE registrations
          ADD CONSTRAINT fk_registrations_event
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE RESTRICT;
        END IF;
      END $$;
    `);

    // 7. Enforce NOT NULL on event_id after backfill
    await client.query(`
      ALTER TABLE registrations ALTER COLUMN event_id SET NOT NULL;
    `);

    // 8. Create index on event_id for fast lookup & filtering
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
    `);

    // 9. Migrate unique email constraint: scope uniqueness to (event_id, LOWER(email))
    await client.query(`
      DROP INDEX IF EXISTS registrations_email_unique_idx;
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS registrations_event_email_unique_idx
      ON registrations (event_id, LOWER(email));
    `);

    // Create admins table
    const createAdminsTableQuery = `
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createAdminsTableQuery);

    // Safe additive migration: Add profile_image_url to admins table if not exists
    await client.query(`
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
    `);

    // Seed default admin account if table is empty
    const adminCountRes = await client.query('SELECT COUNT(*) FROM admins;');
    if (parseInt(adminCountRes.rows[0].count, 10) === 0) {
      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@itinnovationsummit.org').toLowerCase().trim();
      const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSummit2026!';
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await client.query(`
        INSERT INTO admins (full_name, email, password_hash, role)
        VALUES ($1, $2, $3, $4);
      `, ['Summit Administrator', adminEmail, hashedPassword, 'admin']);
      console.log(`[Database] Seeded initial admin account: ${adminEmail}`);
    }

    // 10. Create event_schedule table
    const createScheduleTableQuery = `
      CREATE TABLE IF NOT EXISTS event_schedule (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        speaker_name VARCHAR(150),
        session_type VARCHAR(100),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_schedule_time_order CHECK (end_time > start_time),
        CONSTRAINT chk_schedule_sort_order CHECK (sort_order >= 0)
      );
    `;
    await client.query(createScheduleTableQuery);

    // Indexes for event_schedule
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_event_schedule_event_id ON event_schedule(event_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_event_schedule_sort ON event_schedule(event_id, sort_order ASC, start_time ASC);
    `);

    // Seed initial schedule for the 2026 event if not already populated
    const event2026Res = await client.query('SELECT id FROM events WHERE year = 2026 LIMIT 1;');
    if (event2026Res.rows.length > 0) {
      const event2026Id = event2026Res.rows[0].id;
      const scheduleCountRes = await client.query(
        'SELECT COUNT(*)::int AS count FROM event_schedule WHERE event_id = $1;',
        [event2026Id]
      );
      if (parseInt(scheduleCountRes.rows[0].count, 10) === 0) {
        const seedScheduleQuery = `
          INSERT INTO event_schedule (event_id, title, description, speaker_name, session_type, start_time, end_time, sort_order)
          VALUES
            ($1, 'Registration & Welcome', 'Attendee check-in, digital badge issuance, welcome kit distribution, and morning coffee mixer.', NULL, 'Check-in & Networking', '08:00', '09:00', 1),
            ($1, 'Opening Session', 'Welcome remarks from summit organizers, vision briefing on emerging technological shifts, and keynote address.', NULL, 'Keynote Address', '09:00', '10:00', 2),
            ($1, 'Technology & Innovation Talks', 'Inspiring speaker sessions focusing on Artificial Intelligence, Cloud Infrastructure, and Digital Transformation trends.', NULL, 'Tech Deep Dives', '10:00', '11:30', 3),
            ($1, 'Networking & Collaboration', 'Structured breakout circles connecting students, developers, researchers, and entrepreneurs for idea sharing.', NULL, 'Interactive Session', '11:30', '12:30', 4),
            ($1, 'Innovation Showcase', 'Live interactive demonstrations of breakthrough digital projects, student prototypes, and startup innovations.', NULL, 'Live Demos', '12:30', '13:30', 5),
            ($1, 'Closing Session', 'Summit summary, community recognitions, certificate announcements, and final networking closing remarks.', NULL, 'Wrap-Up & Awards', '13:30', '14:00', 6);
        `;
        await client.query(seedScheduleQuery, [event2026Id]);
        console.log(`[Database] Seeded 6 initial schedule sessions for 2026 Summit (event_id: ${event2026Id}).`);
      }
    }

    client.release();
    console.log(`[Database] Tables and indexes initialized successfully.`);
    return true;
  } catch (err) {
    console.error(`[Database Error] Could not initialize database: ${err.message}`);
    return false;
  }
}

module.exports = { pool, initDb };
