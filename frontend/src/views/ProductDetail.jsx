import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Context } from '../js/store/appContext.jsx';

// --- helpers de sabores ---
const normalizeFlavor = (s) =>
    s.replace(/\s+/g, ' ').trim().replace(/^[-•·]+/, '').trim();

const extractFlavorsFromDescription = (txt = '') => {
    // Busca "Sabor:" y toma sólo lo que viene después (hasta el fin)
    const m = txt.match(/sabor\s*:\s*(.+)$/i);
    if (!m) return [];
    // separa por coma | barra | salto
    const parts = m[1].split(/,|\||\/|\n/);
    const flavors = parts
        .map(normalizeFlavor)
        .filter(Boolean)
        .filter((f) => !/^peso\b|^dimensiones\b/i.test(f)); // descarta ruido
    // dedup
    return [...new Set(flavors)];
};

const getFlavors = (product) => {
    if (!product) return [];
    if (Array.isArray(product?.flavors) && product.flavors.length) return product.flavors;
    return extractFlavorsFromDescription(product?.description || '');
};

// Mapa nombre de categoría -> slug (coincide con ProductGrid)
const NAME_TO_SLUG = {
    "Vapes Desechables": "vapes-desechables",
    "Pods Recargables": "pods-recargables",
    "Líquidos": "liquidos",
    "Accesorios": "accesorios",
    "Celulares": "celulares",
    "Perfumes": "perfumes",
};


