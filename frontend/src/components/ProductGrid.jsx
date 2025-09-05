"use client"

import { useState, useEffect } from "react"
import store from "../store/store.js"
import ProductCard from "./ProductCard.jsx"

export default function ProductGrid() {
  const [state, setState] = useState(store.getState())
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const unsubscribe = store.subscribe(setState)
    store.setState({
      products: [
        {
          id: 1,
          name: "Vape Desechable Elfbar 600",
          description: "600 puffs, sabor menta fresca",
          price: 2500,
          category: "Vapes Desechables",
          stock: 15,
          image: null,
        },
        {
          id: 2,
          name: "Pod Juul Starter Kit",
          description: "Kit completo con cargador y pods",
          price: 8900,
          category: "Pods",
          stock: 8,
          image: null,
        },
        {
          id: 3,
          name: "Líquido Premium 30ml",
          description: "Sabor frutas tropicales, 6mg nicotina",
          price: 1800,
          category: "Líquidos",
          stock: 25,
          image: null,
        },
        {
          id: 4,
          name: "Cargador Universal USB-C",
          description: "Compatible con la mayoría de dispositivos",
          price: 1200,
          category: "Accesorios",
          stock: 12,
          image: null,
        },
        {
          id: 5,
          name: "Vape Desechable Puff Bar",
          description: "300 puffs, sabor sandía",
          price: 2200,
          category: "Vapes Desechables",
          stock: 20,
          image: null,
        },
        {
          id: 6,
          name: "Pod Caliburn G2",
          description: "Recargable, batería de larga duración",
          price: 12500,
          category: "Pods",
          stock: 5,
          image: null,
        },
      ],
    })
    return unsubscribe
  }, [])

  const filteredProducts = state.products.filter((product) => {
    const matchesCategory = selectedCategory === "Todos" || product.category === selectedCategory
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const categories = ["Todos", ...new Set(state.products.map((product) => product.category))]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {state.loading ? (
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

      {filteredProducts.length === 0 && !state.loading && (
        <div className="text-center py-12">
          <p className="text-gray-600">No se encontraron productos que coincidan con tu búsqueda.</p>
        </div>
      )}
    </div>
  )
}
