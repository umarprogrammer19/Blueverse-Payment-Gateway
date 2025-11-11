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

    // NEW: single selection (one package)
    const [selectedId, setSelectedId] = useState(null);

    // keep URL hash in sync
    useEffect(() => {
        if (typeof window !== "undefined") {
            window.location.hash = productToHash(product);
        }
    }, [product]);

    // fetch washbooks
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

    // filter packages by category
    const filteredPackages = useMemo(() => {
        if (product === "business") return items.filter(i => /express/i.test(i.washbookName || ""));
        if (product === "premium") return items.filter(i => /manual/i.test(i.washbookName || ""));
        return items.filter(i => /wash\s*book/i.test(i.washbookName || "")); // memberships
    }, [items, product]);

    // when category changes or filtered list updates, default-select first item
    useEffect(() => {
        if (filteredPackages.length) {
            setSelectedId(String(filteredPackages[0].washbookId));
        } else {
            setSelectedId(null);
        }
    }, [filteredPackages]);

    const selectedItem = useMemo(
        () => filteredPackages.find(p => String(p.washbookId) === String(selectedId)) || null,
        [filteredPackages, selectedId]
    );

    const subtotal = selectedItem ? Number(selectedItem.washbookPrice || 0) : 0;
    const discounts = 0; // plug your coupon logic later
    const tax = 0;       // plug your tax calculation later
    const total = Math.max(subtotal - discounts + tax, 0);

    const handleApplyCoupon = () => {
        console.log("Apply coupon:", couponCode);
    };
    const handleCheckout = () => {
        console.log("CHECKOUT clicked with:", {
            category: product,
            selected: selectedItem,
            subtotal, discounts, tax, total
        });
    };

    return (
        <div className="container mx-auto py-14 max-w-2xl">
            {/* Only selector is ProductSelect */}
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
                    {filteredPackages.map((p) => {
                        const isSelected = String(p.washbookId) === String(selectedId);
                        return (
                            <button
                                key={p.washbookId}
                                type="button"
                                onClick={() => setSelectedId(String(p.washbookId))}
                                className={`p-4 cursor-pointer border rounded-lg bg-white text-left transition
                  ${isSelected ? "border-blue-600 ring-2 ring-blue-200" : "hover:border-gray-400"}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            readOnly
                                            checked={isSelected}
                                            className="w-4 h-4"
                                        />
                                        <div>
                                            <div className="font-medium">{p.washbookName}</div>
                                            {p.numberOfWashes && (
                                                <div className="text-sm text-gray-600">{p.numberOfWashes} wash(es)</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-lg font-semibold">
                                        ${Number(p.washbookPrice || 0).toFixed(2)}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            <PurchaseSummary
                // NEW: pass selection + numbers
                selectedPackage={selectedItem}
                subtotal={subtotal}
                discounts={discounts}
                tax={tax}
                total={total}
                // existing props
                couponCode={couponCode}
                onCouponChange={(e) => setCouponCode(e.target.value)}
                onApplyCoupon={handleApplyCoupon}
                onCheckout={handleCheckout}
            />
        </div>
    );
}
