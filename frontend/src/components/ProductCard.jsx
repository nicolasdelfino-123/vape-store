import { useState, useContext } from "react"
import { Context } from "../js/store/appContext"
import { useNavigate } from "react-router-dom"

export default function ProductCard({ product }) {
  const HIDE_WHEN_NO_STOCK = true
  const IMAGE_RATIO = "aspect-square"

  const [quantity, setQuantity] = useState(1)
  const [selectedFlavor, setSelectedFlavor] = useState("")
  const { actions } = useContext(Context)
  const navigate = useNavigate()

  const stock = Number(product?.stock ?? 0)
  const hasStock = stock > 0
  if (!hasStock && HIDE_WHEN_NO_STOCK) return null

  const handleAddToCart = () => {
    if (actions?.addToCart) {
      actions.addToCart({ ...product, selectedFlavor }, quantity)
      setQuantity(1)
      setSelectedFlavor("")
    }
  }

  const handleProductClick = () => navigate(`/product/${product.id}`)

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className={`w-full bg-gray-200 cursor-pointer ${IMAGE_RATIO}`} onClick={handleProductClick}>
        <img src={product.image_url || "/placeholder-product.jpg"} alt={product.name || "Producto"} className="h-full w-full object-cover" />
      </div>

      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2 cursor-pointer hover:text-purple-600 transition-colors" onClick={handleProductClick}>
          {product.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-purple-600">${product.price}</span>
          <span className="text-sm text-gray-500">{product.category_name}</span>
        </div>

        {/* SELECTOR DE SABORES - SOLO SI ESTÁ HABILITADO */}
        {product.flavor_enabled && Array.isArray(product.flavors) && product.flavors.length > 0 && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sabor</label>
            <select
              value={selectedFlavor}
              onChange={(e) => setSelectedFlavor(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Elige una opción</option>
              {product.flavors.map(flavor => (
                <option key={flavor} value={flavor}>{flavor}</option>
              ))}
            </select>
          </div>
        )}

        {hasStock ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Cantidad:</label>
              <select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="border border-gray-300 rounded px-2 py-1 text-sm">
                {[...Array(Math.min(stock || 1, 10))].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
              </select>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.flavor_enabled && product.flavors?.length > 0 && !selectedFlavor}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Agregar al Carrito
            </button>
          </div>
        ) : (
          <button disabled className="w-full bg-gray-400 text-white py-2 px-4 rounded-md cursor-not-allowed">Sin Stock</button>
        )}
      </div>
    </div>
  )
}