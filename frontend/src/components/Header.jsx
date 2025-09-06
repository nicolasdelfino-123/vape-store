import { useState, useContext, useEffect, useRef } from "react";
import { Context } from "../js/store/appContext.jsx";
import { Link } from "react-router-dom";
import Cart from "../components/Cart.jsx";

export default function Header() {
  const { store, actions } = useContext(Context);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  // shrink + mostrar/ocultar
  const [isScrolled, setIsScrolled] = useState(false);
  const [show, setShow] = useState(true);
  const lastY = useRef(0);
  const downSteps = useRef(0);            // 👈 NUEVO: cuenta “pasos” bajando

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 10);

      // dirección
      const goingDown = y > lastY.current + 2;  // +2 para evitar jitter
      const goingUp = y < lastY.current - 2;

      if (goingDown) {
        downSteps.current += 1;                // suma pasos bajando
        if (downSteps.current >= 3 && y > 10)  // 👈 oculta recién al 3er “paso”
          setShow(false);
      } else if (goingUp || y < 10) {
        downSteps.current = 0;                 // resetea
        setShow(true);                         // muestra al subir o arriba
      }

      lastY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cartItemsCount = (store.cart || []).reduce((t, i) => t + (i.quantity || 0), 0);

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
          <div className="flex-shrink-0">
            <h1 className={["font-bold text-purple-400 tracking-wide transition-all duration-300", isScrolled ? "text-xl" : "text-2xl"].join(" ")}>
              Zarpados Vapers
            </h1>
          </div>

          <nav className="hidden md:flex space-x-8 text-white">
            <Link to="/inicio" className="hover:text-purple-400 transition-colors">Inicio</Link>
            <Link to="/products" className="hover:text-purple-400 transition-colors">Productos</Link>
            <a href="/#ofertas" className="hover:text-purple-400 transition-colors">Ofertas</a>
            <a href="/#contacto" className="hover:text-purple-400 transition-colors">Contacto</a>
          </nav>

          <div className="flex items-center space-x-4 text-white">
            {store.user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm">Hola, {store.user.name}</span>
                <button onClick={() => actions.logoutUser()} className="text-sm hover:text-purple-400">Salir</button>
              </div>
            ) : (
              <Link to="/login" className="hover:text-purple-400 transition-colors">Ingresar</Link>
            )}

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

            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Abrir menú">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-800">
              <Link to="/products" className="block px-3 py-2 hover:text-purple-400">Productos</Link>
              <button
                type="button"
                onClick={() => { setIsMenuOpen(false); setCartOpen(true); }}
                className="block w-full text-left px-3 py-2 hover:text-purple-400"
              >
                Carrito
              </button>
              <a href="/#ofertas" className="block px-3 py-2 hover:text-purple-400">Ofertas</a>
              <a href="/#contacto" className="block px-3 py-2 hover:text-purple-400">Contacto</a>
            </div>
          </div>
        )}
      </div>

      <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}
