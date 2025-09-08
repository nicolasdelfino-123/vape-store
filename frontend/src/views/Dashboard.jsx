import { useContext, useEffect, useState } from "react";
import { Context } from "../js/store/appContext.jsx";
import { Link } from "react-router-dom";

function AccessCard({ onClick, title, icon, isActive }) {
    return (
        <button
            onClick={onClick}
            className={[
                "border rounded-xl p-6 text-left w-full transition",
                "hover:shadow",
                isActive ? "border-purple-500 bg-purple-50" : "border-gray-200",
            ].join(" ")}
        >
            <div className="text-3xl">{icon}</div>
            <div className="mt-3 font-semibold">{title}</div>
        </button>
    );
}

const moneyAR = (n) => Number(n || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const dateAR = (iso) => new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

export default function Dashboard() {
    const { store, actions } = useContext(Context);
    const [activeSection, setActiveSection] = useState("dashboard");

    // Cargar datos al inicio
    useEffect(() => {
        if (actions.fetchOrders) actions.fetchOrders();
        if (actions.fetchUserAddress) actions.fetchUserAddress();
    }, []);

    // Datos de ejemplo como tienes actualmente
    const sampleOrders = [
        {
            id: 28816,
            created_at: "2025-04-02T10:00:00Z",
            status: "Completado",
            total_amount: 70500,
            order_items: [
                { product_name: "Sales EVIL 25mg 30ml - LA MONJA ICE", quantity: 1, price: 11000 },
                { product_name: "Sales EVIL 25mg 30ml - BABAOOK ICE", quantity: 1, price: 11000 },
                { product_name: "Descartable Ignite V250 2500 Puffs - PINEAPPLE MANGO", quantity: 1, price: 35000 },
                { product_name: "SPOK LP1 Resistencia 0.8 Ohm Mesh MTL", quantity: 2, price: 11000 },
            ],
        }
    ];

    const recentOrders = store.orders?.length > 0 ? store.orders.slice(0, 3) : sampleOrders;

    // Si está en dashboard, mostrar la vista principal
    if (activeSection === "dashboard") {
        return (
            <div>
                <p className="mb-6 text-sm text-gray-600">
                    Desde el escritorio podés ver tus pedidos recientes y acceder rápidamente a tu información.
                </p>

                {/* Cards de acceso */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                    <AccessCard
                        onClick={() => setActiveSection("pedidos")}
                        title="Pedidos"
                        icon="📄"
                        isActive={false}
                    />
                    <AccessCard
                        onClick={() => setActiveSection("direcciones")}
                        title="Direcciones"
                        icon="📍"
                        isActive={false}
                    />
                    <AccessCard
                        onClick={() => setActiveSection("detalles")}
                        title="Detalles de la cuenta"
                        icon="👤"
                        isActive={false}
                    />
                </div>

                {/* Pedidos recientes */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Pedidos Recientes</h2>
                        <Link
                            to="/cuenta/pedidos"
                            className="text-sm text-purple-600 hover:text-purple-700"
                        >
                            Ver todos
                        </Link>
                    </div>

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
                                {recentOrders.slice(0, 3).map((o) => (
                                    <tr key={o.id} className="border-b last:border-0">
                                        <td className="py-3 pr-4">
                                            <span className="text-gray-900 font-semibold">#{o.id}</span>
                                        </td>
                                        <td className="py-3 pr-4">{dateAR(o.created_at)}</td>
                                        <td className="py-3 pr-4">{o.status}</td>
                                        <td className="py-3 pr-4">
                                            <span className="font-semibold text-green-600">{moneyAR(o.total_amount)}</span>
                                            <span className="text-gray-500"> para {o.order_items?.length || 0} artículos</span>
                                        </td>
                                        <td className="py-3 pr-2 text-right">
                                            <Link
                                                to={`/cuenta/pedidos/${o.id}`}
                                                className="inline-block px-3 py-1 bg-lime-600 hover:bg-lime-700 text-white rounded-md"
                                            >
                                                VER
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Botón cerrar sesión */}
                <button
                    onClick={() => {
                        actions.logoutUser();
                        window.location.href = "/login";
                    }}
                    className="border rounded-xl p-6 hover:shadow transition text-left border-red-200 hover:border-red-300 w-full sm:w-auto"
                >
                    <div className="text-3xl">🚪</div>
                    <div className="mt-3 font-semibold">Cerrar sesión</div>
                </button>
            </div>
        );
    }

    // Si está en otra sección, mostrar con botón volver
    return (
        <div>
            <button
                onClick={() => setActiveSection("dashboard")}
                className="mb-4 text-purple-600 hover:text-purple-800 flex items-center"
            >
                ← Volver al escritorio
            </button>

            {activeSection === "pedidos" && (
                <div>
                    <h2 className="text-2xl font-bold mb-4">Mis pedidos</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                            <thead className="bg-gray-50 text-left text-sm">
                                <tr>
                                    <th className="px-4 py-3 border-b">Pedido</th>
                                    <th className="px-4 py-3 border-b">Fecha</th>
                                    <th className="px-4 py-3 border-b">Estado</th>
                                    <th className="px-4 py-3 border-b">Total</th>
                                    <th className="px-4 py-3 border-b">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {recentOrders.map((o) => (
                                    <tr key={o.id} className="odd:bg-white even:bg-gray-50">
                                        <td className="px-4 py-3 border-b">#{o.id}</td>
                                        <td className="px-4 py-3 border-b">{dateAR(o.created_at)}</td>
                                        <td className="px-4 py-3 border-b capitalize">{o.status}</td>
                                        <td className="px-4 py-3 border-b">{moneyAR(o.total_amount)}</td>
                                        <td className="px-4 py-3 border-b">
                                            <Link
                                                to={`/cuenta/pedidos/${o.id}`}
                                                className="px-3 py-1 rounded bg-lime-500 text-white hover:bg-lime-600"
                                            >
                                                Ver
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}