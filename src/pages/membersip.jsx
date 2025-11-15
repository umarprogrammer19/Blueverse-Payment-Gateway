"use client";
import { useEffect, useMemo, useState } from "react";
import PurchaseSummary from "../components/sections/PurchaseSummary";

// helper: name → slug
const slugify = (str = "") =>
    str
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

// helper: price
const getItemPrice = (item) => {
    if (!item) return 0;
    if (item.membershipPrice != null) return Number(item.membershipPrice) || 0;
    if (item.washbookPrice != null) return Number(item.washbookPrice) || 0;
    return 0;
};

export default function Membership({ onEnsureCustomer, isProcessing = false }) {
    const [items, setItems] = useState([]);
    const [couponCode, setCouponCode] = useState("");
    const [loading, setLoading] = useState(true);

    const [applying, setApplying] = useState(false);
    const [serverTotals, setServerTotals] = useState(null);

    const initial = "Membership";
    const [product, setProduct] = useState(initial);

    const apiKey = localStorage.getItem("apiKey") || "";
    const siteId = localStorage.getItem("siteId") || "";

    const [slugFromHash, setSlugFromHash] = useState("");

    useEffect(() => {
        const updateSlug = () => {
            const hash = window.location.hash || "";
            const normalized = hash.replace("#", "").trim().toLowerCase();
            setSlugFromHash(normalized);
        };

        updateSlug();
        window.addEventListener("hashchange", updateSlug);
        return () => window.removeEventListener("hashchange", updateSlug);
    }, []);

    // fetch washbooks + memberships
    useEffect(() => {
        (async () => {
            try {
                const base = import.meta.env.VITE_API_BASE_URL;
                const token = localStorage.getItem("accessToken");
                const key = apiKey || localStorage.getItem("apiKey") || "";

                const urlWashbook = `${base}/api/washbook?key=${encodeURIComponent(
                    key
                )}`;
                const urlMembership = `${base}/api/membership?key=${encodeURIComponent(
                    key
                )}&pageSize=10000&target=table&type=0&isActive=true`;

                const [resWash, resMem] = await Promise.all([
                    fetch(urlWashbook, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                    fetch(urlMembership, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                ]);

                const dataWash = await resWash.json();
                const dataMem = await resMem.json();

                const merged = (Array.isArray(dataWash?.data) ? dataWash.data : []).concat(
                    Array.isArray(dataMem?.data) ? dataMem.data : []
                );

                const withSlugs = merged.map((item) => {
                    const name = item.membershipName || item.washbookName || "";
                    return {
                        ...item,
                        slug: slugify(name),
                    };
                });

                console.table(
                    withSlugs.map((i) => ({
                        name: i.membershipName || i.washbookName,
                        slug: i.slug,
                    }))
                );

                setItems(withSlugs);
            } catch (e) {
                console.error("Membership fetch error:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [apiKey]);

    // selected item from hash
    const selectedItem = useMemo(() => {
        if (!items.length) return null;

        if (slugFromHash) {
            const bySlug = items.find((i) => i.slug === slugFromHash);
            if (bySlug) return bySlug;
        }

        const firstMembership = items.find((i) =>
            /membership/i.test(i.membershipName || "")
        );
        return firstMembership || items[0] || null;
    }, [items, slugFromHash]);

    // totals
    const fallbackSubtotal = getItemPrice(selectedItem);
    const subtotal = serverTotals?.subtotal ?? fallbackSubtotal;
    const discounts = serverTotals?.discounts ?? 0;
    const tax = serverTotals?.tax ?? 0;
    const total =
        serverTotals?.totalAmount ?? Math.max(fallbackSubtotal - discounts + tax, 0);

    // coupon
    const handleApplyCoupon = async () => {
        const promo = (couponCode || "").trim().toUpperCase();
        if (!promo) return console.log("Empty code — skipping");
        if (!siteId) return console.error("Missing siteId");
        if (!selectedItem) return console.error("Select a package first (via slug)");

        try {
            setApplying(true);
            const base = import.meta.env.VITE_API_BASE_URL;
            const token = localStorage.getItem("accessToken");
            const key = apiKey || localStorage.getItem("apiKey") || "";

            const url = `${base}/api/couponpackage/codelist?key=${encodeURIComponent(
                key
            )}&pageSize=100&pageNumber=1&isActive=true`;
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
            const expOk =
                !match.expirationDate ||
                new Date(match.expirationDate).getTime() > now;
            const notUsed = !match.isUsed;
            if (!expOk || !notUsed) {
                console.warn("Code expired/used/not applicable");
                return;
            }

            const DISCOUNT_TYPE = { FIXED: 1, PERCENT: 2 };
            const sub = getItemPrice(selectedItem);
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

    // checkout handler – ab sirf parent se data save karwata hai
    const handleCheckout = async () => {
        if (!selectedItem) return false;

        if (typeof onEnsureCustomer === "function") {
            const ok = await onEnsureCustomer();
            if (!ok) return false; // validation fail ho gayi
        }

        console.log("CHECKOUT with:", {
            category: product,
            selected: selectedItem,
            totals: { subtotal, discounts, tax, total },
        });

        return true; // PurchaseSummary ko allow karo IPG submit karne ka
    };

    return (
        <div className="container mx-auto max-w-2xl">
            {loading ? (
                <p>Loading...</p>
            ) : !selectedItem ? (
                <p>No product found for this link.</p>
            ) : (
                <div className="mb-6 p-4 border rounded-lg bg-white flex items-center justify-between">
                    <div>
                        <div className="font-medium">
                            {selectedItem.membershipName || selectedItem.washbookName}
                        </div>
                        {selectedItem.numberOfWashes && (
                            <div className="text-sm text-gray-600">
                                {selectedItem.numberOfWashes} wash(es)
                            </div>
                        )}
                    </div>
                    <div className="text-lg font-semibold">
                        د.إ{getItemPrice(selectedItem).toFixed(2)}
                    </div>
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
                isProcessing={isProcessing || applying}
            />

            {applying && (
                <p className="mt-3 text-sm text-gray-600">Applying code...</p>
            )}
        </div>
    );
}
