import React, { useContext, useEffect } from 'react'
import { Context } from '../js/store/appContext.jsx';
import { Link } from "react-router-dom";
import ProductGrid from '../components/ProductGrid.jsx';
import heroBg from '@/assets/hero-bg.png'
import recargables from '@/assets/recargables.png'
import celu from '@/assets/celu.png'
import desechables from '@/assets/desechables.png'
import perfumes from '@/assets/perfumes.png'


function Home() {
  const { store, actions } = useContext(Context);

  useEffect(() => {
    const getMsgDemo = async () => {
      const msg = await actions.demoFunction();
      if (!msg) {
        store.demoMsg = "Error fetching message";
        return false;
      }
    };
    getMsgDemo();
  }, []); // Array de dependencias vacío para que solo se ejecute una vez

  // contador de items del carrito
  const cartItemsCount = (store.cart || []).reduce(
    (t, i) => t + (Number(i.quantity) || 0), 0
  );



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gray-900 text-white py-8 md:py-16 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBg}
            alt="Vapeadores background"
            className="w-full h-full object-cover opacity-30"
            loading="eager"
            decoding="async"
          />
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 text-white">¡Envíos a todo el país!</h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-6 md:mb-8 text-gray-200">Hacemos envíos a toda la Argentina</p>
          <button
            onClick={() => document.getElementById("productos").scrollIntoView({ behavior: "smooth" })}
            className="bg-purple-600 text-white px-6 py-2 sm:px-8 sm:py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Ver Productos
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Envío Gratis</h3>
              <p className="text-sm sm:text-base text-gray-600">En compras superiores a $15.000</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Calidad Garantizada</h3>
              <p className="text-sm sm:text-base text-gray-600">Productos originales y certificados</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Pago Seguro</h3>
              <p className="text-sm sm:text-base text-gray-600">MercadoPago y transferencias</p>
            </div>
          </div>
          {/* Categorías (cards con imagen + botón VER) */}
          <section className="py-6 md:py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

                {/* PODS RECARGABLES */}
                <div className="group relative rounded-xl overflow-hidden shadow-md h-28 sm:h-32 md:h-36">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-200 group-hover:scale-[1.02]"
                    style={{ backgroundImage: `url(${recargables})` }}
                    aria-hidden
                  />
                  <div className="absolute inset-0 bg-black/20" aria-hidden />
                  <div className="relative h-full flex items-center">
                    <div className="px-5">
                      <Link
                        to="/categoria/pods-recargables"
                        className="inline-block"
                        aria-label="Ir a Pods Recargables"
                      >
                        <h3 className="text-white text-xl font-extrabold uppercase leading-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.25)]">
                          PODS<br />RECARGABLES
                        </h3>
                      </Link>
                      <Link
                        to="/categoria/pods-recargables"
                        className="inline-block mt-2 bg-yellow-300 text-black font-extrabold text-sm px-3 py-1 rounded"
                      >
                        VER
                      </Link>
                    </div>
                  </div>
                </div>

                {/* CELULARES */}
                <div className="group relative rounded-xl overflow-hidden shadow-md h-28 sm:h-32 md:h-36">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-200 group-hover:scale-[1.02]"
                    style={{ backgroundImage: `url(${celu})` }}
                    aria-hidden
                  />
                  <div className="absolute inset-0 bg-black/20" aria-hidden />

                  {/* dentro de la card */}
                  <div className="relative h-full flex items-start">   {/* nada de items-center */}
                    <div className="px-5 py-4 flex flex-col gap-2 h-full">  {/* columna con pequeño gap */}
                      <Link
                        to="/categoria/celulares"
                        className="block"
                        aria-label="Ir a Celulares"
                      >
                        <h3 className="text-white text-xl font-extrabold uppercase leading-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.25)]">
                          CELULARES
                        </h3>
                      </Link>

                      <Link
                        to="/categoria/celulares"
                        className="self-start bg-yellow-300 text-black font-extrabold text-sm px-3 py-1 my-4 rounded"
                      >
                        VER
                      </Link>
                    </div>
                  </div>


                </div>

                {/* PODS DESCARTABLES */}
                <div className="group relative rounded-xl overflow-hidden shadow-md h-28 sm:h-32 md:h-36">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-200 group-hover:scale-[1.02]"
                    style={{ backgroundImage: `url(${desechables})` }}
                    aria-hidden
                  />
                  <div className="absolute inset-0 bg-black/20" aria-hidden />
                  <div className="relative h-full flex items-center">
                    <div className="px-5">
                      <Link
                        to="/categoria/pods-descartables"
                        className="inline-block"
                        aria-label="Ir a Pods Descartables"
                      >
                        <h3 className="text-white text-xl font-extrabold uppercase leading-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.25)]">
                          PODS<br />DESCARTABLES
                        </h3>
                      </Link>
                      <Link
                        to="/categoria/pods-descartables"
                        className="inline-block mt-2 bg-yellow-300 text-black font-extrabold text-sm px-3 py-1 rounded"
                      >
                        VER
                      </Link>
                    </div>
                  </div>
                </div>

                {/* PERFUMES */}
                <div className="group relative rounded-xl overflow-hidden shadow-md h-28 sm:h-32 md:h-36">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-200 group-hover:scale-[1.02]"
                    style={{ backgroundImage: `url(${perfumes})` }}
                    aria-hidden
                  />
                  <div className="absolute inset-0 bg-black/20" aria-hidden />
                  <div className="relative h-full flex items-start">
                    <div className="px-5 py-4 flex flex-col gap-2">
                      <Link
                        to="/categoria/perfumes"
                        className="block"
                        aria-label="Ir a Perfumes"
                      >
                        <h3 className="text-white text-xl font-extrabold uppercase leading-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.25)]">
                          PERFUMES
                        </h3>
                      </Link>

                      <Link
                        to="/categoria/perfumes"
                        className="self-start bg-yellow-300 text-black font-extrabold text-sm px-3 py-1 my-4 rounded"
                      >
                        VER
                      </Link>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </section>

        </div>
      </section>

      {/* Products Section */}
      <section id="productos" className="py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 md:mb-12">Nuestros Productos</h2>
          <ProductGrid />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Nuevo en el mundo del vapeo?</h2>
          <p className="text-lg mb-6">Creá tu cuenta y obtené descuentos exclusivos</p>
          <div className="space-x-4">
            <Link
              to="/register"
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Registrarse
            </Link>
            <Link
              to="/login"
              className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}

    </div>
  );
}

export default Home;