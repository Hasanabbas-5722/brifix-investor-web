/**
 * Utility to decode JWT token payload and check if it is expired.
 */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const parts = token.split('.');
    console.log('Token parts:', parts.length);
    // If it's not a standard 3-part JWT, treat it as a persistent session token
    if (parts.length !== 3) {
      return false;
    }
    
    const payloadBase64 = parts[1];
    console.log('Token payload:', payloadBase64);
    if (!payloadBase64) return false;

    // Decode base64 safely supporting UTF-8 characters
    const decodedPayload = JSON.parse(
      decodeURIComponent(
        atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'))
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
    );

    console.log('Decoded token payload:', decodedPayload);
    if (decodedPayload.exp) {
      const expirationTime = decodedPayload.exp * 1000;
      console.log('Token expiration time (ms):', expirationTime, 'Current time (ms):', Date.now(), Date.now() >= expirationTime - 10000);
      // Add a 10-second buffer to handle network transit delays
      return Date.now() >= expirationTime - 10000;
    }
  } catch (error) {
    console.warn('Failed to parse token expiration (assuming non-JWT or persistent):', error);
    return false; // Do not auto-expire if it's a persistent token or fails parsing
  }
  return false;
};
