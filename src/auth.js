// Constants for localStorage keys
const LS_ACCESS = "accessToken";    // Key for storing access token
const LS_REFRESH = "refreshToken";  // Key for storing refresh token

let inMemoryTokens = null;          // Cache tokens in memory for quick access
let refreshingPromise = null;       // Prevent concurrent token refresh requests

/**
 * Gets authentication tokens from memory cache or localStorage
 * @returns {Object|null} Token object with accessToken and refreshToken, or null if not found
 */
export function getTokens() {
    // Check memory cache first for faster access
    if (inMemoryTokens) return inMemoryTokens;

    // Retrieve from localStorage if not in memory
    const access = localStorage.getItem(LS_ACCESS);
    const refresh = localStorage.getItem(LS_REFRESH);
    if (access && refresh) {
        // Cache in memory for subsequent calls
        inMemoryTokens = { accessToken: access, refreshToken: refresh };
        return inMemoryTokens;
    }
    return null;
}

/**
 * Sets authentication tokens in both memory cache and localStorage
 * @param {Object} tokens - Token object with accessToken and refreshToken
 */
export function setTokens(tokens) {
    inMemoryTokens = tokens;
    localStorage.setItem(LS_ACCESS, tokens.accessToken);
    localStorage.setItem(LS_REFRESH, tokens.refreshToken);
}

/**
 * Clears all authentication tokens from memory and localStorage
 */
export function clearTokens() {
    inMemoryTokens = null;
    localStorage.removeItem(LS_ACCESS);
    localStorage.removeItem(LS_REFRESH);
}

/**
 * Checks if a JWT token is expired (with 30 second buffer)
 * @param {string} token - JWT token to check
 * @returns {boolean} True if token is expired, false otherwise
 */
function isJwtExpired(token) {
    try {
        // Split JWT into parts (header.payload.signature)
        const [, payloadB64] = token.split(".");
        if (!payloadB64) return false; // not a JWT? fallback to 401
        // Decode the payload to check expiration
        const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
        const exp = typeof payload.exp === "number" ? payload.exp : 0; // Expiration timestamp
        const now = Math.floor(Date.now() / 1000); // Current time in seconds
        // Return true if current time is past expiration minus 30 second buffer
        return now >= exp - 30;
    } catch {
        return false;
    }
}

/**
 * Refreshes authentication tokens by calling the API endpoint
 * Prevents concurrent refresh requests using a promise lock
 * @returns {Promise<Object|null>} New tokens if successful, null otherwise
 */
async function refreshTokens() {
    // Prevent multiple concurrent refresh requests
    if (refreshingPromise) return refreshingPromise;

    const current = getTokens();
    if (!current) return null;

    const base = import.meta.env.VITE_API_BASE_URL;
    const apiKey = import.meta.env.VITE_API_KEY || "";

    // Create a promise to prevent concurrent calls
    refreshingPromise = (async () => {
        try {
            // Call API endpoint to refresh tokens
            const res = await fetch(`${base}/api/External/RefreshUserAccessToken`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    key: apiKey,
                    refreshToken: current.refreshToken,
                    token: current.accessToken,
                }),
            });

            if (!res.ok) {
                // Clear tokens if refresh fails
                clearTokens();
                return null;
            }

            const data = await res.json();

            // Extract new tokens from response
            const nextAccess = data?.data?.accessToken;
            const nextRefresh = data?.data?.refreshToken;

            if (!nextAccess || !nextRefresh) {
                // Clear tokens if response is malformed
                clearTokens();
                return null;
            }

            // Update tokens with new values
            const next = { accessToken: nextAccess, refreshToken: nextRefresh };
            setTokens(next);
            return next;
        } catch {
            // Clear tokens if network error occurs
            clearTokens();
            return null;
        } finally {
            // Release the refresh lock
            refreshingPromise = null;
        }
    })();

    return refreshingPromise;
}

/**
 * Performs a fetch request with automatic authentication token handling
 * Adds Authorization header, refreshes expired tokens, and retries on 401/403
 * @param {RequestInfo} input - The resource to fetch
 * @param {RequestInit} [init] - Request initialization options
 * @returns {Promise<Response>} The fetch response
 */
export async function fetchWithAuth(input, init = {}) {
    const baseInit = {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init.headers || {}),
        },
    };

    let tokens = getTokens();

    // Check if token is expired and refresh if needed
    if (tokens?.accessToken && isJwtExpired(tokens.accessToken)) {
        tokens = await refreshTokens();
    }

    // Add authorization header if tokens are available
    if (tokens?.accessToken) {
        (baseInit.headers).Authorization = `Bearer ${tokens.accessToken}`;
    }

    let res = await fetch(input, baseInit);

    // If unauthorized, try refreshing tokens and retry the request
    if (res.status === 401 || res.status === 403) {
        const renewed = await refreshTokens();
        if (renewed?.accessToken) {
            (baseInit.headers).Authorization = `Bearer ${renewed.accessToken}`;
            res = await fetch(input, baseInit);
        }
    }

    return res;
}
