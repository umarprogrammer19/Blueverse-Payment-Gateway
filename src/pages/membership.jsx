"use client";
import { useEffect, useMemo, useState } from "react";
import ProductSelect from "../components/sections/ProductSelect";
import PurchaseSummary from "../components/sections/PurchaseSummary";

const Membership = () => {
    const [items, setItems] = useState([]);
    const [couponCode, setCouponCode] = useState("");
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(true);

    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const category = useMemo(() => {
        if (/#checkout-express-wash/i.test(hash)) return "express";
        if (/#checkout-manual-wash/i.test(hash)) return "manual";
        return "memberships";
    }, [hash]);

    // fetch washbooks
    useEffect(() => {
        (async () => {
            try {
                const base = import.meta.env.VITE_API_BASE_URL;
                const token = localStorage.getItem("accessToken");
                const key = localStorage.getItem("apiKey") || "";

                const url = `${base}/api/washbook?key=${encodeURIComponent(
                    key
                )}&ShowOnCustomerPortal=True`;

                const res = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await res.json();
                const list = Array.isArray(data?.data) ? data.data : [];
                setItems(list);
            } catch (e) {
                console.error("washbook fetch error:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // categorize
    const express = useMemo(
        () => items.filter((i) => /express/i.test(i.washbookName || "")),
        [items]
    );
    const manual = useMemo(
        () => items.filter((i) => /manual/i.test(i.washbookName || "")),
        [items]
    );
    const memberships = useMemo(
        () => items.filter((i) => /wash\s*book/i.test(i.washbookName || "")),
        [items]
    );

    const listForView =
        category === "express" ? express : category === "manual" ? manual : memberships;

    // default select for manual
    useEffect(() => {
        if (category === "manual" && listForView.length && !selectedId) {
            setSelectedId(listForView[0].washbookId);
        }
    }, [category, listForView, selectedId]);

    const selectedItem =
        category === "manual"
            ? listForView.find((x) => String(x.washbookId) === String(selectedId))
            : null;

    const subtotal = useMemo(() => {
        if (category === "manual" && selectedItem) return Number(selectedItem.washbookPrice || 0);
        // express/memberships: user hasn’t selected; show 0 for now
        return 0;
    }, [category, selectedItem]);

    const handleApplyCoupon = () => {
        console.log("Apply coupon:", couponCode);
    };
    const handleCheckout = () => {
        console.log("CHECKOUT clicked");
    };

    return (
        <div className="container mx-auto py-14 max-w-2xl">
            <ProductSelect />

            {/* Category heading */}
            <h2 className="mt-8 mb-4 text-xl font-semibold">
                {category === "express"
                    ? "Express Wash"
                    : category === "manual"
                        ? "Manual Wash"
                        : "Memberships"}
            </h2>

            {loading ? (
                <p>Loading...</p>
            ) : !listForView.length ? (
                <p>No products found.</p>
            ) : category === "manual" ? (
                // Manual: dropdown + price
                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Manual Wash
                    </label>
                    <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        value={selectedId ?? ""}
                        onChange={(e) => setSelectedId(Number(e.target.value))}
                    >
                        {listForView.map((p) => (
                            <option key={p.washbookId} value={p.washbookId}>
                                {p.washbookName} — ${Number(p.washbookPrice).toFixed(2)}
                            </option>
                        ))}
                    </select>

                    {selectedItem && (
                        <div className="mt-4 p-4 border rounded-lg bg-white">
                            <div className="flex justify-between">
                                <span className="font-medium">{selectedItem.washbookName}</span>
                                <span className="font-semibold">
                                    ${Number(selectedItem.washbookPrice).toFixed(2)}
                                </span>
                            </div>
                            {selectedItem.numberOfWashes && (
                                <p className="text-sm text-gray-600 mt-1">
                                    {selectedItem.numberOfWashes} wash(es)
                                </p>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                // Express / Memberships: simple cards list with pricing
                <div className="grid grid-cols-1 gap-4 mb-8">
                    {listForView.map((p) => (
                        <div key={p.washbookId} className="p-4 border rounded-lg bg-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{p.washbookName}</div>
                                    {p.numberOfWashes && (
                                        <div className="text-sm text-gray-600">
                                            {p.numberOfWashes} wash(es)
                                        </div>
                                    )}
                                </div>
                                <div className="text-lg font-semibold">
                                    ${Number(p.washbookPrice).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Purchase Summary */}
            <div className="mt-10">
                <PurchaseSummary
                    couponCode={couponCode}
                    onCouponChange={(e) => setCouponCode(e.target.value)}
                    onApplyCoupon={handleApplyCoupon}
                    onCheckout={handleCheckout}
                />
                {/* overwrite totals visually */}
                <div className="mt-2 text-sm text-gray-600">
                    Subtotal (preview): ${subtotal.toFixed(2)}
                </div>
            </div>
        </div>
    );
};

export default Membership;
