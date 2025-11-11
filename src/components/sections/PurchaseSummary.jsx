import { useCheckout } from "../context/CheckoutContext";

export default function PurchaseSummary() {
    const {
        couponCode, setCouponCode,
        applying, applyDiscount,
        derivedTotals,
    } = useCheckout();

    const onApply = async () => {
        if (!couponCode.trim()) {
            console.log("No promo code entered — showing current amounts only.");
            return;
        }
        await applyDiscount();
    };

    return (
        <section className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your purchase</h3>

            {/* Promo input + Apply */}
            <div className="flex gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Promo/Discount code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg"
                />
                <button
                    type="button"
                    onClick={onApply}
                    disabled={applying}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60"
                >
                    {applying ? "Applying..." : "Apply"}
                </button>
            </div>

            {/* Totals (already shown even without code) */}
            <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{derivedTotals.subtotal}</span></div>
                <div className="flex justify-between"><span>Discounts</span><span>-{derivedTotals.discounts}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>{derivedTotals.tax}</span></div>
                <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t">
                    <span>Total</span><span>{derivedTotals.totalAmount}</span>
                </div>
            </div>
        </section>
    );
}
