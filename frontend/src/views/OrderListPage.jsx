import { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { Context } from '../js/store/appContext.jsx';

const moneyAR = (n) => Number(n || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
const dateAR = (iso) => new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

export default function OrderListPage() {
    const { store, actions } = useContext(Context);

    useEffect(() => { actions.fetchOrders(); }, []);

    if (store.loading) return <div className="p-6">Cargando pedidos…</div>;
    if (!store.orders?.length) return <div className="p-6">No hay pedidos aún.</div>;

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead className="text-left border-b">
                    <tr className="text-gray-700">
                        <th className="py-3 pr-4">PEDIDO</th>
                        <th className="py-3 pr-4">FECHA</th>
                        <th className="py-3 pr-4">ESTADO</th>
                        <th className="py-3 pr-4">TOTAL</th>
                        <th className="py-3 pr-2 text-right">ACCIONES</th>
                    </tr>
                </thead>
                <tbody>
                    {store.orders.map((o) => (
                        <tr key={o.id} className="border-b last:border-0">
                            <td className="py-3 pr-4">
                                <Link className="text-gray-900 font-semibold hover:underline" to={`/cuenta/pedidos/${o.id}`}>#{o.id}</Link>
                            </td>
                            <td className="py-3 pr-4">{dateAR(o.created_at || o.updated_at)}</td>
                            <td className="py-3 pr-4">{o.status}</td>
                            <td className="py-3 pr-4">
                                <span className="font-semibold text-green-600">{moneyAR(o.total_amount)}</span>
                                <span className="text-gray-500"> para {o.order_items?.length || 0} artículos</span>
                            </td>
                            <td className="py-3 pr-2 text-right">
                                <Link to={`/cuenta/pedidos/${o.id}`} className="inline-block px-3 py-1 bg-lime-600 hover:bg-lime-700 text-white rounded-md">VER</Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
