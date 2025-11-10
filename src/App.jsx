import { useEffect } from "react";
import CheckoutForm from "./components/CheckoutForm";
import { setTokens } from "./auth";

function App() {
  useEffect(() => {
    (async () => {
      try {
        const authRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/External/AuthenticateUser`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              emailOrPhone: import.meta.env.VITE_UEMAIL,
              password: import.meta.env.VITE_UPASSWORD,
            }),
          }
        );

        if (!authRes.ok) {
          console.error("Auth failed with status:", authRes.status);
          return;
        }

        const authData = await authRes.json();
        console.log("AuthenticateUser response:", authData);

        const accessToken = authData?.data?.accessToken;
        const refreshToken = authData?.data?.refreshToken;

        if (!accessToken || !refreshToken) {
          console.warn("Tokens not found in response, check API payload shape.");
          return;
        }

        setTokens({ accessToken, refreshToken });

        const sitesRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/external/sites?key=${authData.data.key}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!sitesRes.ok) {
          console.error("Sites fetch failed:", sitesRes.status);
        }
        const sitesData = await sitesRes.json();
        console.log("Sites Response:", sitesData);

        scheduleTokenRefresh();

      } catch (error) {
        console.error("Error during API calls:", error);
      }
    })();
  }, []);

  return (
    <>
      <CheckoutForm />
    </>
  );
}

export default App;

async function doRefresh() {
  try {
    const base = import.meta.env.VITE_API_BASE_URL;
    const key = import.meta.env.VITE_API_KEY || "";
    const currentAccess = localStorage.getItem("accessToken");
    const currentRefresh = localStorage.getItem("refreshToken");

    if (!currentAccess || !currentRefresh) return null;

    const res = await fetch(`${base}/api/External/RefreshUserAccessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key,
        refreshToken: currentRefresh,
        token: currentAccess,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Refresh failed:", data);
      return null;
    }

    const nextAccess = data?.data?.accessToken ?? data?.accessToken;
    const nextRefresh = data?.data?.refreshToken ?? data?.refreshToken;

    if (nextAccess && nextRefresh) {
      localStorage.setItem("accessToken", nextAccess);
      localStorage.setItem("refreshToken", nextRefresh);
      console.log("Tokens refreshed");
      return { accessToken: nextAccess, refreshToken: nextRefresh };
    } else {
      console.warn("Refresh payload missing tokens");
      return null;
    }
  } catch (e) {
    console.error("Refresh error:", e);
    return null;
  }
}

function scheduleTokenRefresh() {
  const FOURTEEN_MIN = 14 * 60 * 1000;
  setTimeout(async () => {
    const rotated = await doRefresh();
    if (rotated) scheduleTokenRefresh();
  }, FOURTEEN_MIN);
}
