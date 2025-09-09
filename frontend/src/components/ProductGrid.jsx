import { useState, useEffect, useContext } from "react"
import { Context } from "../js/store/appContext"
import ProductCard from "./ProductCard.jsx"

export default function ProductGrid({ category }) {
  const { store, actions } = useContext(Context)
  const [selectedCategory, setSelectedCategory] = useState(category || "Todos")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // Cargar productos desde la API solo una vez al montar el componente
    if (actions && actions.fetchProducts) {
      actions.fetchProducts()
    }
  }, []) // Sin dependencias para que solo se ejecute una vez

  // Actualizar categoría seleccionada si viene por props
  useEffect(() => {
    if (category) {
      setSelectedCategory(category)
    }
  }, [category])

  const filteredProducts = (store.products || []).filter((product) => {
    const matchesCategory = selectedCategory === "Todos" || product.category_name === selectedCategory
    const matchesSearch =
      (product.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const categories = ["Todos", ...(store.categories || [])]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header con título de categoría si viene por props */}
      {category && (
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{category}</h1>
          <p className="text-gray-600">Productos en la categoría {category}</p>
        </div>
      )}

      {/* Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter - solo mostrar si no viene categoría fija */}
          {!category && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {store.loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-2 text-gray-600">Cargando productos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {filteredProducts.length === 0 && !store.loading && (
        <div className="text-center py-12">
          <p className="text-gray-600">No se encontraron productos que coincidan con tu búsqueda.</p>
        </div>
      )}
    </div>
  )
}