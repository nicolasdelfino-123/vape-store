import React, { useContext, useEffect } from 'react'
import { Context } from '../js/store/appContext.jsx';
import { Link } from "react-router-dom";
import ProductGrid from '../components/ProductGrid.jsx';

function Inicio() {
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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="bg-gray-900 text-white py-8 md:py-16 relative overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/hero-bg.png"
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
                </div>
            </section>


            {/* banner animado */}
            {/* banner animado */}
            <section className="relative bg-gray-800 py-4">
                {/* Fondo */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/banner-1.png"
                        alt="Banner background"
                        className="w-full h-full object-cover opacity-60"
                        loading="lazy"
                        decoding="async"
                    />
                </div>

                {/* Viewport que recorta: respeta tu margen lateral */}
                <div className="relative z-10 overflow-hidden whitespace-nowrap mx-[104px]">
                    {/* TRACK con 2 grupos idénticos → loop perfecto */}
                    <div className="marquee-track will-change-transform">
                        {/* Grupo 1 */}
                        <div className="marquee-group">
                            <span className="text-white text-lg md:text-xl font-semibold mx-[40px]">
                                ¡Envíos a todo el país! • Productos originales • Descuentos exclusivos
                            </span>
                            {/* Duplico dentro del grupo para asegurar ancho suficiente */}
                            <span className="text-white text-lg md:text-xl font-semibold mx-[40px]" aria-hidden="true">
                                ¡Envíos a todo el país! • Productos originales • Descuentos exclusivos
                            </span>
                        </div>
                        {/* Grupo 2 (clon) */}
                        <div className="marquee-group" aria-hidden="true">
                            <span className="text-white text-lg md:text-xl font-semibold mx-[40px]">
                                ¡Envíos a todo el país! • Productos originales • Descuentos exclusivos
                            </span>
                            <span className="text-white text-lg md:text-xl font-semibold mx-[40px]" aria-hidden="true">
                                ¡Envíos a todo el país! • Productos originales • Descuentos exclusivos
                            </span>
                        </div>
                    </div>
                </div>

                <style>{`
    .marquee-track {
      display: inline-flex;
      animation: marquee 32s linear infinite;
    }
    .marquee-group {
      display: inline-flex;
    }
    /* Se anima solo hasta -50% porque hay 2 grupos idénticos → no hay baches */
    @keyframes marquee {
      from { transform: translateX(0); }
      to   { transform: translateX(-50%); }
    }
  `}</style>
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


        </div>
    );
}

export default Inicio;