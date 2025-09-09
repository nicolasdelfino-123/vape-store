import { useState, useContext, useEffect, useRef } from "react";
import { Context } from "../js/store/appContext.jsx";
import { Link } from "react-router-dom";
import Cart from "../components/Cart.jsx";
import AccountDropdown from "../components/AccountDropdown.jsx";

export default function Header() {
  const { store, actions } = useContext(Context);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);

  // Referencias para el dropdown
  const productsDropdownRef = useRef(null);

  // shrink + mostrar/ocultar
  const [isScrolled, setIsScrolled] = useState(false);
  const [show, setShow] = useState(true);
  const lastY = useRef(0);
  const downScrolls = useRef(0);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef(null);

  // ⚙️ Ajustes rápidos de tamaño (en px)
  const LOGO_BASE_H = 300;
  const LOGO_SCROLL_H = 340;
  const LOGO_W = "auto";
  const USE_WHITE_KILLER = false;

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (productsDropdownRef.current && !productsDropdownRef.current.contains(event.target)) {
        setProductsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 10);

      const SCROLLS_TO_HIDE = 3;
      const SCROLL_END_DELAY = 150;

      const goingDown = y > lastY.current;
      const goingUp = y < lastY.current;

      if (goingDown && y > 10) {
        if (!isScrolling.current) {
          downScrolls.current += 1;
          if (downScrolls.current >= SCROLLS_TO_HIDE) setShow(false);
        }
        isScrolling.current = true;
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
          isScrolling.current = false;
        }, SCROLL_END_DELAY);
      } else if (goingUp || y < 10) {
        downScrolls.current = 0;
        setShow(true);
        isScrolling.current = false;
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      }

      lastY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  const cartItemsCount = (store.cart || []).reduce((t, i) => t + (i.quantity || 0), 0);

  // Categorías para el dropdown
  const productCategories = [
    { name: "Pods Recargables", route: "/categoria/pods-recargables", icon: "🔄" },
    { name: "Pods Descartables", route: "/categoria/pods-descartables", icon: "🎯" },
    { name: "Líquidos", route: "/categoria/liquidos", icon: "💧" },
    { name: "Accesorios", route: "/categoria/accesorios", icon: "⚙️" },
    { name: "Celulares", route: "/categoria/celulares", icon: "📱" },
    { name: "Perfumes", route: "/categoria/perfumes", icon: "🌸" },
  ];

  return (
    <header
      className={[
        "sticky top-0 z-50 bg-gray-900/90 backdrop-blur",
        "transition-all duration-300",
        isScrolled ? "shadow-lg" : "shadow-none",
        show ? "translate-y-0" : "-translate-y-full"
      ].join(" ")}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={["flex justify-between items-center", isScrolled ? "h-14 py-1" : "h-16 py-3"].join(" ")}>
          {/* Mobile hamburger menu - left */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Abrir menú"
              className="bg-transparent border-0 p-0 m-0"
              style={{ backgroundColor: 'transparent' }}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Logo */}
          <div className="flex-shrink-0 md:mr-auto">
            <Link to="/inicio" aria-label="Ir al inicio" className="block">
              <img
                src="logo-22.png"
                alt="Zarpados Vapers"
                className="block w-auto select-none transition-all duration-300"
                style={{
                  height: isScrolled ? LOGO_SCROLL_H : LOGO_BASE_H,
                  width: LOGO_W,
                  objectFit: "contain",
                  imageRendering: "auto",
                  mixBlendMode: USE_WHITE_KILLER ? "multiply" : "normal"
                }}
                decoding="async"
                loading="eager"
                fetchPriority="high"
              />
            </Link>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/inicio" className="hover:text-purple-400 transition-colors text-gray-300">Inicio</Link>

            {/* Dropdown de Productos */}
            <div className="relative" ref={productsDropdownRef}>
              <button
                onClick={() => setProductsDropdownOpen(!productsDropdownOpen)}
                className="flex items-center text-gray-300 hover:text-purple-400 bg-transparent p-0 border-0 rounded-none appearance-none focus:outline-none focus:ring-0 hover:bg-transparent active:bg-transparent"
                style={{ backgroundColor: 'transparent', boxShadow: 'none' }}
              >

                Productos
                <svg
                  className={`ml-1 w-4 h-4 transition-transform ${productsDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {productsDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">

                  <div className="py-2">
                    <Link
                      to="/products"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-medium border-b border-gray-100"
                      onClick={() => setProductsDropdownOpen(false)}
                    >
                      Ver todos los productos
                    </Link>
                    {productCategories.map((category) => (
                      <Link
                        key={category.route}
                        to={category.route}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        onClick={() => setProductsDropdownOpen(false)}
                      >
                        <span className="mr-3">{category.icon}</span>
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <a href="/#ofertas" className="hover:text-purple-400 transition-colors text-gray-300">Ofertas</a>
            <a href="/#contacto" className="hover:text-purple-400 transition-colors text-gray-300">Contacto</a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4 text-white ml-8">
            <AccountDropdown />

            {/* Carrito Desktop */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative hover:text-purple-400 transition-colors bg-transparent border-0 p-0"
              aria-label="Abrir carrito"
              title="Carrito"
            >
              <svg className={["w-6 h-6", isScrolled ? "scale-95" : "scale-100", "transition-transform"].join(" ")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9" />
              </svg>
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile cart - right */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative hover:text-purple-400 transition-colors bg-transparent border-0 p-0 text-white"
              aria-label="Abrir carrito"
              title="Carrito"
            >
              <svg className={["w-6 h-6", isScrolled ? "scale-95" : "scale-100", "transition-transform"].join(" ")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9" />
              </svg>
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute left-0 right-0 top-full bg-gray-800 shadow-lg z-50">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to="/inicio"
                className="block px-3 py-2 hover:text-purple-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Inicio
              </Link>

              {/* Productos en mobile */}
              <div className="px-3 py-2">
                <span className="block text-gray-200 font-medium mb-2">Productos:</span>
                <div className="ml-4 space-y-1">
                  <Link
                    to="/products"
                    className="block px-3 py-1 text-sm hover:text-purple-400 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Ver todos
                  </Link>
                  {productCategories.map((category) => (
                    <Link
                      key={category.route}
                      to={category.route}
                      className="block px-3 py-1 text-sm hover:text-purple-400 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {category.icon} {category.name}
                    </Link>
                  ))}
                </div>
              </div>

              <a
                href="/#ofertas"
                className="block px-3 py-2 text-gray-200 hover:text-purple-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Ofertas
              </a>
              <a
                href="/#contacto"
                className="block px-3 py-2 hover:text-purple-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Contacto
              </a>

              {/* Mobile: Ingresar solo si NO hay usuario */}
              {store.user ? (
                <div className="border-t border-gray-700 pt-2 ">
                  <div className="px-3 py-2 text-sm text-gray-300 ">Hola, {store.user.name}</div>
                  <button
                    onClick={() => { actions.logoutUser(); setIsMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 hover:text-purple-400 transition-colors"
                  >
                    Salir
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-700 pt-2">
                  <Link
                    to="/login"
                    className="block px-3 py-2 hover:text-purple-400 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Ingresar
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}