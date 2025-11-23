import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

const CheckoutContext = createContext(null);

export function CheckoutProvider({ children }) {
    const [apiKey, setApiKey] = useState("");
    const [siteId, setSiteId] = useState(null);

    const [customerId, setCustomerId] = useState(null);
    const [vehicleId, setVehicleId] = useState(null);

    const [selectedMembership, setSelectedMembership] = useState(null);
    const [selectedServices, setSelectedServices] = useState([]);    

    const [couponCode, setCouponCode] = useState("");
    const [invoiceTotals, setInvoiceTotals] = useState(null)
    const [applying, setApplying] = useState(false);

    const buildInvoicePayload = useCallback(() => {
        const promo = (couponCode || "").trim();

        const payload = {
            key: apiKey,
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

            membershipSaleList: selectedMembership?.membershipId
                ? [{ membershipId: selectedMembership.membershipId, isNewSignUp: !!selectedMembership.isNewSignUp }]
                : [],

            paymentTypeList: [],
            giftCardSaleList: [],
            washbookSaleList: [],
            giftCardRedeemList: [],
            washbookRedeemList: [],

            discountRedeemList: promo
                ? [
                    {
                        discountId: 0,
                        instanceType: "code",
                        instanceId: promo,      
                        membershipId: 0,
                        discountValue: 0,
                    },
                ]
                : [],
        };

        return deepStripUndefined(payload);
    }, [apiKey, siteId, customerId, vehicleId, selectedServices, selectedMembership, couponCode]);

    const applyDiscount = useCallback(async () => {
        const promo = (couponCode || "").trim();
        if (!promo) {
            return;
        }

        try {
            setApplying(true);
            const token = localStorage.getItem("accessToken");
            const base = import.meta.env.VITE_API_BASE_URL;

            if (!token) {
                console.error("Missing access token");
                return;
            }
            if (!apiKey || !siteId) {
                console.error("Missing apiKey/siteId");
                return;
            }

            const payload = buildInvoicePayload();

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
            setInvoiceTotals(data);
        } catch (e) {
            console.error("Apply Discount error:", e);
        } finally {
            setApplying(false);
        }
    }, [couponCode, apiKey, siteId, buildInvoicePayload]);

    const clearTotals = useCallback(() => setInvoiceTotals(null), []);

    // Derived totals for UI (fallbacks if server totals not present)
    const derivedTotals = useMemo(() => {
        const d = invoiceTotals?.data || invoiceTotals;
        return {
            subtotal: d?.subtotal ?? sumAmounts(selectedServices) + (selectedMembership?.price ?? 0),
            discounts: d?.discounts ?? 0,
            tax: d?.tax ?? 0,
            totalAmount: d?.totalAmount ?? (sumAmounts(selectedServices) + (selectedMembership?.price ?? 0)),
        };
    }, [invoiceTotals, selectedServices, selectedMembership]);

    const value = {
        // state
        apiKey, siteId, customerId, vehicleId,
        selectedMembership, selectedServices,
        couponCode, invoiceTotals, derivedTotals, applying,

        // setters
        setApiKey, setSiteId, setCustomerId, setVehicleId,
        setSelectedMembership, setSelectedServices,
        setCouponCode, setInvoiceTotals, clearTotals,

        // actions
        applyDiscount,
    };

    return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

export function useCheckout() {
    const ctx = useContext(CheckoutContext);
    if (!ctx) throw new Error("useCheckout must be used within <CheckoutProvider>");
    return ctx;
}


function sumAmounts(list) {
    return (list || []).reduce((acc, s) => acc + Number(s.amount ?? 0), 0);
}
function deepStripUndefined(obj) {
    if (Array.isArray(obj)) {
        return obj
            .map((v) => deepStripUndefined(v))
            .filter((v) => v !== undefined && !(typeof v === "object" && v && Object.keys(v).length === 0));
    } else if (obj && typeof obj === "object") {
        const out = {};
        for (const [k, v] of Object.entries(obj)) {
            const vv = deepStripUndefined(v);
            if (vv !== undefined && !(typeof vv === "object" && vv && Object.keys(vv).length === 0)) out[k] = vv;
        }
        return out;
    }
    return obj;
}