const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { store, actions } = useContext(Context);
    const product = store.products?.find((p) => p.id === parseInt(id));

    const [quantity, setQuantity] = useState(1);
    const [selectedFlavor, setSelectedFlavor] = useState('');
    const [activeTab, setActiveTab] = useState('desc'); // 'desc' | 'info'
    const [flavorError, setFlavorError] = useState('');
    const [descExpanded, setDescExpanded] = useState(false);



    useEffect(() => {
        if (!store.products || store.products.length === 0) {
            actions?.fetchProducts?.();
        }
    }, []);



    // Calcular opciones de sabor de forma segura
    const flavorOptions = getFlavors(product);

    // Helper para stock por sabor
    const getFlavorStock = (flavor) => {
        if (!product || !Array.isArray(product.flavor_catalog)) return null;
        const found = product.flavor_catalog.find(f => f.name === flavor);
        return found ? found.stock : null;
    };

    const getMaxStock = () => {
        if (selectedFlavor && Array.isArray(product.flavor_catalog)) {
            const found = product.flavor_catalog.find(f => f.name === selectedFlavor);
            if (found && typeof found.stock === 'number') return found.stock;
        }
        return product.stock;
    };

    const handleAddToCart = () => {
        if (flavorOptions.length > 0 && !selectedFlavor) {
            setFlavorError('Elegí un sabor antes de agregar al carrito');
            return;
        }
        if (quantity > getMaxStock()) {
            setFlavorError(`Solo hay ${getMaxStock()} unidades disponibles${selectedFlavor ? ' para ese sabor' : ''}`);
            return;
        }
        if (actions && actions.addToCart && product) {
            const productWithFlavor = selectedFlavor ? { ...product, selectedFlavor } : product;
            actions.addToCart(productWithFlavor, quantity);
        }
    };

    const handleBackToProducts = () => {
        // Si el producto tiene categoría conocida, navega a esa categoría
        if (product?.category_name && typeof product.category_name === 'string') {
            const slug = NAME_TO_SLUG[product.category_name.trim()];
            if (slug) {
                navigate(`/categoria/${slug}`);
                return;
            }
        }
        // Si no, navega SIEMPRE a /products (nunca a inicio)
        navigate('/products');
    };
    // Destino de "Volver": categoría si existe, sino /products
    const backHref =
        (product?.category_name && NAME_TO_SLUG[product.category_name.trim()])
            ? `/categoria/${NAME_TO_SLUG[product.category_name.trim()]}`
            : '/products';


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
                <Link
                    to={backHref}
                    onClick={(e) => {
                        // cortamos bubbling por si el header intenta capturar
                        e.stopPropagation();
                        console.log('🔙 Volver ->', backHref);
                    }}
                    className="relative z-50 pointer-events-auto mb-6 flex items-center text-purple-600 hover:text-purple-700 transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver
                </Link>


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

                            <div className="mb-6">
                                <span className="text-4xl font-bold text-purple-600">
                                    ${product.price?.toLocaleString('es-AR')}
                                </span>
                            </div>

                            <div className="mb-6">

                                <p className="text-sm text-gray-500">Categoría: {product.category_name}</p>
                            </div>
                            {product.description && (
                                <div className="mt-3">
                                    <h3 className="text-sm font-medium text-gray-700 mb-1">Descripción</h3>
                                    <p className="text-gray-700 whitespace-pre-line">
                                        {product.description}
                                    </p>
                                </div>
                            )}


                            {/* Sabor (solo si hay sabores detectados) */}
                            {flavorOptions.length > 0 && (
                                <div className="mb-4">
                                    <label className="mb-1 block text-sm font-medium">Sabor</label>
                                    <select
                                        className={`w-full rounded border px-3 py-2 ${flavorError ? 'border-red-500 ring-1 ring-red-300' : 'border-gray-300'
                                            }`}
                                        value={selectedFlavor}
                                        onChange={(e) => {
                                            setSelectedFlavor(e.target.value);
                                            if (flavorError) setFlavorError('');
                                        }}
                                    >
                                        <option value="">Seleccionar sabor…</option>
                                        {flavorOptions.map((f) => (
                                            <option key={f} value={f}>
                                                {f}
                                            </option>
                                        ))}
                                    </select>
                                    {flavorError && <p className="mt-1 text-xs text-red-600">{flavorError}</p>}
                                </div>
                            )}

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
                                        onClick={() => setQuantity(Math.min(getMaxStock(), quantity + 1))}
                                        className="px-3 py-2 text-gray-600 hover:text-gray-800"
                                    >
                                        +
                                    </button>
                                </div>

                                <button
                                    onClick={handleAddToCart}
                                    disabled={
                                        product.stock === 0 ||
                                        (flavorOptions.length > 0 && !selectedFlavor) ||
                                        quantity > getMaxStock()
                                    }
                                    className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {product.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
                                </button>
                            </div>

                            {/* Pestañas: Descripción / Información adicional */}
                            <div className="mt-4">
                                <div className="flex gap-4 border-b">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('desc')}
                                        className={`px-3 py-2 -mb-px border-b-2 ${activeTab === 'desc'
                                            ? 'border-purple-600 text-purple-700 font-semibold'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        Descripción
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('info')}
                                        className={`px-3 py-2 -mb-px border-b-2 ${activeTab === 'info'
                                            ? 'border-purple-600 text-purple-700 font-semibold'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        Información adicional
                                    </button>
                                </div>

                                {/* Contenido de pestañas */}
                                {activeTab === 'desc' ? (
                                    <div className="pt-4">
                                        <div className="relative">
                                            <p
                                                className={`text-gray-700 whitespace-pre-line`}
                                                style={
                                                    descExpanded
                                                        ? { maxHeight: 'none', overflow: 'visible', display: 'block' }
                                                        : { maxHeight: '12em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 8, WebkitBoxOrient: 'vertical' }
                                                }
                                            >
                                                {product.short_description || 'Sin descripción.'}
                                            </p>
                                            {(product.short_description?.length ?? 0) > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setDescExpanded((v) => !v)}
                                                    className="mt-2 text-purple-600 hover:text-purple-800 text-sm flex items-center gap-1"
                                                >
                                                    {descExpanded ? (
                                                        <>
                                                            Ver menos
                                                            <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </>
                                                    ) : (
                                                        <>
                                                            Ver más
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="pt-4 space-y-3">
                                        {getFlavors(product).length > 0 ? (
                                            <div>
                                                <h4 className="font-medium mb-2">Sabores disponibles</h4>
                                                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                                                    {getFlavors(product).map((f) => (
                                                        <li key={f}>{f}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : (
                                            <p className="text-gray-500">Sin sabores especificados.</p>
                                        )}
                                    </div>
                                )}


                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
