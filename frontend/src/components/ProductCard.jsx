"use client"

import { useState } from "react"
import { actions } from "../store/store.js"

export default function ProductCard({ product }) {
  const [quantity, setQuantity] = useState(1)

  const handleAddToCart = () => {
    actions.addToCart(product, quantity)
    setQuantity(1)
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200">
        <img
          src={product.image || `/placeholder.svg?height=300&width=300&query=${product.name}`}
          alt={product.name}
          className="h-48 w-full object-cover object-center group-hover:opacity-75"
        />
      </div>

      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-3">{product.description}</p>

        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-purple-600">${product.price?.toLocaleString("es-AR")}</span>
          <span className="text-sm text-gray-500">{product.category}</span>
        </div>

        {product.stock > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Cantidad:</label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number.parseInt(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                {[...Array(Math.min(product.stock, 10))].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors font-medium"
            >
              Agregar al Carrito
            </button>
          </div>
        ) : (
          <button disabled className="w-full bg-gray-400 text-white py-2 px-4 rounded-md cursor-not-allowed">
            Sin Stock
          </button>
        )}
      </div>
    </div>
  )
}
