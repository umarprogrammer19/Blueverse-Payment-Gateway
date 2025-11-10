"use client"

import { useState } from "react"
import { User, Car, CreditCard } from "lucide-react"
import PersonalInfo from "./sections/PersonalInfo"
import CarInfo from "./sections/CarInfo"
import PaymentInfo from "./sections/PaymentInfo"
import PurchaseSummary from "./sections/PurchaseSummary"
import ProductSelect from "./sections/ProductSelect"

export default function CheckoutForm() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        licensePlate: "",
        cardNumber: "",
        expirationDate: "",
        securityCode: "",
        billingZip: "",
        couponCode: "",
    })

    const [showSecurity, setShowSecurity] = useState(false)

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleApplyCoupon = () => {
        console.log("Applied coupon:", formData.couponCode)
    }

    const handleCheckout = () => {
        console.log("Checkout:", formData)
    }

    return (
        <main className="mx-auto px-12 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Form */}
                <div className="lg:col-span-2">
                    <div className="space-y-8">
                        {/* Personal Information */}
                        <section className="bg-white rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-dashed border-gray-200">
                                <div className="bg-blue-100 p-2 rounded">
                                    <User size={20} className="text-blue-600" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900">Personal information</h2>
                            </div>
                            <PersonalInfo formData={formData} onChange={handleInputChange} />
                        </section>

                        {/* Car Information */}
                        <section className="bg-white rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-dashed border-gray-200">
                                <div className="bg-blue-100 p-2 rounded">
                                    <Car size={20} className="text-blue-600" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900">Car information</h2>
                            </div>
                            <CarInfo formData={formData} onChange={handleInputChange} />
                        </section>

                        {/* Payment Information */}
                        {/* <section className="bg-white rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-dashed border-gray-200">
                                <div className="bg-blue-100 p-2 rounded">
                                    <CreditCard size={20} className="text-blue-600" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900">Payment information</h2>
                            </div>
                            <PaymentInfo
                                formData={formData}
                                onChange={handleInputChange}
                                showSecurity={showSecurity}
                                setShowSecurity={setShowSecurity}
                            />
                        </section> */}
                    </div>
                </div>

                {/* Right Column - Summary */}
                <div className="lg:col-span-1">
                    <div className="space-y-6">
                        {/* Product Select */}
                        <section className="bg-white rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select products</h3>
                            <ProductSelect />
                        </section>

                        {/* Purchase Summary */}
                        <section className="bg-white rounded-lg p-6 sticky top-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Your purchase</h3>
                            <PurchaseSummary
                                couponCode={formData.couponCode}
                                onCouponChange={(e) => handleInputChange(e)}
                                onApplyCoupon={handleApplyCoupon}
                                onCheckout={handleCheckout}
                            />
                        </section>
                    </div>
                </div>
            </div>
        </main>
    )
}
