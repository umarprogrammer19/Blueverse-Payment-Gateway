import { useEffect, useMemo, useState } from "react";
import PurchaseSummary from "../components/sections/PurchaseSummary";
import { useCheckout } from "../context/CheckoutContext.jsx";

/**
 * Converts a string to a URL-friendly slug format
 * @param {string} str - Input string to convert
 * @returns {string} Slugified version of the input string
 */
const slugify = (str = "") =>
    str
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

/**
 * Gets the price of an item (either membership or washbook)
 * @param {Object} item - Item object with price information
 * @returns {number} Price of the item
 */
const getItemPrice = (item) => {
    if (!item) return 0;
    if (item.membershipPrice != null) return Number(item.membershipPrice) || 0;
    if (item.washbookPrice != null) return Number(item.washbookPrice) || 0;
    return 0;
};

/**
 * Handles special vehicle pricing based on URL hash (sedan or suv)
 * @param {string} slug - URL hash string
 * @returns {Object|null} Special vehicle price object or null if not matched
 */
const getSpecialVehiclePrice = (slug) => {
    // Check if slug matches sedan pattern (with optional price)
    const sedanMatch = slug.match(/^sedan(?:-([\d.]+))?$/i);
    if (sedanMatch) {
        const price = sedanMatch[1] ? Number(sedanMatch[1]) : 103.95; // Default sedan price
        return {
            membershipName: "Sedan",
            membershipPrice: price,
            slug: "sedan",
            membershipId: "sedan-special", // fake ID for localStorage
        };
    }

    // Check if slug matches suv pattern (with optional price)
    const suvMatch = slug.match(/^suv(?:-([\d.]+))?$/i);
    if (suvMatch) {
        const price = suvMatch[1] ? Number(suvMatch[1]) : 150.0; // default SUV price
        return {
            membershipName: "SUV",
            membershipPrice: price,
            slug: "suv",
            membershipId: "suv-special", // fake ID for localStorage
        };
    }

    return null;
};

/**
 * Membership selection page component that handles package selection and coupon application
 * @param {Function} onEnsureCustomer - Callback function called before checkout
 * @param {boolean} isProcessing - Flag indicating if checkout is in progress
 */
