import { useEffect, useMemo, useState } from "react";
import { setTokens } from "./auth";
import PersonalInfo from "./components/sections/PersonalInfo";
import { useCheckout } from "./context/CheckoutContext";
import Membership from "./pages/membersip";

function App() {
  const [siteData, setSiteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setApiKey, setSiteId, setCustomerId, apiKey, derivedTotals } = useCheckout();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    licensePlate: "",
    cardNumber: "",
    expirationDate: "",
    securityCode: "",
    billingZip: "",
    couponCode: "",
    dateOfBirth: "",
    address: "",
    assignToLocSite: "",
    zipCode: "",
    state: "",
    city: "",
    loyaltyPoints: "0",
    allowInvoicing: false,
    sendText: false,
    sendEmail: false,
    blacklistedCustomer: false,
    activeCustomer: true,
    region: "Emirates",
    country: "Dubai",
    alphabeticPart: "",
    numericPart: ""
  });

  const saveCustomerInfoToStorage = (data) => {
    try {
      const payload = {
        ...data,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem("checkoutCustomerInfo", JSON.stringify(payload));

      if (data.alphabeticPart.trim() && data.numericPart.trim()) {
        localStorage.setItem("licensePlate", data.alphabeticPart.trim() + data.numericPart.trim());
      } else {
        localStorage.removeItem("licensePlate");
      }
    } catch (e) {
      console.error("Failed to save checkoutCustomerInfo:", e);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      saveCustomerInfoToStorage(updated);
      return updated;
    });

    if (name === "assignToLocSite" && value) {
      setSiteId(value);
      localStorage.setItem("siteId", String(value));
    }
  };

  const handleToggle = (name) => {
    setFormData((prev) => {
      const updated = { ...prev, [name]: !prev[name] };
      saveCustomerInfoToStorage(updated);
      return updated;
    });
  };

  const canProceed = useMemo(() => {
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.email.trim() &&
      formData.phone.trim()
    );
  }, [formData]);

  // login + sites fetch
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
          console.error("Auth failed:", authRes.status);
          return;
        }

        const authData = await authRes.json();
        const accessToken = authData?.data?.accessToken;
        const refreshToken = authData?.data?.refreshToken;
        const keyFromLogin = authData?.data?.key;

        if (!accessToken || !refreshToken) {
          console.warn("Missing tokens");
          return;
        }

        setTokens({ accessToken, refreshToken });

        if (keyFromLogin) {
          setApiKey(keyFromLogin);
          localStorage.setItem("apiKey", keyFromLogin);
        }

        const sitesRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/external/sites?key=${keyFromLogin}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const sitesData = await sitesRes.json();
        setSiteData(sitesData);

        // default site/state/city set
        const sitesArray = Array.isArray(sitesData?.data)
          ? sitesData.data
          : [];

        if (sitesArray.length > 0) {
          // index 1 = Al Quoz, agar na mile to index 0
          const defaultSite = sitesArray[1] || sitesArray[0];
          const siteValue = defaultSite?.id ?? defaultSite?.siteId;

          if (siteValue) {
            const defaultState = "Al Quoz";
            const defaultCity = "Dubai";

            setSiteId(String(siteValue));
            localStorage.setItem("siteId", String(siteValue));

            setFormData((prev) => {
              const updated = {
                ...prev,
                assignToLocSite: String(siteValue),
                state: defaultState,
                city: defaultCity,
              };
              saveCustomerInfoToStorage(updated);
              return updated;
            });
          }
        }

        scheduleTokenRefresh();
      } catch (e) {
        console.error(e);
      }
    })();
  }, [setApiKey, setSiteId]);

  // CHECKOUT se pehle call hota hai
  const ensureCustomerAndSite = async () => {
    if (!canProceed) {
      setError("Please fill in all required fields.");
      return false;
    }

    // Ensure license plate is provided (both alphabetic and numeric parts)
    if (!formData.alphabeticPart || !formData.alphabeticPart.trim() || !formData.numericPart || !formData.numericPart.trim()) {
      setError("Please fill the license plate fields.");
      return false;
    }

    try {
      setLoading(true);
      setError("");

      // latest form ko store karo
      saveCustomerInfoToStorage(formData);

      if (formData.assignToLocSite) {
        setSiteId(formData.assignToLocSite);
        localStorage.setItem("siteId", String(formData.assignToLocSite));
      }

      // Save discounts to localStorage
      if (derivedTotals?.discounts) {
        localStorage.setItem("checkoutDiscounts", String(derivedTotals.discounts));
      } else {
        localStorage.removeItem("checkoutDiscounts");
      }

      // 👇 5 second wait before redirect
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // customer create success page par hoga
      return true;
    } catch (err) {
      console.error("Error preparing checkout data:", err);
      setError("Something went wrong. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-2 min-h-[calc(100vh-90px)]">
      <div className="grid grid-cols-1 lg:grid-cols-2 mt-4 gap-2 lg:gap-8 items-start">

        {/* LEFT: Personal info */}
        <div>
          <PersonalInfo
            siteData={siteData}
            formData={formData}
            onChange={handleInputChange}
            onToggle={handleToggle}
          />

          <div className="mt-4">
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          </div>
        </div>

        {/* RIGHT: Membership / products + checkout */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 lg:min-h-[420px]">
          <Membership
            onEnsureCustomer={ensureCustomerAndSite}
            isProcessing={loading}
          />
        </section> 
      </div>
    </main>
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
