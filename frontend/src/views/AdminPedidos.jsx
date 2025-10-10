import { useEffect, useState } from "react";

const API = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "") || "";

export default function AdminPedidos() {
    const [orders, setOrders] = useState([]);
    const [selected, setSelected] = useState(null); // 🆕 Pedido seleccionado
    const token =
        localStorage.getItem("token") || localStorage.getItem("admin_token");

    const fetchOrders = async () => {
        try {
            const res = await fetch(`${API}/admin/orders`, {

                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setOrders(data || []);
        } catch (err) {
            console.error("Error fetching orders:", err);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const updateStatus = async (id, status, tracking_code = "") => {
        try {
            const res = await fetch(`${API}/admin/orders/${id}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status, tracking_code }),
            });
            if (!res.ok) throw new Error("No se pudo actualizar el estado");
            await fetchOrders();
            alert("Estado actualizado y email enviado al cliente");
        } catch (err) {
            console.error(err);
            alert("Error actualizando estado");
        }
    };


    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Pedidos recibidos</h1>

            {orders.length === 0 && (
                <p className="text-gray-500 text-center mt-10">No hay pedidos aún.</p>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-2 text-left">#</th>
                            <th className="p-2 text-left">Cliente</th>
                            <th className="p-2 text-left">Email</th>
                            <th className="p-2 text-left">Total</th>
                            <th className="p-2 text-left">Estado</th>
                            <th className="p-2 text-left">Fecha</th>
                            <th className="p-2 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((o) => (
                            <tr key={o.id} className="border-t hover:bg-gray-50">
                                <td className="p-2 font-semibold text-gray-700">#{o.id}</td>

                                <td className="p-2">{o.customer_first_name} {o.customer_last_name}</td>
                                <td className="p-2">{o.customer_email}</td>
                                <td className="p-2">${o.total_amount?.toLocaleString() || 0}</td>
                                <td className="p-2">
                                    <span
                                        className={`px-2 py-1 rounded text-xs ${o.status === "enviado"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-yellow-100 text-yellow-800"
                                            }`}
                                    >
                                        {o.status || "pendiente"}
                                    </span>
                                </td>
                                <td className="p-2">
                                    {new Date(o.created_at).toLocaleString("es-AR")}
                                </td>
                                <td className="p-2 flex gap-2 justify-center">
                                    <button
                                        onClick={() => setSelected(o)}
                                        className="px-3 py-1 border rounded hover:bg-gray-100"
                                    >
                                        Ver detalle
                                    </button>
                                    {o.status !== "enviado" && (
                                        <button
                                            onClick={() => updateStatus(o.id, "enviado")}
                                            className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                                        >
                                            Marcar enviado
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 🆕 Modal de detalle */}
            {selected && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg p-6 relative overflow-y-auto max-h-[90vh]">
                        <button
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                            onClick={() => setSelected(null)}
                        >
                            ✕
                        </button>

                        <h2 className="text-xl font-semibold mb-3">
                            Pedido #{selected.id} —{" "}
                            <span className="text-sm text-gray-500">
                                {new Date(selected.created_at).toLocaleString("es-AR")}
                            </span>
                        </h2>

                        <div className="mb-3">
                            <p>
                                <strong>Cliente:</strong> {selected.customer_first_name}{" "}
                                {selected.customer_last_name}
                            </p>
                            <p>
                                <strong>Email:</strong> {selected.customer_email}
                            </p>
                            {selected.customer_phone && (
                                <p>
                                    <strong>Teléfono:</strong> {selected.customer_phone}
                                </p>
                            )}
                            {selected.customer_comment && (
                                <p className="mt-2 text-sm text-gray-600">
                                    <strong>Comentario:</strong> {selected.customer_comment}
                                </p>
                            )}
                        </div>

                        <div className="border-t border-b py-3 mb-3">
                            <p>
                                <strong>Entrega/Retiro:</strong>{" "}
                                {typeof selected.shipping_address === "string"
                                    ? selected.shipping_address
                                    : selected.shipping_address?.label || "No informado"}
                            </p>
                            <p>
                                <strong>Dirección:</strong>{" "}
                                {typeof selected.shipping_address === "object"
                                    ? selected.shipping_address?.address ||
                                    selected.shipping_address?.street_name ||
                                    "No especificada"
                                    : "-"}
                            </p>
                            <p>
                                <strong>Estado:</strong>{" "}
                                <span
                                    className={`px-2 py-1 rounded text-xs ${selected.status === "enviado"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-yellow-100 text-yellow-800"
                                        }`}
                                >
                                    {selected.status || "pendiente"}
                                </span>
                            </p>
                        </div>

                        {/* Productos */}
                        <h3 className="text-lg font-medium mb-2">Productos</h3>
                        <div className="border rounded">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-2 text-left">Producto</th>
                                        <th className="p-2 text-center">Cant.</th>
                                        <th className="p-2 text-right">Precio</th>
                                        <th className="p-2 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>

                                    {(selected.order_items || selected.items || []).map((i, idx) => (

                                        <tr key={idx} className="border-t">
                                            <td className="p-2">
                                                <span className="font-medium">
                                                    {i.product_name || i.title || "Producto sin nombre"}
                                                </span>
                                                {i.selected_flavor && (
                                                    <span className="block text-xs text-gray-500">
                                                        Sabor: {i.selected_flavor}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="p-2 text-center">{i.quantity}</td>
                                            <td className="p-2 text-right">
                                                ${i.price?.toLocaleString() || 0}
                                            </td>
                                            <td className="p-2 text-right">
                                                ${(i.quantity * i.price).toLocaleString() || 0}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t font-semibold">
                                        <td colSpan="3" className="p-2 text-right">
                                            Total
                                        </td>
                                        <td className="p-2 text-right">
                                            ${selected.total_amount?.toLocaleString() || 0}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <input
                                type="text"
                                placeholder="Código de envío (opcional)"
                                value={selected.tracking_code || ""}
                                onChange={(e) =>
                                    setSelected({ ...selected, tracking_code: e.target.value })
                                }
                                className="border rounded px-3 py-2 text-sm w-1/2"
                            />
                            {selected.status !== "enviado" && (
                                <button
                                    onClick={() => updateStatus(selected.id, "enviado", selected.tracking_code)}
                                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                                >
                                    Marcar como enviado
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
