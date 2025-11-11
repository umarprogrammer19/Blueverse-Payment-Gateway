"use client";
import { useEffect, useMemo, useState } from "react";
import ProductSelect from "../components/sections/ProductSelect";
import PurchaseSummary from "../components/sections/PurchaseSummary";

const hashToProduct = (hash) => {
    if (/#checkout-express-wash/i.test(hash)) return "business";
    if (/#checkout-manual-wash/i.test(hash)) return "premium";
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

    const [applying, setApplying] = useState(false);
    const [serverTotals, setServerTotals] = useState(null);

    const initial = typeof window !== "undefined" ? hashToProduct(window.location.hash) : "memberships";
    const [product, setProduct] = useState(initial);

    const [selectedId, setSelectedId] = useState(null);
    const apiKey = localStorage.getItem("apiKey") || "";
    const siteId = localStorage.getItem("siteId") || "";
    const customerId = localStorage.getItem("customerId") || "";


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
                const key = apiKey || localStorage.getItem("apiKey") || "";

                const url = `${base}/api/washbook?key=${encodeURIComponent(key)}&ShowOnCustomerPortal=True`;
                const res = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await res.json();
                setItems(Array.isArray(data?.data) ? data.data : []);
            } catch (e) {
                console.error("washbook fetch error:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [apiKey]);

    // filter packages by category
    const filteredPackages = useMemo(() => {
        if (product === "business") return items.filter(i => /express/i.test(i.washbookName || ""));
        if (product === "premium") return items.filter(i => /manual/i.test(i.washbookName || ""));
        return items.filter(i => /wash\s*book/i.test(i.washbookName || ""));
    }, [items, product]);

    // default-select first item on list changes
    useEffect(() => {
        if (filteredPackages.length) setSelectedId(String(filteredPackages[0].washbookId));
        else setSelectedId(null);
    }, [filteredPackages]);

    const selectedItem = useMemo(
        () => filteredPackages.find(p => String(p.washbookId) === String(selectedId)) || null,
        [filteredPackages, selectedId]
    );

    // Totals: prefer serverTotals if present, else fall back to local calc
    const fallbackSubtotal = selectedItem ? Number(selectedItem.washbookPrice || 0) : 0;
    const subtotal = serverTotals?.subtotal ?? fallbackSubtotal;
    const discounts = serverTotals?.discounts ?? 0;
    const tax = serverTotals?.tax ?? 0;
    const total = serverTotals?.totalAmount ?? Math.max(fallbackSubtotal - 0 + 0, 0);

    const handleApplyCoupon = async () => {
        const promo = (couponCode || "").trim();
        if (!promo) {
            console.log("No promo code entered — not calling totals API.");
            return;
        }
        if (!siteId) {
            console.error("Missing siteId in context.");
            return;
        }
        if (!selectedItem) {
            console.error("Please select a package first.");
            return;
        }
        console.log(typeof (promo));


        try {
            setApplying(true);
            const base = import.meta.env.VITE_API_BASE_URL;
            const token = localStorage.getItem("accessToken");
            const key = apiKey || localStorage.getItem("apiKey") || "";

            const payload = buildInvoicePayload({
                key,
                siteId,
                promoCode: promo,
                customerId,
                instanceId: 0,
                selectedWashbook: {
                    washbookId: selectedItem.washbookId,
                    washbookNumber: selectedItem.washbookNumber || "",
                },
                invoiceDto: null,
                // If "memberships" tab is actually recurring memberships (not washbooks),
                // we could send membershipSaleList instead — see buildInvoicePayload for hooks.
            });

            const res = await fetch(`${base}/api/invoice/gettotalamount`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) {
                console.error("gettotalamount failed:", data);
                return;
            }

            console.log("gettotalamount payload →", payload);
            console.log("gettotalamount response ←", data);

            const d = data?.data ?? data;
            setServerTotals({
                subtotal: Number(d?.subtotal ?? fallbackSubtotal),
                discounts: Number(d?.discounts ?? 0),
                tax: Number(d?.tax ?? 0),
                totalAmount: Number(d?.totalAmount ?? fallbackSubtotal),
            });
        } catch (e) {
            console.error("Apply Discount error:", e);
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
                {product === "business" ? "Express Wash"
                    : product === "premium" ? "Manual Wash"
                        : "Memberships"}
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
                                onClick={() => {
                                    setSelectedId(String(p.washbookId));
                                    setServerTotals(null); // selecting another item clears server totals
                                }}
                                className={`p-4 cursor-pointer border rounded-lg bg-white text-left transition
                ${isSelected ? "border-blue-600 ring-2 ring-blue-200" : "hover:border-gray-400"}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <input type="radio" readOnly checked={isSelected} className="w-4 h-4" />
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

function buildInvoicePayload({
    key,
    siteId,
    promoCode,
    customerId = null,
    vehicleId = null,
    selectedWashbook = null,
    selectedServices = [],
    membership = null,
}) {
    const base = {
        key,
        siteId: Number(siteId) || siteId,
        customerData: customerId ? { customerId } : undefined,
        vehicleData: vehicleId ? { vehicleId } : undefined,

        totalAmount: 0,
        subtotal: 0,
        redemptions: 0,
        discounts: 0,
        tax: 0,
        status: "draft",
        source: "web",
        sourceId: 0,
        siteLaneId: 0,
        notes: "",
        captureMethod: "manual",
        appVersion: "web",

        serviceSaleList: Array.isArray(selectedServices)
            ? selectedServices.map((s) => ({
                serviceId: s.serviceId ?? 0,
                amount: Number(s.amount ?? 0),
                isRecurring: !!s.isRecurring,
                isPrepaid: !!s.isPrepaid,
                isWashbook: !!s.isWashbook,
                redeemId: s.redeemId ?? 0,
            }))
            : [],

        membershipSaleList: membership
            ? [{ membershipId: membership.membershipId, isNewSignUp: !!membership.isNewSignUp }]
            : [],

        paymentTypeList: [],
        giftCardSaleList: [],
        washbookSaleList: selectedWashbook
            ? [{ washbookId: selectedWashbook.washbookId, washbookNumber: selectedWashbook.washbookNumber || "" }]
            : [],
        giftCardRedeemList: [],
        washbookRedeemList: [],

        discountRedeemList: (promoCode || "").trim()
            ? [{
                discountId: 0,
                instanceType: "code",
                membershipId: 0,
                discountValue: 0,
            }]
            : [],
    };

    return deepStripUndefined(base);
}

function deepStripUndefined(obj) {
    if (Array.isArray(obj)) {
        return obj
            .map((v) => deepStripUndefined(v))
            .filter((v) => v !== undefined && !(typeof v === "object" && v && Object.keys(v).length === 0));
    }
    if (obj && typeof obj === "object") {
        const out = {};
        for (const [k, v] of Object.entries(obj)) {
            const vv = deepStripUndefined(v);
            if (vv !== undefined && !(typeof vv === "object" && vv && Object.keys(vv).length === 0)) out[k] = vv;
        }
        return out;
    }
    return obj;
}
