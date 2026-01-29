import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

// Create context for checkout state management
const CheckoutContext = createContext(null);

/**
 * Provider component that wraps the app and makes checkout state available to child components
 */
export function CheckoutProvider({ children }) {
    // State variables for managing checkout information
    const [apiKey, setApiKey] = useState("");           // API key for authentication
    const [siteId, setSiteId] = useState(null);        // Selected site ID

    const [customerId, setCustomerId] = useState(null); // Customer ID after creation
    const [vehicleId, setVehicleId] = useState(null);   // Vehicle ID after creation

    const [selectedMembership, setSelectedMembership] = useState(null); // Selected membership package
    const [selectedServices, setSelectedServices] = useState([]);       // Selected service packages

    const [couponCode, setCouponCode] = useState("");   // Applied coupon/discount code
    const [invoiceTotals, setInvoiceTotals] = useState(null) // Calculated invoice totals
    const [applying, setApplying] = useState(false);    // Loading state for discount application

    /**
     * Builds the invoice payload object with all necessary data for API requests
     * @returns {Object} The invoice payload with customer, vehicle, services, and discount information
     */
    const buildInvoicePayload = useCallback(() => {
        const promo = (couponCode || "").trim();

        // Construct the invoice payload with all relevant data
        const payload = {
            key: apiKey,                           // API key for authentication
            siteId: Number(siteId) || siteId,    // Site ID where transaction occurs
            customerData: customerId ? { customerId } : undefined, // Customer information if available
            vehicleData: vehicleId ? { vehicleId } : undefined,   // Vehicle information if available

            // Initialize financial values to 0
            totalAmount: 0,
            subtotal: 0,
            redemptions: 0,
            discounts: 0,
            tax: 0,
            status: "draft",                       // Initial status for the invoice
            source: "web",                       // Source of the transaction
            sourceId: 0,                         // Source identifier
            siteLaneId: 0,                      // Lane ID at the site
            notes: "",                          // Additional notes
            captureMethod: "manual",            // Manual payment capture
            appVersion: "web",                  // Web application version

            // Map selected services to sale list format
            serviceSaleList: Array.isArray(selectedServices)
                ? selectedServices.map((s) => ({
                    serviceId: s.serviceId ?? 0,     // Service ID or default to 0
                    amount: Number(s.amount ?? 0),   // Service amount or default to 0
                    isRecurring: !!s.isRecurring,    // Whether service is recurring
                    isPrepaid: !!s.isPrepaid,        // Whether service is prepaid
                    isWashbook: !!s.isWashbook,      // Whether service is a washbook
                    redeemId: s.redeemId ?? 0,       // Redeem ID or default to 0
                }))
                : [],

            // Create membership sale list if membership is selected
            membershipSaleList: selectedMembership?.membershipId
                ? [{ membershipId: selectedMembership.membershipId, isNewSignUp: !!selectedMembership.isNewSignUp }]
                : [],

            // Initialize empty lists for various transaction types
            paymentTypeList: [],
            giftCardSaleList: [],
            washbookSaleList: [],
            giftCardRedeemList: [],
            washbookRedeemList: [],

            // Add discount information if coupon code is present
            discountRedeemList: promo
                ? [
                    {
                        discountId: 0,              // Discount ID (will be determined by API)
                        instanceType: "code",       // Type of discount instance
                        instanceId: promo,          // Actual coupon code
                        membershipId: 0,            // Associated membership ID
                        discountValue: 0,           // Value will be calculated by API
                    },
                ]
                : [],
        };

        // Remove undefined values from payload before sending
        return deepStripUndefined(payload);
    }, [apiKey, siteId, customerId, vehicleId, selectedServices, selectedMembership, couponCode]);

    /**
     * Applies the discount code to calculate updated invoice totals
     * Calls the API endpoint to validate coupon and calculate amounts
     */
    const applyDiscount = useCallback(async () => {
        const promo = (couponCode || "").trim();
        if (!promo) {
            return;
        }

        try {
            setApplying(true); // Show loading indicator
            const token = localStorage.getItem("accessToken"); // Get authentication token
            const base = import.meta.env.VITE_API_BASE_URL;    // Base API URL

            // Verify required authentication and configuration
            if (!token) {
                console.error("Missing access token");
                return;
            }
            if (!apiKey || !siteId) {
                console.error("Missing apiKey/siteId");
                return;
            }

            // Build payload with current selections and coupon code
            const payload = buildInvoicePayload();

            // Call API to calculate totals with discount
            const res = await fetch(`${base}/api/invoice/gettotalamount`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`, // Include auth token
                },
                body: JSON.stringify(payload), // Send invoice payload
            });

            const data = await res.json();
            if (!res.ok) {
                console.error("gettotalamount failed:", data);
                return;
            }

            // Log for debugging purposes
            console.log("gettotalamount payload →", payload);
            console.log("gettotalamount response ←", data);

            // Update state with calculated totals
            setInvoiceTotals(data);
        } catch (e) {
            console.error("Apply Discount error:", e);
        } finally {
            setApplying(false); // Hide loading indicator
        }
    }, [couponCode, apiKey, siteId, buildInvoicePayload]);

    /**
     * Clears the stored invoice totals
     */
    const clearTotals = useCallback(() => setInvoiceTotals(null), []);

    // Calculate derived totals for UI display with fallbacks if server totals not present
    const derivedTotals = useMemo(() => {
        const d = invoiceTotals?.data || invoiceTotals;
        return {
            subtotal: d?.subtotal ?? sumAmounts(selectedServices) + (selectedMembership?.price ?? 0), // Subtotal from API or calculated
            discounts: d?.discounts ?? 0,      // Discounts from API or default to 0
            tax: d?.tax ?? 0,                 // Tax from API or default to 0
            totalAmount: d?.totalAmount ?? (sumAmounts(selectedServices) + (selectedMembership?.price ?? 0)), // Total from API or calculated
        };
    }, [invoiceTotals, selectedServices, selectedMembership]);

    // Create the context value object with all state and functions
    const value = {
        // State variables
        apiKey, siteId, customerId, vehicleId,
        selectedMembership, selectedServices,
        couponCode, invoiceTotals, derivedTotals, applying,

        // Setter functions for state variables
        setApiKey, setSiteId, setCustomerId, setVehicleId,
        setSelectedMembership, setSelectedServices,
        setCouponCode, setInvoiceTotals, clearTotals,

        // Action functions
        applyDiscount,
    };

    // Provide the context value to child components
    return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

/**
 * Custom hook to access checkout context
 * @returns {Object} The checkout context value
 */
export function useCheckout() {
    const ctx = useContext(CheckoutContext);
    if (!ctx) throw new Error("useCheckout must be used within <CheckoutProvider>");
    return ctx;
}


/**
 * Sums the amounts from a list of service objects
 * @param {Array} list - Array of service objects with amount property
 * @returns {number} The sum of all amounts
 */
function sumAmounts(list) {
    return (list || []).reduce((acc, s) => acc + Number(s.amount ?? 0), 0);
}

/**
 * Recursively removes undefined values from an object or array
 * @param {Object|Array} obj - The object or array to clean
 * @returns {Object|Array} The cleaned object or array
 */
function deepStripUndefined(obj) {
    if (Array.isArray(obj)) {
        return obj
            .map((v) => deepStripUndefined(v)) // Recursively process array items
            .filter((v) => v !== undefined && !(typeof v === "object" && v && Object.keys(v).length === 0)); // Remove undefined and empty objects
    } else if (obj && typeof obj === "object") {
        const out = {};
        for (const [k, v] of Object.entries(obj)) {
            const vv = deepStripUndefined(v); // Recursively process object values
            if (vv !== undefined && !(typeof vv === "object" && vv && Object.keys(vv).length === 0)) out[k] = vv; // Add non-empty values
        }
        return out;
    }
    return obj;
}
