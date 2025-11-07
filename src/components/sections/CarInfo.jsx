"use client"

export default function CarInfo({ formData, onChange }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                License plate<span className="text-red-500">*</span>
            </label>
            <input
                type="text"
                name="licensePlate"
                placeholder="LP number"
                value={formData.licensePlate}
                onChange={onChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
        </div>
    )
}
