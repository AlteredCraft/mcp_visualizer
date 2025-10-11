/**
 * Session ID generation utility
 * Generates unique session identifiers for timeline recordings
 */

/**
 * Generate a unique session ID using crypto.randomUUID
 * Falls back to timestamp-based ID if crypto.randomUUID is unavailable
 */
export function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: timestamp + random string
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `session-${timestamp}-${random}`;
}

/**
 * Format session ID for display (shortened version)
 */
export function formatSessionId(sessionId: string): string {
  if (sessionId.startsWith('session-')) {
    return sessionId.substring(0, 20) + '...';
  }
  // UUID format - show first 8 characters
  return sessionId.substring(0, 8);
}
