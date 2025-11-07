"use client"
import { useState } from "react"

export default function ProductSelect() {
    const [product, setProduct] = useState("memberships")

    return (
        <div>
            <select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white"
            >
                <option value="memberships">Memberships</option>
                <option value="premium">Premium Plan</option>
                <option value="business">Business Plan</option>
            </select>

            <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                More options
            </button>
        </div>
    )
}
