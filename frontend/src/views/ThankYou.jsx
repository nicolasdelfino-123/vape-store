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
    const paymentId = q.get("payment_id") || q.get("collection_id");
    const preferenceId = q.get("preference_id");
    const externalRef = q.get("external_reference");

    // Inicial: solo recargar productos
    useEffect(() => {
        const init = async () => {
            console.log("📦 [THANKYOU] Cargando productos...");
            await actions.fetchProducts?.();
        };
        init();
    }, [actions]);

    // Lógica de pago aprobado
    useEffect(() => {
        if (!status) {
            console.log("⏭️ [THANKYOU] Sin status de pago, saltando lógica de checkout");
            return;
        }

        const handlePaymentSuccess = async () => {
            if (status !== "approved") return;

            console.log("✅ Pago aprobado - procesando...");
            console.log("💳 Payment ID:", paymentId);

            // 1) Auto-login
            if (paymentId) {
                const maxRetries = 5;
                const delayMs = 1500;
                let ok = false;

                for (let i = 0; i < maxRetries && !ok; i++) {
                    try {
                        console.log(`🔐 Auto-login intento ${i + 1}/${maxRetries}`);
                        const response = await fetch(
                            `${import.meta.env.VITE_BACKEND_URL}/api/mercadopago/auto-login/${paymentId}`,
                            { method: "POST" }
                        );

                        if (response.ok) {
                            const data = await response.json();
                            localStorage.setItem("token", data.token);
                            console.log("✅ Auto-login exitoso");
                            ok = true;

                            if (actions.hydrateSession) {
                                await actions.hydrateSession();
                            }
                        } else {
                            console.log("⚠️ Auto-login falló, reintentando...");
                            await new Promise(r => setTimeout(r, delayMs));
                        }
                    } catch (err) {
                        console.error("❌ Error en auto-login:", err);
                        await new Promise(r => setTimeout(r, delayMs));
                    }
                }
            }

            // 2) Vaciar carrito
            console.log("🧹 [THANKYOU] Limpiando carrito...");
            actions.clearCart?.();
            console.log("🟢 [THANKYOU] Después de clearCart:");
            console.log("   - localStorage cart:", localStorage.getItem("cart"));

            // 3) Recargar órdenes
            if (actions.fetchOrders) {
                await actions.fetchOrders();
            }

            console.log("✅ Proceso completado");
        };

        handlePaymentSuccess();
    }, [status, paymentId, actions]);

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
                            El pedido se está procesando. En segundos estará disponible en "Mis pedidos".
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
