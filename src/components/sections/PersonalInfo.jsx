"use client";

export default function PersonalInfo({ formData, onChange, siteData }) {
    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
                Personal Information
            </h2>

            {/* Personal Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                    <label
                        htmlFor="firstName"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                        First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="firstName"
                        type="text"
                        name="firstName"
                        placeholder="Enter first name"
                        required
                        value={formData.firstName || ""}
                        onChange={onChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                </div>

                <div>
                    <label
                        htmlFor="lastName"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                        Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="lastName"
                        type="text"
                        name="lastName"
                        placeholder="Enter last name"
                        required
                        value={formData.lastName || ""}
                        onChange={onChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email address
                    </label>
                    <input
                        type="email"
                        name="email"
                        required
                        placeholder="Email address"
                        value={formData.email}
                        onChange={onChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                </div>

                <div className="md:col-span-2">
                    <label
                        htmlFor="phone"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                        Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="phone"
                        type="tel"
                        name="phone"
                        placeholder="Enter phone number (e.g., +1 234 567 8900)"
                        required
                        value={formData.phone || ""}
                        onChange={onChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                </div>

                <div className="md:col-span-2">
                    <label
                        htmlFor="address"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                        Address
                    </label>
                    <input
                        id="address"
                        type="text"
                        name="address"
                        placeholder="Enter full address"
                        value={formData.address || ""}
                        onChange={onChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                </div>
            </div>
        </div>
    );
}
