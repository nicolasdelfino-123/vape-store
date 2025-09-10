// src/components/Checkout.jsx
import React, { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Context } from '../js/store/appContext'
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react'

const Checkout = () => {
    const { store, actions } = useContext(Context)
    const navigate = useNavigate()

    // Inicializar MercadoPago con tu Public Key
    // Inicializar MercadoPago con tu Public Key desde .env (sin fallback a prod)
    useEffect(() => {
        try {
            const pk = import.meta.env.VITE_MP_PUBLIC_KEY
            if (!pk) {
                console.error('Falta VITE_MP_PUBLIC_KEY en el .env del frontend')
                alert('Configura VITE_MP_PUBLIC_KEY en el frontend (.env)')
                return
            }
            console.log('Inicializando MercadoPago SDK con clave TEST…')
            initMercadoPago(pk, { locale: 'es-AR' })
        } catch (err) {
            console.error('Error inicializando MercadoPago:', err)
        }
    }, [])



    const [customerData, setCustomerData] = useState({
        email: store.user?.email || '',
        firstName: store.user?.name?.split(' ')[0] || '',
        lastName: store.user?.name?.split(' ').slice(1).join(' ') || '',
        phone: '',
        address: '',
        city: '',
        zipCode: ''
    })

    const [preferenceId, setPreferenceId] = useState(null)
    const [loading, setLoading] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState('')

    // Calcular totales
    const subtotal = store.cart?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0
    const shipping = 0 // Gratis por ahora
    const total = subtotal + shipping

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setCustomerData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const createPreference = async () => {
        setLoading(true)
        try {
            console.log('=== CREANDO PREFERENCIA ===')
            console.log('Store cart:', store.cart)
            console.log('Customer data:', customerData)

            if (!store.cart || store.cart.length === 0) {
                throw new Error('El carrito está vacío')
            }

            // Items en formato correcto
            const items = store.cart.map((item) => {
                const qty = Math.max(1, parseInt(item.quantity || 1, 10))
                const price = Number(item.price)
                if (!Number.isFinite(price) || price <= 0) {
                    throw new Error(`Precio inválido para ${item.name}`)
                }
                return {
                    id: String(item.id ?? item.sku ?? Math.random()),
                    title: item.name,
                    quantity: qty,
                    unit_price: price,
                    // currency_id lo pone el backend; si querés redundar:
                    // currency_id: 'ARS',
                }
            })

            // Estructura mínima requerida por tu backend
            const preferenceData = {
                items,
                payer: {
                    email: customerData.email,
                    name: customerData.firstName || '',
                    surname: customerData.lastName || ''
                },
                // El backend setea back_urls; no es obligatorio mandarlas desde acá.
            }

            const token = localStorage.getItem('token')
            const headers = token
                ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
                : { 'Content-Type': 'application/json' }

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/mercadopago/create-preference`, {
                method: 'POST',
                headers,
                body: JSON.stringify(preferenceData)
            })

            console.log('Response status:', response.status)

            if (!response.ok) {
                const errorText = await response.text()
                console.error('Response error:', errorText)
                let errorData
                try { errorData = JSON.parse(errorText) } catch { errorData = { error: errorText } }
                throw new Error(errorData.error || `Error HTTP ${response.status}`)
            }

            const data = await response.json()
            console.log('Response data exitosa:', data)

            if (data.preference_id) {
                setPreferenceId(data.preference_id)
                console.log('Preference ID configurado:', data.preference_id)
            } else {
                throw new Error('No se recibió preference_id en la respuesta')
            }

        } catch (error) {
            console.error('Error creating preference:', error)
            alert(`Error al crear la preferencia de pago: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }


    const isFormValid = () => {
        return customerData.email &&
            customerData.firstName &&
            customerData.lastName &&
            customerData.phone &&
            customerData.address &&
            customerData.city &&
            customerData.zipCode &&
            paymentMethod === 'mercadopago'
    }

    if (!store.cart || store.cart.length === 0) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Tu carrito está vacío</h2>
                    <p className="text-gray-600 mb-6">Agrega productos para continuar con la compra</p>
                    <button
                        onClick={() => navigate('/inicio')}
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Ir a la tienda
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Finalizar Compra</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Formulario de datos */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">Datos de contacto</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={customerData.firstName}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Apellido *
                                </label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={customerData.lastName}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email *
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={customerData.email}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                required
                            />
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Teléfono *
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={customerData.phone}
                                onChange={handleInputChange}
                                placeholder="11-1234-5678"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">Dirección de entrega</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Dirección *
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={customerData.address}
                                    onChange={handleInputChange}
                                    placeholder="Calle y número"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ciudad *
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={customerData.city}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Código Postal *
                                    </label>
                                    <input
                                        type="text"
                                        name="zipCode"
                                        value={customerData.zipCode}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resumen del pedido */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">Resumen del pedido</h2>

                        <div className="space-y-4">
                            {store.cart.map((item) => (
                                <div key={item.id} className="flex items-center justify-between py-2 border-b">
                                    <div className="flex items-center space-x-3">
                                        <img
                                            src={item.image_url || '/placeholder-product.jpg'}
                                            alt={item.name}
                                            className="w-12 h-12 object-cover rounded"
                                        />
                                        <div>
                                            <p className="font-medium text-sm">{item.name}</p>
                                            <p className="text-gray-600 text-sm">Cantidad: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <p className="font-semibold">${(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>

                        <div className="border-t pt-4 mt-4 space-y-2">
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>${subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Envío:</span>
                                <span className="text-green-600">Gratis</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t pt-2">
                                <span>Total:</span>
                                <span>${total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Botón de pago */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        {/* Método de pago */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4">Método de pago</h3>
                            <div className="border border-gray-200 rounded-lg p-4">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={paymentMethod === 'mercadopago'}
                                        onChange={(e) => setPaymentMethod(e.target.checked ? 'mercadopago' : '')}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <div className="ml-3 flex items-center">
                                        <img
                                            src="https://logodownload.org/wp-content/uploads/2018/03/mercadopago-logo-0.png"
                                            alt="MercadoPago"
                                            className="h-8 w-auto mr-3"
                                        />
                                        <div>
                                            <span className="font-medium text-gray-900">Pagar con MercadoPago</span>
                                            <p className="text-sm text-gray-500">Tarjetas de crédito, débito y efectivo</p>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {!preferenceId ? (
                            <button
                                onClick={createPreference}
                                disabled={!isFormValid() || loading}
                                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${isFormValid() && !loading
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                {loading ? 'Procesando...' : 'Continuar al pago'}
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 text-center">
                                    Haz clic en "Pagar" para continuar con Mercado Pago
                                </p>
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <Wallet
                                        initialization={{
                                            preferenceId: preferenceId,
                                            redirectMode: 'self'
                                        }}
                                        customization={{
                                            texts: {
                                                valueProp: 'smart_option'
                                            }
                                        }}
                                        onReady={() => console.log('Wallet ready')}
                                        onError={(error) => console.error('Wallet error:', error)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Checkout