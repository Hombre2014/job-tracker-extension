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
        Authorization: `Bearer ${refreshToken}`,
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
export async function storeTokens(
  accessToken: string,
  refreshToken?: string,
): Promise<void> {
  const tokens: { accessToken: string; refreshToken?: string } = {
    accessToken,
  };
  if (refreshToken) {
    tokens.refreshToken = refreshToken;
  }
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(tokens, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
}

/**
 * Clear tokens from chrome storage
 */
export async function clearTokens(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(['accessToken', 'refreshToken'], () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
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
