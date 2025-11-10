import { useEffect, useState } from "react";
import { setTokens } from "./auth";
import { Car, User } from "lucide-react";
import PersonalInfo from "./components/sections/PersonalInfo";
import CarInfo from "./components/sections/CarInfo";
import ProductSelect from "./components/sections/ProductSelect";
import PurchaseSummary from "./components/sections/PurchaseSummary";

function App() {
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
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleApplyCoupon = () => {
    console.log("Applied coupon:", formData.couponCode)
  }

  const handleCheckout = () => {
    console.log("Checkout:", formData)
  }


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
    <main className="mx-auto px-12 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Form */}
        <div className="lg:col-span-2">
          <div className="space-y-8">
            {/* Personal Information */}
            <section className="bg-white rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-dashed border-gray-200">
                <div className="bg-blue-100 p-2 rounded">
                  <User size={20} className="text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Personal information</h2>
              </div>
              <PersonalInfo formData={formData} onChange={handleInputChange} />
            </section>

            {/* Car Information */}
            <section className="bg-white rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-dashed border-gray-200">
                <div className="bg-blue-100 p-2 rounded">
                  <Car size={20} className="text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Car information</h2>
              </div>
              <CarInfo formData={formData} onChange={handleInputChange} />
            </section>

            {/* Payment Information */}
            {/* <section className="bg-white rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-dashed border-gray-200">
                                <div className="bg-blue-100 p-2 rounded">
                                    <CreditCard size={20} className="text-blue-600" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900">Payment information</h2>
                            </div>
                            <PaymentInfo
                                formData={formData}
                                onChange={handleInputChange}
                                showSecurity={showSecurity}
                                setShowSecurity={setShowSecurity}
                            />
                        </section> */}
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Product Select */}
            <section className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select products</h3>
              <ProductSelect />
            </section>

            {/* Purchase Summary */}
            <section className="bg-white rounded-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Your purchase</h3>
              <PurchaseSummary
                couponCode={formData.couponCode}
                onCouponChange={(e) => handleInputChange(e)}
                onApplyCoupon={handleApplyCoupon}
                onCheckout={handleCheckout}
              />
            </section>
          </div>
        </div>
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
