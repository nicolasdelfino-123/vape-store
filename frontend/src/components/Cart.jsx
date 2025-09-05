import { useContext } from "react"
import { Context } from "../js/store/appContext.jsx"
import { useNavigate } from "react-router-dom"

export default function Cart() {
  const { store, actions } = useContext(Context)
  const navigate = useNavigate()

  const total = store.cart?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Carrito de Compras</h1>
            <button
              onClick={() => navigate(-1)}
              className="text-purple-600 hover:text-purple-700"
            >
              ← Volver
            </button>
          </div>

          {/* Cart Items */}
          <div className="space-y-4 mb-6">
            {!store.cart || store.cart.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <p className="text-lg">Tu carrito está vacío</p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Ir a comprar
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {store.cart.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
                    <img
                      src={item.image_url || "/placeholder-product.jpg"}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                    />

                    <div className="flex-1">
                      <h4 className="font-medium text-lg">{item.name}</h4>
                      <p className="text-purple-600 font-semibold text-lg">${item.price?.toLocaleString("es-AR")}</p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => actions.updateCartQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="font-medium min-w-[30px] text-center">{item.quantity}</span>
                      <button
                        onClick={() => actions.updateCartQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-lg">${(item.price * item.quantity).toLocaleString("es-AR")}</p>
                      <button
                        onClick={() => actions.removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 mt-2"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {store.cart && store.cart.length > 0 && (
            <div className="border-t pt-6 space-y-4">
              <div className="flex justify-between items-center text-xl">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-purple-600">${total.toLocaleString("es-AR")}</span>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => alert('Funcionalidad de checkout en desarrollo')}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  Completar Compra
                </button>

                <button
                  onClick={() => {
                    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
                      actions.clearCart()
                    }
                  }}
                  className="px-6 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Vaciar Carrito
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
