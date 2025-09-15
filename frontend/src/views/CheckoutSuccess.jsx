// src/views/CheckoutSuccess.jsx
import React, { useContext, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Context } from '../js/store/appContext'
import { CheckCircle } from 'lucide-react'

const CheckoutSuccess = () => {
    const navigate = useNavigate()
    const { actions } = useContext(Context)
    const [searchParams] = useSearchParams()

    const paymentId = searchParams.get('payment_id')
    const status = searchParams.get('status')
    const merchantOrder = searchParams.get('merchant_order_id')

    useEffect(() => {
        // Limpiar carrito después del pago exitoso
        if (status === 'approved') {
            actions.clearCart()
            actions.showToast('¡Pago realizado con éxito!', 'success')
        }
    }, [status, actions])
    console.log('🔄 ProductDetail RENDER - ID:', id);
    return (
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    ¡Pago exitoso!
                </h1>

                <p className="text-gray-600 mb-6">
                    Tu pedido ha sido procesado correctamente. Recibirás un email con los detalles de tu compra.
                </p>

                {paymentId && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-600">
                            <strong>ID de pago:</strong> {paymentId}
                        </p>
                        {merchantOrder && (
                            <p className="text-sm text-gray-600">
                                <strong>Orden:</strong> {merchantOrder}
                            </p>
                        )}
                    </div>
                )}

                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/cuenta/pedidos')}
                        className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Ver mis pedidos
                    </button>

                    <button
                        onClick={() => navigate('/inicio')}
                        className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Seguir comprando
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CheckoutSuccess
