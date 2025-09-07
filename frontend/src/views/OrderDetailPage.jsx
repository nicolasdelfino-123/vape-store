import { useContext, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Context } from '../js/store/appContext.jsx';

const moneyAR = (n) => Number(n || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS" });

export default function OrderDetailPage() {
    const { store, actions } = useContext(Context);
    const { orderId } = useParams();

    useEffect(() => { if (!store.orders?.length) actions.fetchOrders(); }, []);

    const order = useMemo(
        () => store.orders.find((p) => String(p.id) === String(orderId)),
        [store.orders, orderId]
    );

    if (!order) return <div className="p-6">Cargando pedido…</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Pedido #{order.id}</h3>
                <Link to="/cuenta/pedidos" className="text-sm text-purple-600 hover:underline">← Volver a pedidos</Link>
            </div>
            <div className="text-sm text-gray-600">Estado: {order.status}</div>

            <div className="border rounded-xl">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="border-b">
                            <tr>
                                <th className="text-left py-2 px-4">Producto</th>
                                <th className="text-left py-2 px-4">Cantidad</th>
                                <th className="text-left py-2 px-4">Precio</th>
                                <th className="text-left py-2 px-4">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.order_items?.map((it) => (
                                <tr key={it.id} className="border-b last:border-0">
                                    <td className="py-2 px-4">{it.product_name || `#${it.product_id}`}</td>
                                    <td className="py-2 px-4">{it.quantity}</td>
                                    <td className="py-2 px-4">{moneyAR(it.price)}</td>
                                    <td className="py-2 px-4">{moneyAR((it.quantity || 0) * (it.price || 0))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end p-4 font-semibold">
                    Total: {moneyAR(order.total_amount)}
                </div>
            </div>
        </div>
    );
}
