"use client";
export default function ProductSelect({ value, onChange }) {
    return (
        <div>
            <p className="text-md relative left-1 font-medium mb-3 text-gray-900">Select a product</p>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white"
            >
                <option value="memberships">Memberships</option>
                <option value="premium">Manual Wash</option>
                <option value="business">Express Wash</option>
            </select>

            <button
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                onClick={() => console.log("More options clicked")}
            >
                More options
            </button>
        </div>
    );
}
