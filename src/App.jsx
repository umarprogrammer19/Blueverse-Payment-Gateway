import { User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { setTokens } from "./auth";
import PersonalInfo from "./components/sections/PersonalInfo";

function App() {
  const [siteData, setSiteData] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);

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
    loyaltyPoints: "",
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

  // Required fields to enable/show Next
  const canProceed = useMemo(() => {
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.email.trim() &&
      formData.assignToLocSite // site selected (id)
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
          console.error("Auth failed with status:", authRes.status);
          return;
        }

        const authData = await authRes.json();
        console.log("AuthenticateUser response:", authData);

        const accessToken = authData?.data?.accessToken;
        const refreshToken = authData?.data?.refreshToken;
        const keyFromLogin = authData?.data?.key;

        if (!accessToken || !refreshToken) {
          console.warn("Tokens not found in response.");
          return;
        }
        setTokens({ accessToken, refreshToken });
        if (keyFromLogin) setApiKey(keyFromLogin);

        // Sites
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
        if (!sitesRes.ok) console.error("Sites fetch failed:", sitesRes.status);
        const sitesData = await sitesRes.json();
        setSiteData(sitesData);
        console.log("Sites Response:", sitesData);

        scheduleTokenRefresh();
      } catch (error) {
        console.error("Error during API calls:", error);
      }
    })();
  }, []);

  // NEXT: check → create → console redirect
  const handleProceedToCheckout = async () => {
    try {
      setLoading(true);
      const base = import.meta.env.VITE_API_BASE_URL;
      const token = localStorage.getItem("accessToken");
      const key = apiKey || import.meta.env.VITE_API_KEY || "";

      // 1) list customers
      const listRes = await fetch(`${base}/api/customer?key=${key}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const listData = await listRes.json();
      if (!listRes.ok) {
        console.error("Customer list failed:", listData);
        return;
      }
      const customers = Array.isArray(listData?.data) ? listData.data : [];
      const email = formData.email.trim().toLowerCase();
      const existing = customers.find(
        (c) => (c.emailId || "").trim().toLowerCase() === email
      );

      if (existing) {
        console.log("Existing customer found:", existing);
        console.log("redirect to checkout");
        return;
      }

      // 2) create customer
      const body = {
        key,
        address: formData.address || "",
        allowInvoicing: !!formData.allowInvoicing,
        blackList: !!formData.blacklistedCustomer,
        ccNumber: "",
        ccToken: "",
        ccType: "",
        cityId: 0,
        dateOfBirth: formData.dateOfBirth ? `${formData.dateOfBirth}T00:00:00` : null,
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
        siteId: String(formData.assignToLocSite), // from site dropdown
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
        return;
      }

      console.log("Customer created:", createData?.data ?? createData);
      console.log("redirect to checkout");
    } catch (err) {
      console.error("Proceed/Customer flow error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto px-12 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="space-y-8">
            <section className="bg-white rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-dashed border-gray-200">
                <div className="bg-blue-100 p-2 rounded">
                  <User size={20} className="text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Personal information</h2>
              </div>

              <PersonalInfo
                siteData={siteData}
                formData={formData}
                onChange={handleInputChange}
                onToggle={handleToggle}
              />

              {/* Next button only when required fields ready */}
              {canProceed && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleProceedToCheckout}
                    disabled={loading}
                    className="px-5 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60"
                  >
                    {loading ? "Please wait..." : "Next"}
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;

// refresh helpers (same as before)
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
      body: JSON.stringify({ key, refreshToken: currentRefresh, token: currentAccess }),
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
