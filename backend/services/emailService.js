const nodemailer = require('nodemailer');

/**
 * Creates and configures the Nodemailer SMTP transporter.
 */
function createTransporter() {
  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
}

/**
 * Formats a time string (HH:MM or HH:MM:SS) to 12-hour format (e.g. 8:00 AM)
 */
function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const parts = String(timeStr).split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return timeStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Formats start and end times into a readable range (e.g. 8:00 AM – 2:00 PM)
 */
function formatEventTime(startTime, endTime) {
  if (!startTime) return '8:00 AM – 2:00 PM';
  const startFormatted = formatTime12h(startTime);
  if (!endTime) return startFormatted;
  const endFormatted = formatTime12h(endTime);
  return `${startFormatted} – ${endFormatted}`;
}

/**
 * Formats a date string (YYYY-MM-DD or ISO) into 'Month DD, YYYY'
 */
function formatEmailDate(dateStr) {
  if (!dateStr) return 'October 10, 2026';
  try {
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      if (monthIndex >= 0 && monthIndex < 12 && !isNaN(day) && !isNaN(year)) {
        return `${monthNames[monthIndex]} ${day}, ${year}`;
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      });
    }
    return String(dateStr);
  } catch {
    return String(dateStr);
  }
}

/**
 * Generates the HTML template for the registration confirmation email.
 */
