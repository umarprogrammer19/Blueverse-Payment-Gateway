"use client"

import {
    User,
    Phone,
    Mail,
    Calendar,
    MapPin,
    Building2,
    CreditCard,
    Receipt,
    MessageSquare,
    Shield,
    CheckCircle2,
} from "lucide-react"

export default function PersonalInfo({ formData, onChange, onToggle, siteData }) {
    const sites = Array.isArray(siteData?.data) ? siteData.data : []
    const stateOptions = [...new Set(sites.map((s) => s?.stateName).filter(Boolean))]
    const selectedSite = sites.find((s) => String(s?.id ?? s?.siteId) === String(formData.assignToLocSite))
    const cityOptions = selectedSite?.cityName ? [selectedSite.cityName] : []

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-linear-to-r from-blue-600 to-indigo-600 px-8 py-6">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <User className="h-7 w-7" />
                    Customer Information
                </h1>
                <p className="text-blue-100 mt-1 text-sm">Complete the form below to manage customer details</p>
            </div>

            <div className="p-8">
                {/* Personal Details Section */}
                <div className="grid md:grid-cols-2 gap-x-6 gap-y-5 mb-8">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <User className="h-4 w-4 text-blue-600" />
                            First name<span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            placeholder="Enter first name"
                            required
                            value={formData.firstName}
                            onChange={onChange}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 hover:bg-white"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <User className="h-4 w-4 text-blue-600" />
                            Last name<span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            required
                            placeholder="Enter last name"
                            value={formData.lastName}
                            onChange={onChange}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 hover:bg-white"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <Phone className="h-4 w-4 text-blue-600" />
                            Phone number
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            required
                            placeholder="(123) 456-7890"
                            value={formData.phone}
                            onChange={onChange}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 hover:bg-white"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <Mail className="h-4 w-4 text-blue-600" />
                            Email address
                        </label>
                        <input
                            type="email"
                            name="email"
                            required
                            placeholder="email@example.com"
                            value={formData.email}
                            onChange={onChange}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 hover:bg-white"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            Date of birth
                        </label>
                        <input
                            type="date"
                            name="dateOfBirth"
                            value={formData.dateOfBirth}
                            onChange={onChange}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 hover:bg-white"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <Building2 className="h-4 w-4 text-blue-600" />
                            Assign to Location/Site<span className="text-red-500">*</span>
                        </label>
                        <select
                            name="assignToLocSite"
                            value={formData.assignToLocSite}
                            onChange={onChange}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 hover:bg-white"
                        >
                            <option value="">Select location/site</option>
                            {sites.map((site, idx) => (
                                <option key={site?.id ?? site?.siteId ?? idx} value={site?.id ?? site?.siteId ?? `location${idx + 1}`}>
                                    {site?.siteName ?? `Site ${idx + 1}`}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Address Section */}
                <div className="bg-slate-50 rounded-xl p-6 mb-8">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        Address Information
                    </h2>
                    <div className="grid md:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="md:col-span-2">
                            <label className="text-sm font-semibold text-slate-700 mb-2 block">Street address</label>
                            <input
                                type="text"
                                name="address"
                                placeholder="123 Main Street"
                                value={formData.address}
                                onChange={onChange}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-slate-700 mb-2 block">State</label>
                            <select
                                name="state"
                                value={formData.state}
                                onChange={onChange}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                            >
                                <option value="">Select state</option>
                                {stateOptions.map((st) => (
                                    <option key={st} value={st}>
                                        {st}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-slate-700 mb-2 block">City</label>
                            <select
                                name="city"
                                value={formData.city}
                                onChange={onChange}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                            >
                                <option value="">Select city</option>
                                {cityOptions.map((city) => (
                                    <option key={city} value={city}>
                                        {city}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-slate-700 mb-2 block">ZIP code</label>
                            <input
                                type="text"
                                name="zipCode"
                                placeholder="12345"
                                value={formData.zipCode}
                                onChange={onChange}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <CreditCard className="h-4 w-4 text-blue-600" />
                                Loyalty points
                            </label>
                            <input
                                type="text"
                                name="loyaltyPoints"
                                placeholder="0"
                                value={formData.loyaltyPoints}
                                onChange={onChange}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Settings Section */}
                <div className="bg-linear-to-br from-slate-50 to-blue-50 rounded-xl p-6">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-5">
                        <Shield className="h-5 w-5 text-blue-600" />
                        Customer Settings
                    </h2>
                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                        <ToggleItem
                            icon={<Receipt className="h-4 w-4" />}
                            label="Allow invoicing"
                            checked={formData.allowInvoicing}
                            onToggle={() => onToggle("allowInvoicing")}
                        />
                        <ToggleItem
                            icon={<MessageSquare className="h-4 w-4" />}
                            label="Send text messages"
                            checked={formData.sendText}
                            onToggle={() => onToggle("sendText")}
                        />
                        <ToggleItem
                            icon={<Mail className="h-4 w-4" />}
                            label="Send email notifications"
                            checked={formData.sendEmail}
                            onToggle={() => onToggle("sendEmail")}
                        />
                        <ToggleItem
                            icon={<CheckCircle2 className="h-4 w-4" />}
                            label="Active customer"
                            checked={formData.activeCustomer}
                            onToggle={() => onToggle("activeCustomer")}
                        />
                        <ToggleItem
                            icon={<Shield className="h-4 w-4" />}
                            label="Blacklisted customer"
                            checked={formData.blacklistedCustomer}
                            onToggle={() => onToggle("blacklistedCustomer")}
                            danger
                        />
                        <div className="flex items-center justify-between py-2 px-4 bg-white rounded-lg border border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-slate-100 rounded-lg">
                                    <Shield className="h-4 w-4 text-slate-600" />
                                </div>
                                <span className="text-sm font-medium text-slate-700">TCPA enabled</span>
                            </div>
                            <span className="text-sm font-semibold text-slate-500">No</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function ToggleItem({ icon, label, checked, onToggle, danger = false }) {
    return (
        <div className="flex items-center justify-between py-2 px-4 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${danger && checked ? "bg-red-100" : "bg-slate-100"}`}>
                    <span className={danger && checked ? "text-red-600" : "text-slate-600"}>{icon}</span>
                </div>
                <span className="text-sm font-medium text-slate-700">{label}</span>
            </div>
            <button
                type="button"
                onClick={onToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${danger && checked
                    ? "bg-red-500 focus:ring-red-500"
                    : checked
                        ? "bg-blue-600 focus:ring-blue-500"
                        : "bg-slate-300 focus:ring-slate-400"
                    }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${checked ? "translate-x-6" : "translate-x-1"
                        }`}
                />
            </button>
        </div>
    )
}
