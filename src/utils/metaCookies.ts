/**
 * Meta Pixel Cookie Utilities
 * Utilities for reading Meta Pixel tracking cookies (_fbp and _fbc)
 */

/**
 * Returns the value of a specific cookie by name
 * @param name - The name of the cookie to retrieve
 * @returns The decoded cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Retrieves _fbp and _fbc cookies if available
 * @returns Object containing fbp and fbc values (may be null if not set)
 */
export function getMetaCookies(): { fbp: string | null; fbc: string | null } {
  return {
    fbp: getCookie('_fbp'),
    fbc: getCookie('_fbc')
  };
}
