import CryptoJS from "crypto-js";      // Library for cryptographic functions
import { ChevronUp } from "lucide-react"; // UI icon component
import moment from "moment-timezone";  // Date/time manipulation with timezone support
import { useMemo, useState, useEffect } from "react"; // React hooks


/**
 * Purchase summary component that displays order details and handles payment processing
 * @param {Object} selectedPackage - The selected membership or washbook package
 * @param {number} subtotal - Subtotal amount before discounts and taxes
 * @param {number} discounts - Discount amount
 * @param {number} tax - Tax amount
 * @param {number} total - Total amount (not currently used)
 * @param {string} couponCode - Current coupon code input
 * @param {Function} onCouponChange - Handler for coupon code changes
 * @param {Function} onApplyCoupon - Handler for applying coupon
 * @param {Function} onCheckout - Handler for checkout process
 * @param {string} environment - IPG environment URL
 * @param {string} sharedSecret - Secret key for signature generation
 * @param {string} storeName - Store identifier for IPG
 * @param {string} language - Language code
 * @param {string} defaultTxnType - Default transaction type
 * @param {string} defaultCurrency - Default currency code
 * @param {string} defaultPaymentMethod - Default payment method
 * @param {string} defaultCheckoutOption - Default checkout option
 * @param {string} responseFailURL - URL for failed transactions
 * @param {string} responseSuccessURL - URL for successful transactions
 * @param {string} transactionNotificationURL - URL for transaction notifications
 * @param {Date|null} expirationDate - Coupon expiration date
 * @param {boolean} isUsed - Whether coupon is used
 * @param {boolean} isProcessing - Whether checkout is in progress
 */
