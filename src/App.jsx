import { User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { setTokens } from "./auth";
import PersonalInfo from "./components/sections/PersonalInfo";

function App() {
  const [siteData, setSiteData] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);

  const [customerId, setCustomerId] = useState(null);
  const [vehicleId, setVehicleId] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]); 
  const [selectedMembership, setSelectedMembership] = useState(null); 

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
    couponCode: "", // <-- promo code lives here
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

  const sites = Array.isArray(siteData?.data) ? siteData.data : [];
  const selectedSite = useMemo(() => {
    return sites.find(
      s => String(s?.id ?? s?.siteId) === String(formData.assignToLocSite)
    );
  }, [sites, formData.assignToLocSite]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleToggle = (name) => {
    setFormData((prev) => ({ ...prev, [name]: !prev[name] }));
  };

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
        if (!authRes.ok) return console.error("Auth failed:", authRes.status);

        const authData = await authRes.json();
        console.log("AuthenticateUser response:", authData);

        const accessToken = authData?.data?.accessToken;
        const refreshToken = authData?.data?.refreshToken;
        const keyFromLogin = authData?.data?.key;
        if (!accessToken || !refreshToken) return console.warn("Tokens missing");

        setTokens({ accessToken, refreshToken });
        if (keyFromLogin) setApiKey(keyFromLogin);

        // get sites
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
        console.log("Sites Response:", sitesData);

        scheduleTokenRefresh();
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);


  const handleApplyDiscount = async () => {
    try {
      setLoading(true);
      const base = import.meta.env.VITE_API_BASE_URL;
      const token = localStorage.getItem("accessToken");
      const key = apiKey || import.meta.env.VITE_API_KEY || "";
      const promo = (formData.couponCode || "").trim();

      if (!promo) {
        console.warn("Please enter a discount/promo code.");
        return;
      }
      if (!formData.assignToLocSite) {
        console.warn("Please select a Site first.");
        return;
      }

      // Build payload from what we have
      const payload = buildInvoicePayload({
        key,
        siteId: Number(formData.assignToLocSite) || formData.assignToLocSite,
        promoCode: promo,
        customerId,
        vehicleId,
        services: selectedServices,
        membership: selectedMembership,
      });

      const res = await fetch(`${base}/api/invoice/gettotalamount`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("gettotalamount failed:", data);
        return;
      }

      console.log("gettotalamount payload →", payload);
      console.log("gettotalamount response ←", data);
      // yahan aap UI par totals dikhana chahen to state me rakh sakte hain
      // setInvoiceTotals(data);
    } catch (e) {
      console.error("Apply Discount error:", e);
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
                onApplyCoupon={handleApplyDiscount} 
                applying={loading}
              />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;

// ----------------------------------
// helpers
// ----------------------------------
function buildInvoicePayload({
  key,
  siteId,
  promoCode,
  customerId = null,
  vehicleId = null,
  services = [],
  membership = null,
}) {
  const base = {
    key,
    siteId,
    customerData: customerId ? { customerId } : undefined,
    vehicleData: vehicleId ? { vehicleId } : undefined,

    // If you have real amounts, set them. For now 0 (API will calculate).
    totalAmount: 0,
    subtotal: 0,
    redemptions: 0,
    discounts: 0,
    tax: 0,

    status: "draft",
    source: "web",
    sourceId: 0,
    siteLaneId: 0,
    notes: "",
    captureMethod: "manual",
    appVersion: "web",

    serviceSaleList: Array.isArray(services)
      ? services.map((s) => ({
        serviceId: s.serviceId ?? 0,
        amount: Number(s.amount ?? 0),
        isRecurring: !!s.isRecurring,
        isPrepaid: !!s.isPrepaid,
        isWashbook: !!s.isWashbook,
        redeemId: s.redeemId ?? 0,
      }))
      : [],

    membershipSaleList: membership
      ? [{ membershipId: membership.membershipId, isNewSignUp: !!membership.isNewSignUp }]
      : [],

    paymentTypeList: [], // only for totals calc — keep empty
    giftCardSaleList: [],
    washbookSaleList: [],
    giftCardRedeemList: [],
    washbookRedeemList: [],

    // PROMO CODE lands here:
    discountRedeemList: promoCode
      ? [
        {
          discountId: 0,
          instanceType: "code",
          // Backend often accepts the code as "instanceId" when instanceType === "code"
          // If your API wants a numeric discountId instead, replace this with that.
          instanceId: promoCode,
          membershipId: 0,
          discountValue: 0,
        },
      ]
      : [],
  };

  return deepStripUndefined(base);
}

// remove undefined keys recursively to keep payload clean
function deepStripUndefined(obj) {
  if (Array.isArray(obj)) {
    return obj
      .map((v) => deepStripUndefined(v))
      .filter((v) => v !== undefined && !(typeof v === "object" && v !== null && Object.keys(v).length === 0));
  } else if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const vv = deepStripUndefined(v);
      if (vv !== undefined && !(typeof vv === "object" && vv !== null && Object.keys(vv).length === 0)) {
        out[k] = vv;
      }
    }
    return out;
  }
  return obj;
}

// refresh helpers
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
