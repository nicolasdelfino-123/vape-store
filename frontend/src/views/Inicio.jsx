import React, { useContext, useEffect } from 'react'
import { Context } from '../js/store/appContext.jsx';
import { Link } from "react-router-dom";
import ProductGrid from '../components/ProductGrid.jsx';

function Inicio() {
    const { store, actions } = useContext(Context);
    {/* ====== Sección: Visitános (Tailwind) ====== */ }
    {/*
  Pegá este bloque dentro de tu componente Inicio.jsx.
  Podés ajustar ADDRESS / HOURS / IG_URL / WA_URL y el zoom (z=19).
*/}

    const ADDRESS = "Vélez Sarsfield 303, Las Varillas, Córdoba";
    const HOURS = "Lun a Sáb 9:30–13:00 / 17:00–20:30";
    const IG_URL = "https://instagram.com/tuinstagram";
    const WA_URL = "https://wa.me/5493530000000";

    // Coordenadas exactas de tu link
    const LAT = -31.8704952;
    const LNG = -62.7228966;


    // Embed sin API key, centrado y con zoom alto (19). Agrego 'hl=es' para español.
    const MAP_EMBED = `https://www.google.com/maps?q=${LAT},${LNG}&z=17&hl=es&output=embed`;

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
            {/* seccion visitanos */}
            <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-center">
                    {/* Columna izquierda: texto */}
                    <div className="md:col-span-1 text-center md:text-left">
                        <span className="inline-block text-sm tracking-wider font-semibold text-purple-600 bg-purple-50 border border-purple-100 rounded-full px-3 py-1">
                            ¡Visitános!
                        </span>

                        <h2 className="mt-4 text-4xl sm:text-5xl font-extrabold text-gray-900">
                            {ADDRESS.split(",")[0]}
                        </h2>
                        <p className="mt-2 text-lg text-gray-500">
                            {ADDRESS.replace(ADDRESS.split(",")[0] + ", ", "")}
                        </p>

                        <p className="mt-5 text-gray-600">{HOURS}</p>

                        <div className="mt-6 flex justify-center md:justify-center gap-4">

                            {/* Instagram */}
                            <a
                                href={IG_URL}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-lime-400 text-lime-600 hover:bg-lime-50 transition"
                                aria-label="Instagram"
                                title="Instagram"
                            >
                                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                                    <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm10 2c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3h10zm-5 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm5.5-.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z" />
                                </svg>
                            </a>

                            {/* WhatsApp */}
                            <a
                                href={WA_URL}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-lime-400 text-lime-600 hover:bg-lime-50 transition"
                                aria-label="WhatsApp"
                                title="WhatsApp"
                            >
                                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                                    <path d="M20.52 3.48A11.9 11.9 0 0012.06 0C5.5 0 .2 5.3.2 11.86c0 2.09.55 4.12 1.6 5.92L0 24l6.4-1.73a11.8 11.8 0 005.66 1.45h.01c6.56 0 11.86-5.3 11.86-11.86 0-3.17-1.23-6.14-3.38-8.28zM12.07 21.6h-.01a9.75 9.75 0 01-4.98-1.36l-.36-.21-3.8 1.02 1.04-3.7-.23-.38a9.8 9.8 0 01-1.49-5.11c0-5.41 4.4-9.8 9.82-9.8 2.62 0 5.08 1.02 6.93 2.87a9.74 9.74 0 012.86 6.93c0 5.41-4.4 9.74-9.78 9.74zm5.64-7.29c-.31-.16-1.86-.92-2.14-1.02-.29-.11-.5-.16-.71.16-.2.31-.81 1.02-.99 1.23-.19.2-.37.23-.68.08-.31-.16-1.31-.48-2.5-1.52-.92-.81-1.54-1.81-1.73-2.12-.18-.31-.02-.48.14-.64.14-.14.31-.37.46-.56.16-.19.2-.31.31-.52.1-.2.05-.39-.02-.55-.07-.16-.71-1.7-.98-2.34-.26-.63-.53-.54-.71-.55-.18-.01-.39-.01-.6-.01-.2 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.29 3.26.16.2 2.22 3.55 5.38 4.98.75.33 1.33.52 1.79.66.75.24 1.43.21 1.98.13.6-.09 1.86-.76 2.13-1.49.26-.73.26-1.35.18-1.49-.08-.14-.28-.22-.59-.38z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Divider central (sólo desktop) */}
                    <div className="hidden md:block h-full w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent mx-auto" />

                    {/* Columna derecha: mapa (oscuro por CSS) */}
                    <div className="md:col-span-1">
                        <div className="rounded-xl overflow-hidden shadow-lg ring-1 ring-gray-200 bg-black">
                            <div className="aspect-video md:aspect-[4/3] map-dark">
                                <iframe
                                    src={MAP_EMBED}
                                    title="Ubicación en Google Maps"
                                    className="w-full h-full border-0"
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-block text-sm text-purple-600 hover:text-purple-800"
                        >
                            Abrir en Google Maps →
                        </a>
                    </div>
                </div>

                {/* Filtro para “estilo oscuro” del iframe (sin API key) */}
                <style>{`
    .map-dark iframe {
      /* Ajustá estos valores si querés más/menos contraste */
      filter: invert(90%) hue-rotate(180deg) saturate(0.7) brightness(0.85) contrast(1.05);
      /* Para mejorar la suavidad en algunos navegadores */
      transform: translateZ(0);
    }
  `}</style>
            </section>
            {/* CTA Section */}
            < section className="bg-purple-600 text-white py-12" >
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
            </section >


        </div >
    );
}

export default Inicio;