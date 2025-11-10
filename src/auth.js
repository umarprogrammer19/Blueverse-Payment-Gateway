const LS_ACCESS = "accessToken";
const LS_REFRESH = "refreshToken";

let inMemoryTokens = null;
let refreshingPromise = null;

export function getTokens() {
    if (inMemoryTokens) return inMemoryTokens;

    const access = localStorage.getItem(LS_ACCESS);
    const refresh = localStorage.getItem(LS_REFRESH);
    if (access && refresh) {
        inMemoryTokens = { accessToken: access, refreshToken: refresh };
        return inMemoryTokens;
    }
    return null;
}

export function setTokens(tokens) {
    inMemoryTokens = tokens;
    localStorage.setItem(LS_ACCESS, tokens.accessToken);
    localStorage.setItem(LS_REFRESH, tokens.refreshToken);
}

export function clearTokens() {
    inMemoryTokens = null;
    localStorage.removeItem(LS_ACCESS);
    localStorage.removeItem(LS_REFRESH);
}

function isJwtExpired(token) {
    try {
        const [, payloadB64] = token.split(".");
        if (!payloadB64) return false; // not a JWT? fallback to 401 flow
        const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
        const exp = typeof payload.exp === "number" ? payload.exp : 0;
        const now = Math.floor(Date.now() / 1000);
        // refresh a little early (30s skew)
        return now >= exp - 30;
    } catch {
        return false;
    }
}

async function refreshTokens() {
    // de-duplicate concurrent refresh calls
    if (refreshingPromise) return refreshingPromise;

    const current = getTokens();
    if (!current) return null;

    const base = import.meta.env.VITE_API_BASE_URL;
    const apiKey = import.meta.env.VITE_API_KEY || ""; // if your backend requires the "key" field

    refreshingPromise = (async () => {
        try {
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
                clearTokens();
                return null;
            }

            const data = await res.json();
            // Adjust paths based on your API's exact shape:
            const nextAccess = data?.data?.accessToken || data?.accessToken;
            const nextRefresh = data?.data?.refreshToken || data?.refreshToken;

            if (!nextAccess || !nextRefresh) {
                clearTokens();
                return null;
            }

            const next = { accessToken: nextAccess, refreshToken: nextRefresh };
            setTokens(next);
            return next;
        } catch {
            clearTokens();
            return null;
        } finally {
            refreshingPromise = null;
        }
    })();

    return refreshingPromise;
}

/**
 * fetchWithAuth: adds Authorization, refreshes on expiry/401, retries once.
 */
export async function fetchWithAuth(input) {
    const baseInit = {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init.headers || {}),
        },
    };

    let tokens = getTokens();

    // Refresh proactively if token looks expired
    if (tokens?.accessToken && isJwtExpired(tokens.accessToken)) {
        tokens = await refreshTokens();
    }

    if (tokens?.accessToken) {
        (baseInit.headers).Authorization = `Bearer ${tokens.accessToken}`;
    }

    let res = await fetch(input, baseInit);

    // If unauthorized, try one refresh then retry once
    if (res.status === 401 || res.status === 403) {
        const renewed = await refreshTokens();
        if (renewed?.accessToken) {
            (baseInit.headers).Authorization = `Bearer ${renewed.accessToken}`;
            res = await fetch(input, baseInit);
        }
    }

    return res;
}
