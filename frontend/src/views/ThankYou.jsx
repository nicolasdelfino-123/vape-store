// src/pages/ThankYou.jsx
import { useEffect, useContext } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Context } from "../js/store/appContext.jsx";

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function ThankYou() {
    const { actions } = useContext(Context);
    const q = useQuery();
    const navigate = useNavigate();

    const status = q.get("status");
    // 🔥 MP puede enviar el ID como payment_id o collection_id
    const paymentId = q.get("payment_id") || q.get("collection_id");
    const preferenceId = q.get("preference_id");
    const externalRef = q.get("external_reference");

    useEffect(() => {
        const handlePaymentSuccess = async () => {
            if (status === "approved") {
                console.log("✅ Pago aprobado - procesando...");
                console.log("💳 Payment ID:", paymentId);

                // 1. Vaciar carrito INMEDIATAMENTE
                localStorage.removeItem("cart");
                actions.clearCart?.();

                // 2. Esperar 2 segundos para que el webhook procese
                await new Promise(resolve => setTimeout(resolve, 2000));

                // 3. Intentar auto-login si hay payment_id
                if (paymentId) {
                    try {
                        console.log(`🔐 Intentando auto-login con payment_id: ${paymentId}`);

                        const response = await fetch(
                            `${import.meta.env.VITE_BACKEND_URL}/api/mercadopago/auto-login/${paymentId}`,
                            { method: 'POST' }
                        );

                        if (response.ok) {
                            const data = await response.json();
                            localStorage.setItem("token", data.token);
                            console.log("✅ Auto-login exitoso");

                            // Hidratar sesión
                            if (actions.hydrateSession) {
                                await actions.hydrateSession();
                            }
                        } else {
                            const error = await response.json();
                            console.log("⚠️ Auto-login falló:", error);
                        }
                    } catch (error) {
                        console.error("❌ Error en auto-login:", error);
                    }
                }

                // 4. Recargar órdenes
                if (actions.fetchOrders) {
                    await actions.fetchOrders();
                }

                console.log("✅ Proceso completado");
            }
        };

        handlePaymentSuccess();
    }, [status, paymentId]);

    return (
        <div className="max-w-2xl mx-auto px-4 py-14 text-center">
            {status === "approved" ? (
                <>
                    <div className="text-5xl mb-4">✅</div>
                    <h1 className="text-3xl font-bold mb-2">¡Gracias por tu compra!</h1>
                    <p className="text-gray-600 mb-6">
                        Tu pago fue acreditado correctamente.
                    </p>
                    <div className="bg-white border rounded-xl p-5 text-left mb-8">
                        <h2 className="font-semibold mb-2">Resumen</h2>
                        <ul className="text-sm text-gray-700 space-y-1">
                            <li><span className="font-medium">Estado:</span> {status}</li>
                            {paymentId && <li><span className="font-medium">ID de pago:</span> {paymentId}</li>}
                            {preferenceId && <li><span className="font-medium">Preferencia:</span> {preferenceId}</li>}
                            {externalRef && <li><span className="font-medium">Referencia:</span> {externalRef}</li>}
                        </ul>
                        <p className="text-xs text-gray-500 mt-3">
                            El pedido se está procesando. En unos segundos estará disponible en "Mis pedidos".
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            to="/cuenta"
                            className="px-5 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                        >
                            Ver mis pedidos
                        </Link>
                        <button
                            onClick={() => navigate("/inicio")}
                            className="px-5 py-3 rounded-lg border border-gray-300 hover:bg-gray-50"
                        >
                            Seguir comprando
                        </button>
                    </div>
                </>
            ) : status === "pending" ? (
                <>
                    <div className="text-5xl mb-4">⏳</div>
                    <h1 className="text-3xl font-bold mb-2">Pago pendiente</h1>
                    <p className="text-gray-600 mb-6">
                        Cuando se acredite, vas a ver el pedido en tu cuenta.
                    </p>
                    <Link to="/inicio" className="px-5 py-3 rounded-lg bg-gray-900 text-white">
                        Volver a la tienda
                    </Link>
                </>
            ) : (
                <>
                    <div className="text-5xl mb-4">❌</div>
                    <h1 className="text-3xl font-bold mb-2">Pago fallido</h1>
                    <p className="text-gray-600 mb-6">
                        Algo salió mal. Podés intentar nuevamente.
                    </p>
                    <Link to="/checkout" className="px-5 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700">
                        Volver al checkout
                    </Link>
                </>
            )}
        </div>
    );
}