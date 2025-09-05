import { useState, useContext } from "react";
import { Context } from "../js/store/appContext.jsx";
import { Link } from "react-router-dom";
import Cart from "../components/Cart.jsx";

export default function Header() {
  const { store, actions } = useContext(Context);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const cartItemsCount = (store.cart || []).reduce(
    (total, item) => total + (item.quantity || 0),
    0
  );

  return (
    <header className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-purple-400">Zarpados Vapers</h1>
          </div>

          {/* Navigation Desktop (centro/izquierda) */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/products" className="hover:text-purple-400 transition-colors">
              Productos
            </Link>
            <a href="/#ofertas" className="hover:text-purple-400 transition-colors">
              Ofertas
            </a>
            <a href="/#contacto" className="hover:text-purple-400 transition-colors">
              Contacto
            </a>
          </nav>

          {/* Acciones (derecha): Ingresar/Usuario + Carrito */}
          <div className="flex items-center space-x-4">
            {store.user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm">Hola, {store.user.name}</span>
                <button
                  onClick={() => actions.logoutUser()}
                  className="text-sm hover:text-purple-400"
                >
                  Salir
                </button>
              </div>
            ) : (
              <Link to="/login" className="hover:text-purple-400 transition-colors">
                Ingresar
              </Link>
            )}

            {/* Ícono de carrito: pegado a “Ingresar” (derecha) */}
            {/* Cart */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative hover:text-purple-400 transition-colors bg-transparent border-0 p-0"
              aria-label="Abrir carrito"
              title="Carrito"
            >
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



            {/* Botón menú mobile */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Abrir menú"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navegación Mobile */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-800">
              <Link to="/products" className="block px-3 py-2 hover:text-purple-400">
                Productos
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setCartOpen(true);
                }}
                className="block w-full text-left px-3 py-2 hover:text-purple-400"
              >
                Carrito
              </button>
              <a href="/#ofertas" className="block px-3 py-2 hover:text-purple-400">
                Ofertas
              </a>
              <a href="/#contacto" className="block px-3 py-2 hover:text-purple-400">
                Contacto
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Drawer del carrito montado en el Header */}
      <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}
