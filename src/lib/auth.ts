import { config } from './config';

interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Refresh the access token using the refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenRefreshResponse> {
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(`${config.backendUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        'Content-Type': 'application/json',
      },
      body: null,
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data: TokenRefreshResponse = await response.json();

    if (!data.accessToken || !data.refreshToken) {
      throw new Error('Invalid token refresh response: missing tokens');
    }

    // Store new tokens
    await storeTokens(data.accessToken, data.refreshToken);

    console.log('Token refresh successful');
    return data;
  } catch (error) {
    console.error('Token refresh error:', error);
    // Clear tokens on refresh failure
    await clearTokens();
    throw error;
  }
}

/**
 * Get stored tokens from chrome storage
 */
export async function getStoredTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['accessToken', 'refreshToken'], (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve({
        accessToken: result.accessToken || null,
        refreshToken: result.refreshToken || null,
      });
    });
  });
}

/**
 * Store tokens in chrome storage
 */
export async function storeTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ accessToken, refreshToken }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      console.log('Tokens stored successfully');
      resolve();
    });
  });
}

/**
 * Clear all tokens
 */
export async function clearTokens(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(['accessToken', 'refreshToken'], () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      console.log('Tokens cleared');
      resolve();
    });
  });
}
