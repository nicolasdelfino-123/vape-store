import { useState, useEffect, useContext, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Context } from "../js/store/appContext"
import ProductCard from "./ProductCard.jsx"
import SidebarFilters from "./SidebarFilters"

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

  const [searchTerm, setSearchTerm] = useState("")
  const [priceRange, setPriceRange] = useState({ min: 0, max: Infinity })

  const currentSlug = slug
  const currentCategoryName = category || (currentSlug ? SLUG_TO_NAME[currentSlug] : null)

  useEffect(() => {
    if (actions?.fetchProducts) actions.fetchProducts()
  }, [])

  useEffect(() => {
    setSearchTerm("")
    setPriceRange({ min: 0, max: Infinity })
    window.scrollTo(0, 0)
  }, [slug, category])

  const categoryProducts = useMemo(() => {
    const products = store.products || []
    if (hideFilters && !currentCategoryName) return products.slice(0, 12)
    if (!currentCategoryName) return products
    return products.filter(p => p.category_name === currentCategoryName)
  }, [store.products, currentCategoryName, slug, category, hideFilters])

  const categoryPriceRange = useMemo(() => {
    if (categoryProducts.length === 0) return { min: 0, max: 50000 }
    const prices = categoryProducts.map(p => Number(p.price) || 0).filter(p => p > 0)
    if (prices.length === 0) return { min: 0, max: 50000 }
    return { min: 0, max: Math.max(...prices) }
  }, [categoryProducts])

  useEffect(() => {
    setPriceRange({ min: 0, max: Infinity })
  }, [currentSlug])

  const filteredProducts = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return categoryProducts.filter(product => {
      const matchesSearch = !q ||
        product.name?.toLowerCase().includes(q) ||
        product.brand?.toLowerCase().includes(q)
      const price = Number(product.price) || 0
      const matchesPrice = price >= priceRange.min &&
        (priceRange.max === Infinity || price <= priceRange.max)
      return matchesSearch && matchesPrice
    })
  }, [categoryProducts, searchTerm, priceRange])

  const pageTitle = category || currentCategoryName || "Todos los Productos"

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
          {pageTitle}
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          {filteredProducts.length} productos{currentCategoryName ? ` en ${pageTitle}` : ""}
        </p>
      </div>

      <div className={hideFilters ? "w-full" : "md:flex md:items-start md:gap-6"}>
        {/* Sidebar */}
        {!hideFilters && (
          <SidebarFilters
            className="md:shrink-0 md:sticky md:top-4 md:self-start"
            currentCategorySlug={currentSlug}
            onSelectCategory={(newSlug) => navigate(`/categoria/${newSlug}`)}
            priceMin={categoryPriceRange.min}
            priceMax={categoryPriceRange.max}
            price={priceRange}
            onChangePrice={(newRange) =>
              setPriceRange({
                min: Number(newRange.min) || 0,
                max: Number(newRange.max) || Infinity
              })
            }
          />
        )}

        {/* Contenido */}
        <div className={hideFilters ? "w-full" : "flex-1"}>
          {!hideFilters && (
            <div className="mb-3 sm:mb-4">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>
          )}

          {store.loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="mt-2 text-gray-600">Cargando productos...</p>
            </div>
          ) : (
            // 2 cards por fila SIEMPRE (móvil y desktop)
            <div className="grid grid-cols-2 gap-3 sm:gap-6">
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
      </div>
    </div>
  )
}
