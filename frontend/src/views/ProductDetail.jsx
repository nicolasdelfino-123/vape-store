import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Context } from '../js/store/appContext.jsx';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { store, actions } = useContext(Context);
    const [quantity, setQuantity] = useState(1);

    // Cargar productos si no están disponibles
    useEffect(() => {
        if (!store.products || store.products.length === 0) {
            if (actions && actions.fetchProducts) {
                actions.fetchProducts();
            }
        }
    }, []); // Solo ejecutar una vez al montar el componente

    // Buscar el producto en el store
    const product = store.products?.find(p => p.id === parseInt(id));

    const handleAddToCart = () => {
        if (actions && actions.addToCart && product) {
            actions.addToCart(product, quantity);
        }
    };

    const handleBackToProducts = () => {
        navigate(-1); // Volver a la página anterior
    };

    if (!product) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Producto no encontrado</h2>
                    <button
                        onClick={handleBackToProducts}
                        className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Volver a productos
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Botón volver */}
                <button
                    onClick={handleBackToProducts}
                    className="mb-6 flex items-center text-purple-600 hover:text-purple-700 transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver
                </button>

                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="grid md:grid-cols-2 gap-8 p-8">

                        {/* Imagen del producto */}
                        <div>
                            <img
                                src={product.image_url || '/placeholder-product.jpg'}
                                alt={product.name}
                                className="w-full h-96 object-cover rounded-lg"
                            />
                        </div>

                        {/* Detalles del producto */}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

                            {product.brand && (
                                <p className="text-lg text-purple-600 mb-4">Marca: {product.brand}</p>
                            )}

                            <p className="text-gray-600 mb-6 text-lg leading-relaxed">{product.description}</p>

                            <div className="mb-6">
                                <span className="text-4xl font-bold text-purple-600">${product.price?.toLocaleString('es-AR')}</span>
                            </div>

                            <div className="mb-6">
                                <p className="text-sm text-gray-500 mb-2">Stock disponible: {product.stock} unidades</p>
                                <p className="text-sm text-gray-500">Categoría: {product.category_name}</p>
                            </div>

                            {/* Cantidad y agregar al carrito */}
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="flex items-center border border-gray-300 rounded-lg">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="px-3 py-2 text-gray-600 hover:text-gray-800"
                                    >
                                        -
                                    </button>
                                    <span className="px-4 py-2 font-medium">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                        className="px-3 py-2 text-gray-600 hover:text-gray-800"
                                    >
                                        +
                                    </button>
                                </div>

                                <button
                                    onClick={handleAddToCart}
                                    disabled={product.stock === 0}
                                    className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {product.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
                                </button>
                            </div>

                            {/* Información adicional */}
                            <div className="border-t pt-6">
                                <h3 className="font-semibold text-gray-900 mb-3">Información del producto:</h3>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li>• Envío gratis en compras superiores a $15.000</li>
                                    <li>• Garantía de calidad</li>
                                    <li>• Pago seguro con MercadoPago</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
