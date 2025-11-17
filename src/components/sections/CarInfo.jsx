export default function CarInfo({ formData, onChange }) {
    return (
        <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                License plate<span className="text-red-500">*</span>
            </label>
            <input
                type="text"
                name="licensePlate"
                placeholder="LP number"
                value={formData.licensePlate}
                onChange={onChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2162AF] focus:border-[#2162AF] transition-colors"
            />
        </div>
    )
}
