// src/components/ProductGrid.jsx
import { useState, useEffect, useContext, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Context } from "../js/store/appContext"
import ProductCard from "./ProductCard.jsx"
import SidebarFilters from "./SidebarFilters"

// Mapeo simple de slug -> nombre de categoría (solo las que existen en el backend)
const SLUG_TO_NAME = {
  "vapes-desechables": "Vapes Desechables",
  "pods-recargables": "Pods Recargables",
  "liquidos": "Líquidos",
  "accesorios": "Accesorios",
  "celulares": "Celulares",
  "perfumes": "Perfumes",
}

export default function ProductGrid({ category, hideFilters = false }) {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { store, actions } = useContext(Context)

  // Estado simple
  const [searchTerm, setSearchTerm] = useState("")
  const [priceRange, setPriceRange] = useState({ min: 0, max: Infinity })


  // Determinar categoría actual - CORREGIDO
  const currentSlug = slug // Sin valor por defecto
  const currentCategoryName = category || (currentSlug ? SLUG_TO_NAME[currentSlug] : null)

  // Cargar productos una sola vez
  useEffect(() => {
    if (actions?.fetchProducts) {
      actions.fetchProducts()
    }
  }, [])

  // Limpiar filtros cuando cambia el slug - CORREGIDO
  useEffect(() => {
    setSearchTerm("")
    setPriceRange({ min: 0, max: Infinity })
    window.scrollTo(0, 0)
  }, [slug, category])

  // Productos de la categoría actual (sin filtros de precio)
  const categoryProducts = useMemo(() => {
    const products = store.products || []

    // Si estamos en el homepage (sin categoría), mostrar solo 12 productos
    if (hideFilters && !currentCategoryName) {
      return products.slice(0, 12)
    }

    // Si no hay categoría seleccionada, mostrar todos
    if (!currentCategoryName) return products

    // Filtrar por categoría
    return products.filter(p => p.category_name === currentCategoryName)
  }, [store.products, currentCategoryName, slug, category, hideFilters])

  // Calcular min/max de precios SOLO de la categoría actual
  const categoryPriceRange = useMemo(() => {
    if (categoryProducts.length === 0) return { min: 0, max: 50000 }

    const prices = categoryProducts
      .map(p => Number(p.price) || 0)
      .filter(price => price > 0)

    if (prices.length === 0) return { min: 0, max: 50000 }

    return {
      min: 0, // Siempre empezar en 0
      max: Math.max(...prices)
    }
  }, [categoryProducts])

  // RESETEAR rango de precios cuando cambia la categoría
  useEffect(() => {
    setPriceRange({ min: 0, max: Infinity })
  }, [currentSlug])

  // Productos filtrados (solo búsqueda y precio, la categoría ya está filtrada)
  const filteredProducts = useMemo(() => {
    const q = searchTerm.toLowerCase()

    return categoryProducts.filter(product => {
      // Filtro de búsqueda
      const matchesSearch = !q ||
        product.name?.toLowerCase().includes(q) ||
        product.brand?.toLowerCase().includes(q)

      // Filtro de precio
      const price = Number(product.price) || 0
      const matchesPrice = price >= priceRange.min &&
        (priceRange.max === Infinity || price <= priceRange.max)

      return matchesSearch && matchesPrice
    })
  }, [categoryProducts, searchTerm, priceRange])

  const pageTitle = category || currentCategoryName || "Todos los Productos"

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
        <p className="text-gray-600">
          {filteredProducts.length} productos{currentCategoryName ? ` en ${pageTitle}` : ""}
        </p>
      </div>

      <div className={hideFilters ? "w-full" : "md:flex md:items-start md:gap-6"}>
        {/* Sidebar - Solo mostrar si hideFilters es false */}
        {!hideFilters && (
          <SidebarFilters
            className="md:shrink-0 md:sticky md:top-4 md:self-start"
            currentCategorySlug={currentSlug}
            onSelectCategory={(newSlug) => {
              navigate(`/categoria/${newSlug}`)
            }}
            priceMin={categoryPriceRange.min}
            priceMax={categoryPriceRange.max}
            price={priceRange}
            onChangePrice={(newRange) => {
              setPriceRange({
                min: Number(newRange.min) || 0,
                max: Number(newRange.max) || Infinity
              })
            }}
          />
        )}

        {/* Contenido */}
        <div className={hideFilters ? "w-full" : "flex-1"}>
          {!hideFilters && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          )}

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
              <p className="text-gray-600">
                No se encontraron productos que coincidan con tu búsqueda.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
