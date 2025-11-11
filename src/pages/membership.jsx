"use client";
import { useEffect, useMemo, useState } from "react";
import ProductSelect from "../components/sections/ProductSelect";
import PurchaseSummary from "../components/sections/PurchaseSummary";

const hashToProduct = (hash) => {
    if (/#checkout-express-wash/i.test(hash)) return "business";  // Express
    if (/#checkout-manual-wash/i.test(hash)) return "premium";    // Manual
    return "memberships";
};
const productToHash = (p) =>
    p === "business" ? "#checkout-express-wash"
        : p === "premium" ? "#checkout-manual-wash"
            : "#checkout-memberships";

export default function Membership() {
    const [items, setItems] = useState([]);
    const [couponCode, setCouponCode] = useState("");
    const [loading, setLoading] = useState(true);

    const initial = typeof window !== "undefined" ? hashToProduct(window.location.hash) : "memberships";
    const [product, setProduct] = useState(initial);

    // keep URL hash in sync with dropdown
    useEffect(() => {
        if (typeof window !== "undefined") {
            window.location.hash = productToHash(product);
        }
    }, [product]);

    // fetch washbooks once
    useEffect(() => {
        (async () => {
            try {
                const base = import.meta.env.VITE_API_BASE_URL;
                const token = localStorage.getItem("accessToken");
                const key = localStorage.getItem("apiKey") || import.meta.env.VITE_API_KEY || "";
                const url = `${base}/api/washbook?key=${encodeURIComponent(key)}&ShowOnCustomerPortal=True`;

                const res = await fetch(url, {
                    method: "GET",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setItems(Array.isArray(data?.data) ? data.data : []);
            } catch (e) {
                console.error("washbook fetch error:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // filter by category chosen in ProductSelect
    const filteredPackages = useMemo(() => {
        if (product === "business") {
            // Express
            return items.filter((i) => /express/i.test(i.washbookName || ""));
        }
        if (product === "premium") {
            // Manual
            return items.filter((i) => /manual/i.test(i.washbookName || ""));
        }
        // Memberships (Wash Books)
        return items.filter((i) => /wash\s*book/i.test(i.washbookName || ""));
    }, [items, product]);

    const handleApplyCoupon = () => {
        console.log("Apply coupon:", couponCode);
    };
    const handleCheckout = () => {
        console.log("CHECKOUT clicked with packages:", filteredPackages);
    };

    return (
        <div className="container mx-auto py-14 max-w-2xl">
            {/* Use ProductSelect as the only selector */}
            <ProductSelect value={product} onChange={setProduct} />

            <h2 className="mt-8 mb-4 text-xl font-semibold">
                {product === "business" ? "Express Wash" : product === "premium" ? "Manual Wash" : "Memberships"}
            </h2>

            {loading ? (
                <p>Loading...</p>
            ) : !filteredPackages.length ? (
                <p>No products found.</p>
            ) : (
                <div className="grid grid-cols-1 gap-3 mb-10">
                    {filteredPackages.map((p) => (
                        <div key={p.washbookId} className="p-4 border rounded-lg bg-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{p.washbookName}</div>
                                    {p.numberOfWashes && (
                                        <div className="text-sm text-gray-600">{p.numberOfWashes} wash(es)</div>
                                    )}
                                </div>
                                <div className="text-lg font-semibold">
                                    ${Number(p.washbookPrice || 0).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pass all packages/prices down to PurchaseSummary */}
            <PurchaseSummary
                packages={filteredPackages}
                couponCode={couponCode}
                onCouponChange={(e) => setCouponCode(e.target.value)}
                onApplyCoupon={handleApplyCoupon}
                onCheckout={handleCheckout}
            />
        </div>
    );
}
