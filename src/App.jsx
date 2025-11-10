import { useEffect } from "react";
import CheckoutForm from "./components/CheckoutForm";
import { setTokens } from "./auth";

function App() {
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
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

        if (!res.ok) {
          console.error("Auth failed with status:", res.status);
          return;
        }

        const data = await res.json();
        console.log("AuthenticateUser response:", data);

        // Adjust paths based on your API's response shape:
        const accessToken = data?.data?.accessToken || data?.accessToken;
        const refreshToken = data?.data?.refreshToken || data?.refreshToken;

        if (accessToken && refreshToken) {
          setTokens({ accessToken, refreshToken });
        } else {
          console.warn("Tokens not found in response, check API payload shape.");
        }
      } catch (error) {
        console.error("Error authenticating user:", error);
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
