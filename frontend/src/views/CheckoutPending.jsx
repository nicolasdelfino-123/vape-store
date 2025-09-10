// src/views/CheckoutPending.jsx
import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Clock } from 'lucide-react'

const CheckoutPending = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const paymentId = searchParams.get('payment_id')
    const status = searchParams.get('status')

    return (
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
                <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Pago pendiente
                </h1>

                <p className="text-gray-600 mb-6">
                    Tu pago está siendo procesado. Te notificaremos cuando se complete el proceso.
                </p>

                {paymentId && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-600">
                            <strong>ID de pago:</strong> {paymentId}
                        </p>
                        <p className="text-sm text-gray-600">
                            <strong>Estado:</strong> {status}
                        </p>
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
                        Continuar comprando
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CheckoutPending
