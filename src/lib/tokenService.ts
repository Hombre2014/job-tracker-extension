import { config } from './config';

/**
 * Perform token refresh using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  try {
    console.log('TokenService: Attempting token refresh...');
    const response = await fetch(`${config.backendUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${refreshToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('TokenService: Token refresh successful');
      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
    } else {
      console.error('TokenService: Token refresh failed:', response.status);
      return null;
    }
  } catch (error) {
    console.error('TokenService: Token refresh error:', error);
    return null;
  }
}

/**
 * Store tokens in chrome storage
 */
export function storeTokens(accessToken: string, refreshToken?: string): void {
  const tokens: { accessToken: string; refreshToken?: string } = { accessToken };
  if (refreshToken) {
    tokens.refreshToken = refreshToken;
  }
  chrome.storage.local.set(tokens);
}

/**
 * Clear tokens from chrome storage
 */
export function clearTokens(): void {
  chrome.storage.local.remove(['accessToken', 'refreshToken']);
}

/**
 * Get tokens from chrome storage
 */
export function getStoredTokens(): Promise<{
  accessToken?: string;
  refreshToken?: string;
}> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['accessToken', 'refreshToken'], (result) => {
      resolve({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    });
  });
}
