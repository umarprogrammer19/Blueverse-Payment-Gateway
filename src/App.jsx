import { useEffect } from "react";
import CheckoutForm from "./components/CheckoutForm";

function App() {
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/External/AuthenticateUser`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              emailOrPhone: import.meta.env.VITE_UEMAIL,
              password: import.meta.env.VITE_UPASSWORD,
            }),
          }
        );

        const data = await res.json();
        localStorage.setItem("accessToken", JSON.stringify(data.data.accessToken))
        localStorage.setItem("refreshToken", JSON.stringify(data.data.refreshToken))
        console.log("API Response:", data);
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
