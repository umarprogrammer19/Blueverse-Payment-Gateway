import { useEffect, useMemo, useState } from "react";
import { setTokens } from "./auth";
import PersonalInfo from "./components/sections/PersonalInfo";
import { useCheckout } from "./context/CheckoutContext";
import Membership from "./pages/membersip";

/**
 * Main application component that handles user authentication, site selection,
 * customer information collection, and checkout process management
 */
function App() {
  // State variables for managing site data, loading status, and error messages
  const [siteData, setSiteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Access checkout context for API key, site ID, customer ID, and calculated totals
  const { setApiKey, setSiteId, setCustomerId, apiKey, derivedTotals } = useCheckout();

  // Form data state for collecting customer information
  const [formData, setFormData] = useState({
    firstName: "",           // Customer's first name
    lastName: "",            // Customer's last name
    phone: "",               // Customer's phone number
    email: "",               // Customer's email address
    licensePlate: "",        // Customer's license plate number
    cardNumber: "",          // Credit card number (not currently used)
    expirationDate: "",      // Card expiration date (not currently used)
    securityCode: "",        // Card security code (not currently used)
    billingZip: "",          // Billing zip code (not currently used)
    couponCode: "",          // Coupon or discount code
    dateOfBirth: "",         // Customer's date of birth (not currently used)
    address: "",             // Customer's address
    assignToLocSite: "",     // Site ID to assign customer to
    zipCode: "",             // Customer's zip code (not currently used)
    state: "",               // Customer's state
    city: "",                // Customer's city
    loyaltyPoints: "0",      // Loyalty points balance (not currently used)
    allowInvoicing: false,   // Whether invoicing is allowed (not currently used)
    sendText: false,         // Whether to send text notifications (not currently used)
    sendEmail: false,        // Whether to send email notifications (not currently used)
    blacklistedCustomer: false, // Whether customer is blacklisted (not currently used)
    activeCustomer: true,    // Whether customer is active (not currently used)
    region: "Emirates",      // Region for license plate (Emirates or GCC)
    country: "Dubai",        // Country/Emirate for license plate
    alphabeticPart: "",      // Alphabetic part of license plate
    numericPart: ""          // Numeric part of license plate
  });

  /**
   * Saves customer information to localStorage with timestamp
   * @param {Object} data - Customer information to save
   */
  const saveCustomerInfoToStorage = (data) => {
    try {
      // Create payload with current timestamp
      const payload = {
        ...data,
        createdAt: new Date().toISOString(),
      };

      // Save customer info to localStorage
      localStorage.setItem("checkoutCustomerInfo", JSON.stringify(payload));

      // Combine and save license plate parts if both exist
      if (data.alphabeticPart.trim() && data.numericPart.trim()) {
        localStorage.setItem("licensePlate", data.alphabeticPart.trim() + data.numericPart.trim());
      } else {
        // Remove license plate from storage if incomplete
        localStorage.removeItem("licensePlate");
      }
    } catch (e) {
      console.error("Failed to save checkoutCustomerInfo:", e);
    }
  };

  /**
   * Handles input changes in the form and updates both state and localStorage
   * @param {Event} e - Input change event
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Update form data state and save to localStorage
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      saveCustomerInfoToStorage(updated);
      return updated;
    });

    // Update site ID when location assignment changes
    if (name === "assignToLocSite" && value) {
      setSiteId(value);
      localStorage.setItem("siteId", String(value));
    }
  };

  /**
   * Toggles boolean values in the form data
   * @param {string} name - Name of the field to toggle
   */
  const handleToggle = (name) => {
    setFormData((prev) => {
      const updated = { ...prev, [name]: !prev[name] };
      saveCustomerInfoToStorage(updated);
      return updated;
    });
  };

  /**
   * Memoized check to determine if user can proceed to checkout
   * Returns true if required fields (first name, last name, email, phone) are filled
   */
  const canProceed = useMemo(() => {
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.email.trim() &&
      formData.phone.trim()
    );
  }, [formData]);

  // Effect to handle authentication and site data fetching on component mount
  useEffect(() => {
    (async () => {
      try {
        // Authenticate user with predefined credentials
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

        // Extract tokens and API key from authentication response
        const authData = await authRes.json();
        const accessToken = authData?.data?.accessToken;
        const refreshToken = authData?.data?.refreshToken;
        const keyFromLogin = authData?.data?.key;

        if (!accessToken || !refreshToken) {
          console.warn("Missing tokens");
          return;
        }

        // Set tokens in auth module
        setTokens({ accessToken, refreshToken });

        // Store API key in context and localStorage
        if (keyFromLogin) {
          setApiKey(keyFromLogin);
          localStorage.setItem("apiKey", keyFromLogin);
        }

        // Fetch available sites using the API key
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

        // Process and set default site information
        const sitesArray = Array.isArray(sitesData?.data)
          ? sitesData.data
          : [];

        if (sitesArray.length > 0) {
          // Select default site (prefer index 1, fallback to index 0)
          const defaultSite = sitesArray[1] || sitesArray[0];
          const siteValue = defaultSite?.id ?? defaultSite?.siteId;

          if (siteValue) {
            const defaultState = "Al Quoz";
            const defaultCity = "Dubai";

            // Update site ID in context and localStorage
            setSiteId(String(siteValue));
            localStorage.setItem("siteId", String(siteValue));

            // Update form data with default site information
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

        // Schedule automatic token refresh
        scheduleTokenRefresh();
      } catch (e) {
        console.error(e);
      }
    })();
  }, [setApiKey, setSiteId]);

  /**
   * Ensures customer and site information is properly set before proceeding to checkout
   * Validates required fields and prepares data for checkout process
   * @returns {boolean} True if preparation successful, false otherwise
   */
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

      // Save current form data to localStorage
      saveCustomerInfoToStorage(formData);

      // Update site ID if selected
      if (formData.assignToLocSite) {
        setSiteId(formData.assignToLocSite);
        localStorage.setItem("siteId", String(formData.assignToLocSite));
      }

      // Save discount information to localStorage
      if (derivedTotals?.discounts) {
        localStorage.setItem("checkoutDiscounts", String(derivedTotals.discounts));
      } else {
        localStorage.removeItem("checkoutDiscounts");
      }

      // Wait 5 seconds before proceeding (likely for data sync)
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Success - customer creation happens on success page
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

        {/* LEFT: Personal info section */}
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

        {/* RIGHT: Membership / products + checkout section */}
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

/**
 * Refreshes authentication tokens by calling the API endpoint
 * @returns {Object|null} New tokens if successful, null otherwise
 */
async function doRefresh() {
  try {
    const base = import.meta.env.VITE_API_BASE_URL;
    const key = import.meta.env.VITE_API_KEY || "";
    const currentAccess = localStorage.getItem("accessToken");
    const currentRefresh = localStorage.getItem("refreshToken");
    if (!currentAccess || !currentRefresh) return null;

    // Call API to refresh tokens
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

    // Extract new tokens from response
    const nextAccess = data?.data?.accessToken ?? data?.accessToken;
    const nextRefresh = data?.data?.refreshToken ?? data?.refreshToken;
    if (nextAccess && nextRefresh) {
      // Update tokens in localStorage
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

/**
 * Schedules automatic token refresh every 14 minutes
 */
function scheduleTokenRefresh() {
  const FOURTEEN_MIN = 14 * 60 * 1000; // 14 minutes in milliseconds
  setTimeout(async () => {
    const rotated = await doRefresh();
    if (rotated) scheduleTokenRefresh(); // Reschedule if refresh was successful
  }, FOURTEEN_MIN);
}
