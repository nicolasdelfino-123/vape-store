import React from 'react'

const Footer = () => {
    return (
        <div>
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">VapeStore AR</h3>
                            <p className="text-gray-400">La mejor tienda de vapeadores en Argentina</p>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4">Productos</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li>Vapes Desechables</li>
                                <li>Pods</li>
                                <li>Líquidos</li>
                                <li>Accesorios</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4">Ayuda</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li>Preguntas Frecuentes</li>
                                <li>Envíos</li>
                                <li>Devoluciones</li>
                                <li>Contacto</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4">Contacto</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li>WhatsApp: +54 9 11 1234-5678</li>
                                <li>Email: info@vapestore.ar</li>
                                <li>Instagram: @vapestore_ar</li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2024 VapeStore Argentina. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Footer
