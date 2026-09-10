/**
 * Event Date and Time Formatting Utilities
 * Prevents timezone shifting by constructing dates with local components.
 */

/**
 * Timezone-safe date parser for YYYY-MM-DD strings.
 */
export function parseDateParts(dateStr) {
  if (!dateStr) return null;
  const parts = String(dateStr).split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month, day);
}

/**
 * Formats YYYY-MM-DD into "Saturday, October 10, 2026"
 */
export function formatEventDateFull(dateStr) {
  const d = parseDateParts(dateStr);
  if (!d) return 'Saturday, October 10, 2026';
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formats YYYY-MM-DD into "October 10, 2026"
 */
export function formatEventDateShort(dateStr) {
  const d = parseDateParts(dateStr);
  if (!d) return 'October 10, 2026';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formats "08:00:00" or "08:00" into "8:00 AM"
 */
export function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const [hStr, mStr] = String(timeStr).split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  if (isNaN(h)) return String(timeStr);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHours = h % 12 || 12;
  const displayMinutes = String(m).padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${period}`;
}

/**
 * Formats start and end times into "8:00 AM – 2:00 PM"
 */
export function formatTimeRange(startTime, endTime) {
  if (!startTime && !endTime) return '8:00 AM – 2:00 PM';
  if (startTime && !endTime) return formatTime12h(startTime);
  if (!startTime && endTime) return formatTime12h(endTime);
  return `${formatTime12h(startTime)} – ${formatTime12h(endTime)}`;
}

/**
 * Computes duration between start and end times, e.g. "6 Hours"
 */
export function formatDuration(startTime, endTime) {
  if (!startTime || !endTime) return '6 Hours';
  const [startH, startM] = startTime.split(':').map((v) => parseInt(v, 10));
  const [endH, endM] = endTime.split(':').map((v) => parseInt(v, 10));
  if (isNaN(startH) || isNaN(endH)) return '6 Hours';
  const diffMinutes = (endH * 60 + (endM || 0)) - (startH * 60 + (startM || 0));
  if (diffMinutes <= 0) return '6 Hours';
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  if (mins === 0) return `${hours} Hour${hours > 1 ? 's' : ''}`;
  return `${hours}h ${mins}m`;
}
