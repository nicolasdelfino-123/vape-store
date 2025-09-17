import { useState, useContext } from "react"
import { Context } from "../js/store/appContext"
import { useNavigate } from "react-router-dom"


// URL base del backend (definila en tu .env como VITE_BACKEND_URL)
const API = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "") || "";

// Normaliza paths viejos
const normalizeImagePath = (u = "") => {
  if (!u) return "";
  // corrige cosas antiguas
  if (u.startsWith("/admin/uploads/")) u = u.replace("/admin", "/public");
  if (u.startsWith("/uploads/")) u = `/public${u}`; // si alguna vez vino sin /public
  return u;
};

// Convierte relativo → absoluto
const toAbsUrl = (u = "") => {
  u = normalizeImagePath(u);
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("/")) return `${API}${u}`;
  return `${API}/${u}`;
};




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
    const hasFlavors = product.flavor_enabled && Array.isArray(product.flavors) && product.flavors.length > 0

    if (hasFlavors && !selectedFlavor) {
      navigate(`/product/${product.id}`)
      return
    }

    if (actions?.addToCart) {
      actions.addToCart(
        { ...product, selectedFlavor: hasFlavors ? selectedFlavor : null },
        quantity
      )
      setQuantity(1)
      setSelectedFlavor("")
    }
  }

  const handleProductClick = () => navigate(`/product/${product.id}`)

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Imagen */}
      {/* Imagen (tamaño real, sin recortes ni barras) */}
      <div onClick={handleProductClick} className="w-full cursor-pointer">
        <img
          src={toAbsUrl(product.image_url) || "/placeholder-product.jpg"}
          alt={product.name || "Producto"}
          className="block w-full h-auto"
          loading="lazy"
        />
      </div>


      {/* Contenido */}
      <div className="p-3 sm:p-4">
        {/* 1) Selector de sabor (arriba) */}
        {product.flavor_enabled && Array.isArray(product.flavors) && product.flavors.length > 0 && (
          <div className="mb-3">
            <label className="block text-[11px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
              Sabor
            </label>
            <select
              value={selectedFlavor}
              onChange={(e) => setSelectedFlavor(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Elige una opción</option>
              {product.flavors.map((flavor) => (
                <option key={flavor} value={flavor}>{flavor}</option>
              ))}
            </select>
          </div>
        )}

        {/* 2) Título (click abre detalle) */}
        <h3
          onClick={handleProductClick}
          className="text-base sm:text-lg md:text-xl font-medium text-gray-900 mb-1 cursor-pointer hover:text-purple-600 transition-colors leading-snug line-clamp-3 text-center"
          title={product.name}
        >
          {product.name}
          {product.selectedFlavor ? ` (${product.selectedFlavor})` : ""}
        </h3>

        {/* 3) Categoría */}
        <div className="text-[11px] sm:text-xs md:text-sm text-gray-500 mb-2 text-center">
          {product.category_name}
        </div>

        {/* 4) Precio centrado */}
        <div className="mb-3 text-center">
          <span className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600">
            ${Number(product.price || 0).toLocaleString("es-AR")}
          </span>
        </div>

        {/* 5) Cantidad + botón */}
        {hasStock ? (
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center flex justify-center md:justify-start">
              <label className="text-[11px] sm:text-xs md:text-sm font-medium">
                Cantidad:
              </label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm"
              >
                {[...Array(Math.min(stock || 1, 10))].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full bg-purple-600 text-white py-2 md:py-3 px-4 rounded-md hover:bg-purple-700 transition-colors font-medium text-sm md:text-base"
            >
              Agregar al Carrito
            </button>
          </div>
        ) : (
          <button
            disabled
            className="w-full bg-gray-400 text-white py-2 px-4 rounded-md cursor-not-allowed text-sm md:text-base"
          >
            Sin Stock
          </button>
        )}
      </div>
    </div>
  )
}
