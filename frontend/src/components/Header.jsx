"use client"

import { useState, useEffect } from "react"
import store, { actions } from "../store/store.js"

export default function Header() {
  const [state, setState] = useState(store.getState())
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = store.subscribe(setState)
    return unsubscribe
  }, [])

  const cartItemsCount = state.cart.reduce((total, item) => total + item.quantity, 0)

  return (
    <header className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-purple-400">VapeStore AR</h1>
          </div>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex space-x-8">
            <a href="#productos" className="hover:text-purple-400 transition-colors">
              Productos
            </a>
            <a href="#categorias" className="hover:text-purple-400 transition-colors">
              Categorías
            </a>
            <a href="#ofertas" className="hover:text-purple-400 transition-colors">
              Ofertas
            </a>
            <a href="#contacto" className="hover:text-purple-400 transition-colors">
              Contacto
            </a>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {state.user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm">Hola, {state.user.name}</span>
                <button onClick={() => actions.logoutUser()} className="text-sm hover:text-purple-400">
                  Salir
                </button>
              </div>
            ) : (
              <button className="hover:text-purple-400 transition-colors">Ingresar</button>
            )}

            {/* Cart */}
            <button className="relative hover:text-purple-400 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9"
                />
              </svg>
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-800">
              <a href="#productos" className="block px-3 py-2 hover:text-purple-400">
                Productos
              </a>
              <a href="#categorias" className="block px-3 py-2 hover:text-purple-400">
                Categorías
              </a>
              <a href="#ofertas" className="block px-3 py-2 hover:text-purple-400">
                Ofertas
              </a>
              <a href="#contacto" className="block px-3 py-2 hover:text-purple-400">
                Contacto
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
