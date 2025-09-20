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
// 👇 pega esto cerca de SLUG_TO_NAME
const normalizeBrand = (b = "") =>
  String(b).trim().replace(/\s+/g, " ").toLowerCase()

// normaliza "Aloe   Grape ICE" -> "aloe grape ice"
const normalizeFlavor = (s = "") =>
  String(s).trim().replace(/\s+/g, " ").toLowerCase()



export default function ProductGrid({ category, hideFilters = false }) {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { store, actions } = useContext(Context)

  const [searchTerm, setSearchTerm] = useState("")
  const [priceRange, setPriceRange] = useState({ min: 0, max: Infinity })
  // 👇 NUEVO: selección de marcas
  const [selectedBrands, setSelectedBrands] = useState([]) // ej: ["ignite","elfbar"]
  const [selectedPuffs, setSelectedPuffs] = useState([])      // ej: [8000, 10000]
  const [selectedFlavors, setSelectedFlavors] = useState([])  // ej: ["Menta","Frutilla"]



  const currentSlug = slug
  const currentCategoryName = category || (currentSlug ? SLUG_TO_NAME[currentSlug] : null)

  useEffect(() => {
    if (actions?.fetchProducts) actions.fetchProducts()
  }, [])

  useEffect(() => {
    setSearchTerm("")
    setPriceRange({ min: 0, max: Infinity })
    setSelectedBrands([]) // reset marcas al cambiar de categoría
    window.scrollTo(0, 0)
    setSelectedPuffs([])       // 👈 agrega
    setSelectedFlavors([])     // 👈 agrega
  }, [slug, category])

  const categoryProducts = useMemo(() => {
    const products = store.products || []
    if (hideFilters && !currentCategoryName) return products.slice(0, 12)
    if (!currentCategoryName) return products
    return products.filter(p => p.category_name === currentCategoryName)
  }, [store.products, currentCategoryName, slug, category, hideFilters])

  // 👇 NUEVO: marcas disponibles con contador
  const brandOptions = useMemo(() => {
    const counter = new Map()
    for (const p of categoryProducts) {
      if (!p?.brand) continue
      const key = normalizeBrand(p.brand)
      if (!key) continue
      counter.set(key, (counter.get(key) || 0) + 1)
    }
    return Array.from(counter.entries())
      .map(([key, count]) => ({ key, count, label: key.toUpperCase() }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [categoryProducts])

  // Opciones de Puffs (conteo por valor exacto)
  const puffsOptions = useMemo(() => {
    const counter = new Map()
    for (const p of categoryProducts) {
      const v = Number(p?.puffs)
      if (!Number.isFinite(v) || v <= 0) continue
      counter.set(v, (counter.get(v) || 0) + 1)
    }
    return Array.from(counter.entries())
      .map(([value, count]) => ({ value, count, label: `${value}` }))
      .sort((a, b) => a.value - b.value)
  }, [categoryProducts])

  // Opciones de Sabores (strings)
  // Opciones de Sabores (agrupadas por clave normalizada)
  const flavorOptions = useMemo(() => {
    const map = new Map(); // key = normalizeFlavor, value = { value, label, count }
    for (const p of categoryProducts) {
      const arr = Array.isArray(p?.flavors) ? p.flavors : [];
      for (const fRaw of arr) {
        const key = normalizeFlavor(fRaw);
        if (!key) continue;
        const prev = map.get(key);
        if (prev) {
          prev.count += 1;
        } else {
          map.set(key, { value: key, label: String(fRaw).trim(), count: 1 });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [categoryProducts]);



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
    const hasBrandFilter = selectedBrands.length > 0

    return categoryProducts.filter(product => {
      const name = product.name?.toLowerCase() || ""
      const brandNorm = normalizeBrand(product.brand || "")

      const matchesSearch = !q || name.includes(q) || brandNorm.includes(q)
      const price = Number(product.price) || 0
      const matchesPrice =
        price >= priceRange.min &&
        (priceRange.max === Infinity || price <= priceRange.max)

      const matchesBrand = !hasBrandFilter || (brandNorm && selectedBrands.includes(brandNorm))
      // Filtro por Puffs (si hay checks, el producto debe tener uno de ellos)
      const matchesPuffs = selectedPuffs.length === 0
        ? true
        : (Number(product.puffs) > 0 && selectedPuffs.includes(Number(product.puffs)))

      // Filtro por Sabores (si hay checks, al menos un sabor debe coincidir)
      // Filtro por Sabores (si hay checks, al menos un sabor coincida normalizado)
      const matchesFlavors =
        selectedFlavors.length === 0
          ? true
          : (Array.isArray(product.flavors) &&
            product.flavors.some(f => selectedFlavors.includes(normalizeFlavor(f))));


      return matchesSearch && matchesPrice && matchesBrand && matchesPuffs && matchesFlavors

    })
  }, [categoryProducts, searchTerm, priceRange, selectedBrands, selectedPuffs, selectedFlavors]);



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
            // 👇 NUEVO: fabricantes
            brandOptions={brandOptions}
            selectedBrands={selectedBrands}
            onToggleBrand={(key) => setSelectedBrands(prev => prev.includes(key) ? prev.filter(b => b !== key) : [...prev, key])}
            onClearBrands={() => setSelectedBrands([])}

            // 👇 NUEVO: Puffs
            puffsOptions={puffsOptions}
            selectedPuffs={selectedPuffs}
            onTogglePuffs={(v) => setSelectedPuffs(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])}
            onClearPuffs={() => setSelectedPuffs([])}

            // 👇 NUEVO: Sabores
            flavorOptions={flavorOptions}
            selectedFlavors={selectedFlavors}
            onToggleFlavor={(v) => setSelectedFlavors(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])}
            onClearFlavors={() => setSelectedFlavors([])}

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
