import { useEffect, useMemo, useState } from "react";
import { setTokens } from "./auth";
import PersonalInfo from "./components/sections/PersonalInfo";
import { useCheckout } from "./context/CheckoutContext";
import Membership from "./pages/membersip";

function App() {
  const [siteData, setSiteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setApiKey, setSiteId, setCustomerId, apiKey } = useCheckout();

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
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = (name) => {
    setFormData((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const canProceed = useMemo(() => {
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.email.trim() &&
      formData.assignToLocSite
    );
  }, [formData]);

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

        scheduleTokenRefresh();
      } catch (e) {
        console.error(e);
      }
    })();
  }, [setApiKey]);

  // 🔹 ye function CHECKOUT se pehle call hoga
  const ensureCustomerAndSite = async () => {
    if (!canProceed) {
      setError("Please fill in all required fields.");
      return false;
    }

    try {
      setError("");
      setLoading(true);

      const base = import.meta.env.VITE_API_BASE_URL;
      const token = localStorage.getItem("accessToken");
      const key = apiKey || localStorage.getItem("apiKey") || "";

      // GET customers
      const listRes = await fetch(`${base}/api/customer?key=${key}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const listData = await listRes.json();
      const customers = Array.isArray(listData?.data) ? listData.data : [];
      const email = formData.email.trim().toLowerCase();
      const existing = customers.find((c) => c.emailId == email);

      if (existing) {
        localStorage.setItem("customerId", String(existing.customerId));
        setCustomerId(existing.customerId);
      }

      if (!existing) {
        const body = {
          key,
          address: formData.address || "",
          allowInvoicing: !!formData.allowInvoicing,
          blackList: !!formData.blacklistedCustomer,
          ccNumber: "",
          ccToken: "",
          ccType: "",
          cityId: 0,
          dateOfBirth: formData.dateOfBirth
            ? `${formData.dateOfBirth}T00:00:00`
            : null,
          emailId: formData.email || "",
          expiryMonth: "",
          expiryYear: "",
          firstName: formData.firstName || "",
          isActive: true,
          isCardOnFile: false,
          isSendEmail: !!formData.sendEmail,
          isSendText: !!formData.sendText,
          isTcpaEnabled: false,
          lastName: formData.lastName,
          loyaltyPoints: Number(formData.loyaltyPoints || 0),
          nameOnCard: "",
          phone: formData.phone || "",
          recurringData: "",
          siteId: String(formData.assignToLocSite),
          stateId: 54,
          zipCode: formData.zipCode || "",
        };

        const createRes = await fetch(`${base}/api/customer`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        const createData = await createRes.json();
        if (!createRes.ok) {
          console.error("Create customer failed:", createData);
          setError("Failed to create customer.");
          return false;
        } else {
          const newId = createData?.data?.customerId;
          if (newId) {
            setCustomerId(newId);
            localStorage.setItem("customerId", String(newId));
          }
          console.log("Customer created:", createData?.data ?? createData);
        }
      } else {
        console.log("Existing customer found:", existing);
      }

      setSiteId(formData.assignToLocSite);
      localStorage.setItem("siteId", String(formData.assignToLocSite));

      return true; // sab ok, payment continue kar sakta hai
    } catch (err) {
      console.error("Ensure customer/site error:", err);
      setError("Something went wrong. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LEFT: Personal info */}
        <div>
          <PersonalInfo
            siteData={siteData}
            formData={formData}
            onChange={handleInputChange}
            onToggle={handleToggle}
          />

          <div className="mt-4">
            {error && (
              <p className="text-red-500 text-sm mb-2">{error}</p>
            )}
            {/* 🔻 yahan koi button nahi ab */}
          </div>
        </div>

        {/* RIGHT: Membership / products + checkout */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[420px]">
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

// refresh helpers same as before
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
