// Componente simple para mostrar productos destacados en inicio
import { useContext, useEffect } from "react"
import { Context } from "../js/store/appContext"
import ProductCard from "./ProductCard.jsx"

export default function ProductsHome() {
    const { store, actions } = useContext(Context)

    useEffect(() => {
        if (actions?.fetchProducts) {
            actions.fetchProducts()
        }
    }, [])

    // Mostrar máximo 12 productos
    const featuredProducts = (store.products || []).slice(0, 12)

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Productos Destacados</h1>
                <p className="text-gray-600">
                    {featuredProducts.length} productos disponibles
                </p>
            </div>

            {/* Grid de productos */}
            {store.loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <p className="mt-2 text-gray-600">Cargando productos...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {featuredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}

            {featuredProducts.length === 0 && !store.loading && (
                <div className="text-center py-12">
                    <p className="text-gray-600">No hay productos disponibles.</p>
                </div>
            )}
        </div>
    )
}