function generateConfirmationHtml(registration, event) {
  const eventName = event?.name || 'IT Innovation Summit 2026';
  const eventDate = formatEmailDate(event?.event_date);
  const eventTime = formatEventTime(event?.start_time, event?.end_time);
  const eventVenue = event?.venue || 'Arusha International Conference Centre';

  const institutionRow = registration.institution
    ? `
      <tr>
        <td style="padding: 10px 14px; font-weight: 600; color: #64748b; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; width: 35%;">Institution</td>
        <td style="padding: 10px 14px; color: #172033; font-weight: 600; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${registration.institution}</td>
      </tr>
    `
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Confirmed – ${eventName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f8fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #172033; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f8fc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 18px rgba(11, 31, 58, 0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0B1F3A; padding: 32px 30px; text-align: center;">
              <div style="font-size: 12px; font-weight: 800; letter-spacing: 0.1em; color: #38bdf8; text-transform: uppercase; margin-bottom: 8px;">Official Confirmation</div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">${eventName}</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #cbd5e1;">Pioneering Future Technologies</p>
            </td>
          </tr>

          <!-- Success Alert -->
          <tr>
            <td style="padding: 25px 30px 10px 30px;">
              <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px 20px; text-align: center;">
                <span style="display: inline-block; font-size: 18px; font-weight: 800; color: #065f46;">Registration Confirmed!</span>
                <p style="margin: 6px 0 0 0; font-size: 13.5px; color: #047857;">Your seat has been reserved. Please find your registration details below.</p>
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 15px 30px 10px 30px;">
              <p style="font-size: 15px; margin: 0 0 10px 0; color: #0b1f3a;">Hello <strong>${registration.full_name}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; margin: 0; color: #334155;">
                Thank you for registering for the <strong>${eventName}</strong>. Your registration has been successfully received.
              </p>
            </td>
          </tr>

          <!-- Registration Details Section -->
          <tr>
            <td style="padding: 15px 30px;">
              <div style="font-size: 13px; font-weight: 800; color: #0b1f3a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid #e2e8f0;">
                Registration Details
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e2e8f0; border-radius: 8px; border-collapse: separate; border-spacing: 0; overflow: hidden; background-color: #f8fafd;">
                <tr>
                  <td style="padding: 10px 14px; font-weight: 600; color: #64748b; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; width: 35%;">Registration ID</td>
                  <td style="padding: 10px 14px; color: #0b1f3a; font-weight: 800; font-family: monospace; font-size: 15px; border-bottom: 1px solid #e2e8f0;">#${registration.id}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-weight: 600; color: #64748b; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Full Name</td>
                  <td style="padding: 10px 14px; color: #172033; font-weight: 600; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${registration.full_name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-weight: 600; color: #64748b; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Email</td>
                  <td style="padding: 10px 14px; color: #172033; font-weight: 600; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${registration.email}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-weight: 600; color: #64748b; font-size: 13px; text-transform: uppercase;">Phone</td>
                  <td style="padding: 10px 14px; color: #172033; font-weight: 600; font-size: 14px;">${registration.phone}</td>
                </tr>
                ${institutionRow}
              </table>
            </td>
          </tr>

          <!-- Event Details Section -->
          <tr>
            <td style="padding: 10px 30px 20px 30px;">
              <div style="font-size: 13px; font-weight: 800; color: #0b1f3a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid #e2e8f0;">
                Event Details
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e2e8f0; border-radius: 8px; border-collapse: separate; border-spacing: 0; overflow: hidden; background-color: #f8fafd;">
                <tr>
                  <td style="padding: 10px 14px; font-weight: 600; color: #64748b; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; width: 35%;">Event</td>
                  <td style="padding: 10px 14px; color: #0b1f3a; font-weight: 700; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${eventName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-weight: 600; color: #64748b; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Date</td>
                  <td style="padding: 10px 14px; color: #172033; font-weight: 600; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${eventDate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-weight: 600; color: #64748b; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Time</td>
                  <td style="padding: 10px 14px; color: #172033; font-weight: 600; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${eventTime}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-weight: 600; color: #64748b; font-size: 13px; text-transform: uppercase;">Venue</td>
                  <td style="padding: 10px 14px; color: #172033; font-weight: 600; font-size: 14px;">${eventVenue}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Closing Message -->
          <tr>
            <td style="padding: 10px 30px 25px 30px; border-top: 1px solid #f1f5f9;">
              <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; color: #334155;">
                We look forward to welcoming you to the ${eventName}.
              </p>
              <p style="font-size: 14px; margin: 0; color: #0b1f3a; font-weight: 600;">
                Regards,<br>
                <span style="color: #123b6d; font-weight: 700;">${eventName} Team</span>
              </p>
            </td>
          </tr>

          <!-- Footer Note -->
          <tr>
            <td style="background-color: #f8fafd; padding: 18px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                This is an automated confirmation email. Please keep this email and your Registration ID (#${registration.id}) for summit check-in.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generates the plain text version of the confirmation email.
 */
function generateConfirmationText(registration, event) {
  const eventName = event?.name || 'IT Innovation Summit 2026';
  const eventDate = formatEmailDate(event?.event_date);
  const eventTime = formatEventTime(event?.start_time, event?.end_time);
  const eventVenue = event?.venue || 'Arusha International Conference Centre';

  const institutionLine = registration.institution
    ? `Institution: ${registration.institution}\n`
    : '';

  return `
${eventName}
Registration Confirmed!

Hello ${registration.full_name},

Thank you for registering for the ${eventName}.
Your registration has been successfully received.

Registration Details:
- Registration ID: #${registration.id}
- Full Name: ${registration.full_name}
- Email: ${registration.email}
- Phone: ${registration.phone}
${institutionLine}
Event Details:
- Event: ${eventName}
- Date: ${eventDate}
- Time: ${eventTime}
- Venue: ${eventVenue}

We look forward to welcoming you to the ${eventName}.

Regards,
${eventName} Team
  `.trim();
}

/**
 * Sends a registration confirmation email to the attendee.
 * Non-blocking: catches errors and returns status without throwing unhandled exceptions.
 * 
 * @param {Object} registration - { id, full_name, email, phone, institution }
 * @param {Object} [event] - Optional event record { name, event_date, start_time, end_time, venue }
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
async function sendRegistrationConfirmation(registration, event) {
  if (!registration || !registration.email) {
    return { success: false, error: 'Recipient email is missing' };
  }

  const transporter = createTransporter();
  if (!transporter) {
    console.warn('[EmailService] SMTP credentials not configured in environment (EMAIL_USER / EMAIL_PASSWORD). Skipping email dispatch.');
    return { success: false, error: 'SMTP credentials not configured' };
  }

  const eventName = event?.name || 'IT Innovation Summit 2026';

  const mailOptions = {
    from: `"${eventName}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@itinnovationsummit.org'}>`,
    to: registration.email,
    subject: `Registration Confirmed – ${eventName}`,
    text: generateConfirmationText(registration, event),
    html: generateConfirmationHtml(registration, event),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Confirmation email successfully sent to ${registration.email} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EmailService] Could not send confirmation email to ${registration.email}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendRegistrationConfirmation,
  generateConfirmationHtml,
  generateConfirmationText,
};
