const API_BASE = (import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:5000';

/**
 * Normalizes relative uploaded asset paths (e.g. /uploads/profile/xyz.png)
 * to full accessible URLs for frontend consumption, while passing full URLs or blob previews through.
 */
export function getAssetUrl(path) {
  if (!path || typeof path !== 'string') return '';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:')
  ) {
    return path;
  }
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Derives up to 2 uppercase initials from a person's full name.
 * e.g. "Twaha Faki" -> "TF", "Administrator" -> "A"
 */
export function getInitials(fullName) {
  if (!fullName || typeof fullName !== 'string') return 'A';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'A';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