export default function Membership({ onEnsureCustomer, isProcessing = false }) {
    // State variables for managing items, coupon code, loading state, etc.
    const [items, setItems] = useState([]);           // List of available packages
    const [couponCode, setCouponCode] = useState(""); // Currently entered coupon code
    const [loading, setLoading] = useState(true);     // Loading state for initial data fetch
    const [applying, setApplying] = useState(false);  // Loading state for coupon application
    const [serverTotals, setServerTotals] = useState(null); // Calculated totals from server
    const [selectedAddOns, setSelectedAddOns] = useState([]); // Selected add-on services

    const initial = "Membership";
    const [product, setProduct] = useState(initial);  // Current product category

    // Access API key and site ID from checkout context
    const { apiKey, siteId } = useCheckout();
    const [slugFromHash, setSlugFromHash] = useState(""); // URL hash for direct package selection

    // Effect to handle URL hash changes for direct package selection
    useEffect(() => {
        const updateSlug = () => {
            // Extract and normalize the hash portion of the URL
            const hash = window.location.hash || "";
            const normalized = hash.replace("#", "").trim().toLowerCase();
            setSlugFromHash(normalized);
        };

        updateSlug(); // Initial call to handle current hash
        // Listen for hash changes
        window.addEventListener("hashchange", updateSlug);
        // Cleanup listener on component unmount
        return () => window.removeEventListener("hashchange", updateSlug);
    }, []);

    // Effect to fetch washbooks and memberships from API
    useEffect(() => {
        if (!apiKey) return;

        (async () => {
            try {
                const base = import.meta.env.VITE_API_BASE_URL;
                const token = localStorage.getItem("accessToken");
                const key = apiKey || localStorage.getItem("apiKey") || "";

                // Build URLs for washbook and membership endpoints
                const urlWashbook = `${base}/api/washbook?key=${encodeURIComponent(key)}&pageSize=10000&target=table&type=0&isActive=true`;
                const urlMembership = `${base}/api/membership?key=${encodeURIComponent(key)}&pageSize=10000&target=table&type=0&isActive=true`;

                // Fetch both washbooks and memberships simultaneously
                const [resWash, resMem] = await Promise.all([
                    fetch(urlWashbook, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`, // Include auth token
                        },
                    }),
                    fetch(urlMembership, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`, // Include auth token
                        },
                    }),
                ]);
                const dataWash = await resWash.json();
                const dataMem = await resMem.json();

                // Merge washbook and membership data
                const merged = (Array.isArray(dataWash?.data) ? dataWash.data : []).concat(
                    Array.isArray(dataMem?.data) ? dataMem.data : []
                );

                // Add slugs to items for URL-based selection
                const withSlugs = merged.map((item) => {
                    const name = item.membershipName || item.washbookName;
                    return {
                        ...item,
                        slug: slugify(name), // Generate slug from name
                    };
                });
                setItems(withSlugs);
            } catch (e) {
                console.error("Membership fetch error:", e);
            } finally {
                setLoading(false); // Stop loading indicator
            }
        })();
    }, [apiKey]);

    // Memoized selection of the current item based on URL hash or defaults
    const selectedItem = useMemo(() => {
        // First check for special vehicle pricing (sedan/suv with optional price)
        const specialVehicle = getSpecialVehiclePrice(slugFromHash);
        if (specialVehicle) {
            return specialVehicle;
        }

        if (!items.length) return null;

        // Check if a specific item is selected via URL hash
        if (slugFromHash) {
            console.log(slugFromHash);
            const bySlug = items.find((i) => i.slug === slugFromHash);
            console.log(bySlug);
            if (bySlug) return bySlug;
        }

        // Default to first membership item if available
        const firstMembership = items.find((i) =>
            /membership/i.test(i.membershipName || "")
        );
        console.log(firstMembership);

        // Return first membership, or first item, or null
        return firstMembership || items[0] || null;
    }, [items, slugFromHash]);

    // Effect to save selected package information to localStorage
    useEffect(() => {
        if (selectedItem) {
            // Store package information for use in success page
            localStorage.setItem("selectedPackageInfo", JSON.stringify({
                type: (selectedItem.membershipId ? "membership" : "washbook"), // Determine package type
                id: selectedItem.membershipId || selectedItem.washbookId || selectedItem.slug, // Package ID
                name: selectedItem.membershipName || selectedItem.washbookName || selectedItem.slug, // Package name
                price: selectedItem.membershipPrice || selectedItem.washbookPrice || 0 // Package price
            }));
        }
    }, [selectedItem]);

    // Calculate totals for display
    const fallbackSubtotal = getItemPrice(selectedItem); // Base price of selected item
    const subtotal = selectedAddOns.reduce((total, addOn) => total + addOn.price, fallbackSubtotal); // Add add-on prices
    const discounts = serverTotals?.discounts ?? 0; // Discount amount from server or 0
    const tax = serverTotals?.tax ?? 0;             // Tax amount from server or 0
    const total = serverTotals?.totalAmount ?? Math.max(subtotal - discounts + tax, 0); // Final total

    /**
     * Handles applying a coupon code to the current selection
     * Validates the coupon and calculates discount amount
     */
    const handleApplyCoupon = async () => {
        const promo = couponCode.trim().toUpperCase(); // Normalize coupon code
        if (!promo) return console.log("Empty code — skipping");
        if (!siteId) return console.error("Missing siteId");
        if (!selectedItem) return console.error("Select a package first (via slug)");

        try {
            setApplying(true); // Show loading indicator
            const base = import.meta.env.VITE_API_BASE_URL;
            const token = localStorage.getItem("accessToken");
            const key = apiKey || localStorage.getItem("apiKey") || "";

            // Fetch available coupon codes
            const url = `${base}/api/couponpackage/codelist?key=${encodeURIComponent(
                key
            )}&pageSize=100&pageNumber=1&isActive=true`;
            const res = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`, // Include auth token
                },
            });
            const json = await res.json();
            const list = Array.isArray(json?.data) ? json.data : [];

            // Find matching coupon code
            const match = list.find(
                (c) => String(c.couponCode || "").toUpperCase() === promo
            );

            if (!match) {
                console.warn("Invalid code");
                return;
            }

            // Validate coupon expiration and usage status
            const now = Date.now();
            const expOk =
                !match.expirationDate ||
                new Date(match.expirationDate).getTime() > now;
            const notUsed = !match.isUsed;
            if (!expOk || !notUsed) {
                console.warn("Code expired/used/not applicable");
                return;
            }

            // Calculate discount based on coupon type
            const DISCOUNT_TYPE = { FIXED: 1, PERCENT: 2 };
            const sub = subtotal; // Current subtotal
            const val = Number(match.discountValue || 0); // Discount value

            let discount = 0;
            if (match.discountTypeId === DISCOUNT_TYPE.PERCENT) {
                discount = +(sub * (val / 100)).toFixed(2); // Percentage discount
            } else if (match.discountTypeId === DISCOUNT_TYPE.FIXED) {
                discount = +Math.min(val, sub).toFixed(2);  // Fixed discount (capped at subtotal)
            } else {
                discount = +Math.min(val, sub).toFixed(2);  // Default to fixed discount
            }

            const totalAfter = Math.max(sub - discount, 0); // Calculate final total

            // Update server totals with discount information
            setServerTotals({
                subtotal: sub,
                discounts: discount,
                tax: 0,
                totalAmount: totalAfter,
            });
        } catch (e) {
            console.error("Apply Coupon (GET list) error:", e);
        } finally {
            setApplying(false); // Hide loading indicator
        }
    };

    /**
     * Handles the checkout process
     * Calls the onEnsureCustomer callback and logs checkout information
     * @returns {boolean} True if checkout is successful, false otherwise
     */
    const handleCheckout = async () => {
        if (!selectedItem) return false;
        // Call the customer validation function if provided
        if (typeof onEnsureCustomer === "function") {
            const ok = await onEnsureCustomer();
            if (!ok) return false;
        }
        // Log checkout information for debugging
        console.log("CHECKOUT with:", { category: product, selected: selectedItem, totals: { subtotal, discounts, tax, total } });
        return true;
    };

    return (
        <div className="container mx-auto max-w-2xl">
            {/* Show loading or error messages based on state */}
            {loading ? (
                <p>Loading...</p>
            ) : !selectedItem ? (
                <p>No product found for this link.</p>
            ) : (
                // Display selected package information
                <div className="hidden sm:flex mb-6 p-5 border rounded-xl bg-white shadow-sm items-center justify-between">
                    <div>
                        <div className="font-medium">
                            {selectedItem.membershipName || selectedItem.washbookName}
                        </div>
                        {/* Show number of washes if available */}
                        {selectedItem.numberOfWashes && (
                            <div className="text-sm text-gray-600">
                                {selectedItem.numberOfWashes} wash(es)
                            </div>
                        )}
                    </div>
                    {/* Display price in AED */}
                    <div className="text-lg font-semibold text-[#2162AF]">
                        د.إ{getItemPrice(selectedItem).toFixed(2)}
                    </div>
                </div>
            )}

            {/* Commented out add-on functionality for sedan/suv */}
            {/* {(slugFromHash === "sedan" || slugFromHash.startsWith("sedan-") || slugFromHash === "suv" || slugFromHash.startsWith("suv-")) && <p className="relative text-md font-bold left-2.5">Add Ons:</p>}
            {(slugFromHash === "sedan" || slugFromHash.startsWith("sedan-") || slugFromHash === "suv" || slugFromHash.startsWith("suv-")) && (
                <div className="button-container mb-6">
                    {availableAddOns.map((addOn) => (
                        <button
                            key={addOn.name}
                            onClick={() => handleAddOnClick(addOn)}
                            className={`package-button px-3 py-2 m-2 border rounded-lg text-sm shadow-md ${selectedAddOns.some((item) => item.name === addOn.name)
                                ? "bg-blue-500 text-white"
                                : "bg-white text-gray-700"
                                }`}
                        >
                            {addOn.name} - AED {addOn.price}
                        </button>
                    ))}
                </div>
            )} */}

            {/* Render the purchase summary component */}
            <PurchaseSummary
                selectedPackage={selectedItem}
                addOns={selectedAddOns}
                subtotal={subtotal}
                discounts={discounts}
                tax={tax}
                total={total}
                couponCode={couponCode}
                onCouponChange={(e) => setCouponCode(e.target.value)} // Update coupon code state
                onApplyCoupon={handleApplyCoupon} // Apply coupon functionality
                onCheckout={handleCheckout} // Checkout functionality
                isProcessing={isProcessing || applying} // Show loading state
            />

            {/* Show applying coupon message if needed */}
            {applying && (
                <p className="mt-3 text-sm text-gray-600">Applying code...</p>
            )}
        </div>
    );
}
