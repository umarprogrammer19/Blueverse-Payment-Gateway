"use client";
import { useEffect, useMemo, useState } from "react";
import ProductSelect from "../components/sections/ProductSelect";
import PurchaseSummary from "../components/sections/PurchaseSummary";


export default function Membership() {
    const [items, setItems] = useState([]);
    const [couponCode, setCouponCode] = useState("");
    const [loading, setLoading] = useState(true);

    const [applying, setApplying] = useState(false);
    const [serverTotals, setServerTotals] = useState(null);

    const initial = "Membership";
    const [product, setProduct] = useState(initial);

    const [selectedId, setSelectedId] = useState(null);
    const apiKey = localStorage.getItem("apiKey") || "";
    const siteId = localStorage.getItem("siteId") || "";

    // fetch Memberships 
    useEffect(() => {
        (async () => {
            try {
                const base = import.meta.env.VITE_API_BASE_URL;
                const token = localStorage.getItem("accessToken");
                const key = apiKey || localStorage.getItem("apiKey") || "";

                const url = `${base}/api/membership?key=${encodeURIComponent(key)}&ShowOnCustomerPortal=True`;
                const res = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await res.json();
                console.log(data);

                setItems(Array.isArray(data?.data) ? data.data : []);
            } catch (e) {
                console.error("Membership fetch error:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [apiKey]);

    // filter packages by category
    const filteredPackages = useMemo(() => {
        return items.filter(i => /membership/i.test(i.membershipName || ""));

    }, [items, product]);

    // default-select first item on list changes
    useEffect(() => {
        if (filteredPackages.length) setSelectedId(String(filteredPackages[0].membershipId));
        else setSelectedId(null);
    }, [filteredPackages]);

    const selectedItem = useMemo(
        () => filteredPackages.find(p => String(p.membershipId) === String(selectedId)) || null,
        [filteredPackages, selectedId]
    );

    // Totals: prefer serverTotals if present, else fall back to local calc
    const fallbackSubtotal = selectedItem ? Number(selectedItem.membershipPrice || 0) : 0;
    const subtotal = serverTotals?.subtotal ?? fallbackSubtotal;
    const discounts = serverTotals?.discounts ?? 0;
    const tax = serverTotals?.tax ?? 0;
    const total = serverTotals?.totalAmount ?? Math.max(fallbackSubtotal - 0 + 0, 0);

    const handleApplyCoupon = async () => {
        const promo = (couponCode || "").trim().toUpperCase();
        if (!promo) return console.log("Empty code — skipping");
        if (!siteId) return console.error("Missing siteId");
        if (!selectedItem) return console.error("Select a package first");

        try {
            setApplying(true);
            const base = import.meta.env.VITE_API_BASE_URL;
            const token = localStorage.getItem("accessToken");
            const key = apiKey || localStorage.getItem("apiKey") || "";

            // 1) Fetch active coupon codes
            const url = `${base}/api/couponpackage/codelist?key=${encodeURIComponent(key)}&pageSize=100&pageNumber=1&isActive=true`;
            const res = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            const json = await res.json();
            const list = Array.isArray(json?.data) ? json.data : [];

            const match = list.find(
                (c) => String(c.couponCode || "").toUpperCase() === promo
            );

            if (!match) {
                console.warn("Invalid code");
                return;
            }

            const now = Date.now();
            const expOk = !match.expirationDate || new Date(match.expirationDate).getTime() > now;
            const notUsed = !match.isUsed;
            if (!expOk || !notUsed) {
                console.warn("Code expired/used/not applicable");
                return;
            }

            const DISCOUNT_TYPE = { FIXED: 1, PERCENT: 2 };
            const sub = Number(selectedItem?.membershipPrice || 0);
            const val = Number(match.discountValue || 0);

            let discount = 0;
            if (match.discountTypeId === DISCOUNT_TYPE.PERCENT) {
                discount = +(sub * (val / 100)).toFixed(2);
            } else if (match.discountTypeId === DISCOUNT_TYPE.FIXED) {
                discount = +Math.min(val, sub).toFixed(2);
            } else {
                discount = +Math.min(val, sub).toFixed(2);
            }

            const totalAfter = Math.max(sub - discount, 0);

            setServerTotals({
                subtotal: sub,
                discounts: discount,
                tax: 0,
                totalAmount: totalAfter,
            });
        } catch (e) {
            console.error("Apply Coupon (GET list) error:", e);
        } finally {
            setApplying(false);
        }
    };


    const handleCheckout = () => {
        console.log("CHECKOUT clicked with:", {
            category: product,
            selected: selectedItem,
            totals: { subtotal, discounts, tax, total }
        });
    };

    return (
        <div className="container mx-auto py-14 max-w-2xl">
            <ProductSelect value={product} onChange={setProduct} />

            <h2 className="mt-8 mb-4 text-xl font-semibold">
                Membership
            </h2>

            {loading ? (
                <p>Loading...</p>
            ) : !filteredPackages.length ? (
                <p>No products found.</p>
            ) : (
                <div className="grid grid-cols-1 gap-3 mb-10">
                    {filteredPackages.map((p) => {
                        const isSelected = String(p.membershipId) === String(selectedId);
                        return (
                            <button
                                key={p.membershipId}
                                type="button"
                                onClick={() => {
                                    setSelectedId(String(p.membershipId));
                                    setServerTotals(null); // selecting another item clears server totals
                                }}
                                className={`p-4 cursor-pointer border rounded-lg bg-white text-left transition
                ${isSelected ? "border-blue-600 ring-2 ring-blue-200" : "hover:border-gray-400"}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <input type="radio" readOnly checked={isSelected} className="w-4 h-4" />
                                        <div>
                                            <div className="font-medium">{p.membershipName}</div>
                                            {p.numberOfWashes && (
                                                <div className="text-sm text-gray-600">{p.numberOfWashes} wash(es)</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-lg font-semibold">
                                        د.إ{Number(p.membershipPrice || 0).toFixed(2)}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            <PurchaseSummary
                selectedPackage={selectedItem}
                subtotal={subtotal}
                discounts={discounts}
                tax={tax}
                total={total}
                couponCode={couponCode}
                onCouponChange={(e) => setCouponCode(e.target.value)}
                onApplyCoupon={handleApplyCoupon}
                onCheckout={handleCheckout}
            />

            {applying && <p className="mt-3 text-sm text-gray-600">Applying code...</p>}
        </div>
    );
}