export default function PurchaseSummary({
    selectedPackage,
    subtotal = 0,
    discounts = 0,
    tax = 0,
    total = 0,
    couponCode,
    onCouponChange,
    onApplyCoupon,
    onCheckout,
    // environment = "https://www.ipg-online.com/connect/gateway/processing",
    // sharedSecret = "8Ny5Wm6+c)",
    // storeName = "811676312541",
    environment = "https://test.ipg-online.com/connect/gateway/processing", // Test IPG environment
    sharedSecret = "2zuW4j)G3.", // Test shared secret
    storeName = "811676300198", // Test store name
    language = "en_US",
    defaultTxnType = "sale",
    defaultCurrency = "784", // AED currency code
    defaultPaymentMethod = "",
    defaultCheckoutOption = "combinedpage",
    responseFailURL = "https://blueverse-test-env-checkout.netlify.app/.netlify/functions/ipg-fail",
    responseSuccessURL = "https://blueverse-test-env-checkout.netlify.app/.netlify/functions/ipg-success",
    transactionNotificationURL = "",
    expirationDate = null,
    isUsed = false,
    isProcessing = false,
}) {
    // State variables for IPG transaction parameters
    const [timezone, setTimezone] = useState("Asia/Dubai"); // Timezone for transaction
    const [txntype, setTxntype] = useState(defaultTxnType); // Transaction type
    const [currency, setCurrency] = useState(defaultCurrency); // Transaction currency
    const [paymentMethod, setPaymentMethod] = useState(defaultPaymentMethod); // Payment method
    const [checkoutoption, setCheckoutoption] = useState(defaultCheckoutOption); // Checkout option
    const [oid, setOid] = useState(""); // Order ID for transaction

    // State variables for UI controls
    const [couponError, setCouponError] = useState(""); // Error message for coupon
    const [termsAccepted, setTermsAccepted] = useState(false); // Whether terms are accepted
    const [detailsOpen, setDetailsOpen] = useState(false);  // Whether details accordion is open
    const [couponAccordionOpen, setCouponAccordionOpen] = useState(false);  // Whether coupon accordion is open

    // Effect to save transaction ID to localStorage
    useEffect(() => {
        if (oid) {
            localStorage.setItem("transaction id", oid);
        }
    }, [oid]);

    // Memoized transaction datetime in the specified timezone
    const txndatetime = useMemo(
        () => moment().tz(timezone).format("YYYY:MM:DD-HH:mm:ss"),
        [timezone]
    );

    // Convert and normalize numeric values
    const subtotalNum = Number(subtotal) || 0;
    const discountsNum = Number(discounts) || 0;
    const baseAmount = Math.max(subtotalNum - discountsNum, 0); // Amount after discounts

    // Calculate 5% VAT on the base amount
    const vatAmount = useMemo(() => {
        const vat = baseAmount * 0.05;
        return Number.isFinite(vat) ? vat : 0;
    }, [baseAmount]);

    // Calculate final total including VAT
    const chargeTotal = useMemo(() => {
        const totalWithVat = baseAmount + vatAmount;
        return totalWithVat.toFixed(2); // Format to 2 decimal places
    }, [baseAmount, vatAmount]);

    /**
     * Creates a HMAC-SHA256 signature for IPG transaction parameters
     * @param {Object} paymentParams - Payment parameters to sign
     * @param {string} secret - Secret key for signature generation
     * @returns {string} Base64 encoded HMAC signature
     */
    function createSignature(paymentParams, secret) {
        // Set of keys to exclude from signature calculation
        const ignore = new Set(["hashExtended"]);
        // Get sorted keys of parameters (excluding empty values and ignored keys)
        const sortedKeys = Object.keys(paymentParams)
            .filter((k) => paymentParams[k] !== "" && !ignore.has(k))
            .sort();

        // Convert values to strings for signature
        const messageSignatureContent = sortedKeys.map((k) =>
            String(paymentParams[k])
        );
        // Join values with pipe character for signature input
        const raw = messageSignatureContent.join("|");
        // Create HMAC-SHA256 hash
        const hmac = CryptoJS.HmacSHA256(raw, secret);
        // Return Base64 encoded signature
        return CryptoJS.enc.Base64.stringify(hmac);
    }

    // Check if selected package is a membership (vs washbook)
    const isMembership = !!selectedPackage?.membershipId;

    /**
     * Builds the payment parameters object for IPG transaction
     * @returns {Object} Payment parameters object
     */
    function buildPaymentParams() {
        // Base payment parameters for IPG
        const base = {
            hash_algorithm: "HMACSHA256",       // Algorithm for signature generation
            language,                          // Transaction language
            hashExtended: "",                 // Will be populated with signature
            txntype,                          // Transaction type (sale, etc.)
            timezone,                        // Timezone for transaction
            txndatetime,                     // Transaction datetime
            storename: storeName,            // Store identifier
            chargetotal: chargeTotal,        // Total amount to charge
            currency,                       // Currency code
            paymentMethod,                  // Payment method
            oid,                           // Order ID
            checkoutoption,                // Checkout option
            responseFailURL,              // URL for failed transactions
            responseSuccessURL,           // URL for successful transactions
            transactionNotificationURL,  // URL for transaction notifications
        };

        // Add recurring parameters if this is a membership
        if (isMembership) {
            base.recurringInstallmentCount = 12;      // 12 months for membership
            base.recurringInstallmentPeriod = "month"; // Monthly billing
            base.recurringInstallmentFrequency = 1;   // Every month
        }

        return base;
    }

    /**
     * Submits payment parameters to IPG gateway via form submission
     */
    function submitToIPG() {
        const params = buildPaymentParams(); // Get payment parameters
        const hashExtended = createSignature(params, sharedSecret); // Generate signature
        const form = document.createElement("form"); // Create form element
        form.method = "POST"; // Set form method to POST
        form.action = environment; // Set form action to IPG environment
        const allParams = { ...params, hashExtended }; // Include signature in parameters
        // Add all parameters as hidden inputs
        Object.entries(allParams).forEach(([name, value]) => {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = name;
            input.value = value ?? ""; // Use empty string if value is null/undefined
            form.appendChild(input);
        });

        document.body.appendChild(form); // Append form to body
        form.submit(); // Submit the form
    }

    /**
     * Handles the checkout process
     * Validates terms acceptance and calls the onCheckout callback before submitting to IPG
     */
    const handleCheckout = async () => {
        if (!termsAccepted) return; // Require terms acceptance

        // Call the checkout callback if provided
        if (typeof onCheckout === "function") {
            try {
                const result = await onCheckout();
                if (result === false) return; // Stop if checkout callback returns false
            } catch (err) {
                console.error("onCheckout error:", err);
                return;
            }
        }
        submitToIPG(); // Submit to IPG gateway
    };

    /**
     * Validates the coupon based on expiration and usage status
     * @returns {boolean} True if coupon is valid, false otherwise
     */
    function validateCoupon() {
        // If no expiration date and not used, coupon is valid
        if (!expirationDate && !isUsed) {
            setCouponError("");
            return true;
        }

        // Check if coupon is expired
        if (expirationDate) {
            const now = moment(); // Current time
            const exp = moment(expirationDate); // Expiration time

            if (exp.isBefore(now)) {
                setCouponError("This coupon has expired.");
                return false;
            }
        }

        // Check if coupon is already used
        if (isUsed) {
            setCouponError("This coupon has already been used.");
            return false;
        }

        setCouponError("");
        return true;
    }

    /**
     * Handles the coupon application process
     * Validates coupon and calls the onApplyCoupon callback
     */
    const handleApplyCouponClick = () => {
        const isValid = validateCoupon(); // Validate coupon first
        if (!isValid) return;
        if (typeof onApplyCoupon === "function") onApplyCoupon(); // Apply if valid
    };

    // Get selected package name and price
    const selectedName =
        selectedPackage?.washbookName || selectedPackage?.membershipName || "";
    const selectedPrice = selectedPackage
        ? Number(
            selectedPackage.washbookPrice ?? selectedPackage.membershipPrice ?? 0
        )
        : 0;

    // JSX for displaying order details (without total - total is displayed separately)
    const detailsContent = (
        <>
            {/* Selected Package Information */}
            <div className="space-y-2">
                <h4 className="font-semibold">Selected package</h4>
                {selectedPackage ? (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-700">{selectedName}</span>
                        <span className="text-gray-900">
                            د.إ{selectedPrice.toFixed(2)}
                        </span>
                    </div>
                ) : (
                    <div className="text-sm text-gray-500">
                        Please select a package above.
                    </div>
                )}
            </div>

            {/* Order Summary (excluding total) */}
            <div className="space-y-3 py-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">
                        د.إ{subtotalNum.toFixed(2)}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discounts</span>
                    <span className="text-gray-900">
                        -د.إ{discountsNum.toFixed(2)}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (5% VAT)</span>
                    <span className="text-gray-900">
                        د.إ{vatAmount.toFixed(2)}
                    </span>
                </div>
            </div>
        </>
    );

    return (
        <div className="space-y-6">
            {/* Mobile: Coupon Code Accordion */}
            <div className="border border-gray-200 rounded-lg md:hidden">
                <button
                    type="button"
                    onClick={() => setCouponAccordionOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between px-4 py-3 text-md font-medium text-gray-700"
                >
                    <span>Discounts</span>
                    <span className={`transform transition-transform ${couponAccordionOpen ? "rotate-180" : ""}`}>
                        <ChevronUp />
                    </span>
                </button>

                {couponAccordionOpen && (
                    <div className="px-4 pb-4 pt-1 space-y-4">
                        <div>
                            {/* stay in one row */}
                            <div className="flex gap-2 items-start">
                                <input
                                    type="text"
                                    name="couponCode"
                                    placeholder="Enter code"
                                    value={couponCode}
                                    onChange={onCouponChange}
                                    className="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />

                                <button
                                    onClick={handleApplyCouponClick}
                                    type="button"
                                    className="shrink-0 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                                >
                                    Apply
                                </button>
                            </div>

                            {couponError && (
                                <p className="mt-1 text-sm text-red-600">{couponError}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>


            {/* Mobile: Details Accordion (no total inside) */}
            <div className="border border-gray-200 rounded-lg md:hidden">
                <button
                    type="button"
                    onClick={() => setDetailsOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between px-4 py-3 text-md font-medium text-gray-700"
                >
                    <span>Invoice Details</span>
                    <span className={`transform transition-transform ${detailsOpen ? "rotate-180" : ""}`}>
                        <ChevronUp />
                    </span>
                </button>
                {detailsOpen && (
                    <div className="px-4 pb-4 pt-1 space-y-4">{detailsContent}</div>
                )}
            </div>

            {/* Desktop / Tablet: coupon code and details always visible */}
            <div className="hidden md:block space-y-4">
                {/* Coupon code widget for desktop/tablet */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount or coupon code
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            name="couponCode"
                            placeholder="Enter code"
                            value={couponCode}
                            onChange={onCouponChange}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <button
                            onClick={handleApplyCouponClick}
                            type="button"
                            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                        >
                            Apply
                        </button>
                    </div>
                    {couponError && (
                        <p className="mt-1 text-sm text-red-600">{couponError}</p>
                    )}
                </div>
                {/* Details */}
                {detailsContent}
            </div>

            {/* Total ALWAYS outside dropdown */}
            <div className="flex justify-between items-center py-4 border-t border-gray-200 border-b">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">
                    د.إ{chargeTotal}
                    {isMembership && (
                        <span className="text-base text-gray-600">/month</span>
                    )}
                </span>
            </div>
            {/* Terms */}
            <div className="flex relative left-1 items-center gap-2">
                <input
                    type="checkbox"
                    id="terms"
                    required
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-4 h-4 border border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                    I agree to the{" "}
                    <a href="https://test.blueverse.ae/terms-conditions/" className="text-blue-600 hover:underline">
                        Terms of Service
                    </a>
                </label>
            </div>
            {/* Checkout */}
            <button
                onClick={handleCheckout}
                disabled={!selectedPackage || isProcessing || !termsAccepted}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
                {isProcessing ? "Processing..." : "CHECKOUT"}
            </button>
        </div>
    );
}
