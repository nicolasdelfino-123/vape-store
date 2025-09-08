import { useContext, useEffect, useMemo, useState } from "react";
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

function SectionTitle({ children }) {
    return <h2 className="text-2xl font-bold mb-4">{children}</h2>;
}

function Note({ children }) {
    return <p className="text-xs text-gray-500 mt-2">{children}</p>;
}

export default function Dashboard() {
    const { store, actions } = useContext(Context);
    const [activeSection, setActiveSection] = useState("dashboard");

    // -------- Direcciones --------
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [isEditingBilling, setIsEditingBilling] = useState(false);
    const [isEditingShipping, setIsEditingShipping] = useState(false);

    // -------- Detalles de cuenta --------
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [currentPwd, setCurrentPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");

    // Prefill nombres desde store.user.name
    const prefillNamesFromStore = () => {
        const full = (store.user?.name || "").trim();
        if (!full) {
            setFirstName("");
            setLastName("");
            return;
        }
        const [first, ...rest] = full.split(" ");
        setFirstName(first || "");
        setLastName(rest.join(" ") || "");
    };

    // Actualizar nombres cuando el usuario cambie en store
    useEffect(() => {
        prefillNamesFromStore();
    }, [store.user?.name]);

    // Cargar datos según pestaña
    useEffect(() => {
        if (activeSection === "pedidos") {
            actions.fetchOrders && actions.fetchOrders();
            return;
        }
        if (activeSection === "direcciones") {
            actions.fetchUserAddress?.().then((data) => {
                if (data) {
                    setAddress(data.address || "");
                    setPhone(data.phone || "");
                }
            });
            return;
        }
        if (activeSection === "detalles") {
            prefillNamesFromStore();
            return;
        }
    }, [activeSection]);

    // Guardar direcciones
    const handleSaveAddress = async () => {
        const ok = await actions.updateUserAddress?.(address, phone);
        if (!ok) return alert(store.updateStatusMsg || "No se pudo guardar la dirección");
        alert("Dirección actualizada ✅");
    };

    // Guardar detalles (nombre y/o contraseña)
    const handleSaveAccount = async () => {
        const name = [firstName, lastName].filter(Boolean).join(" ").trim();
        
        // Validar contraseñas si se están cambiando
        if (newPwd && newPwd !== confirmPwd) {
            return alert("Las contraseñas nuevas no coinciden");
        }
        
        if (newPwd && !currentPwd) {
            return alert("Debes ingresar tu contraseña actual para cambiarla");
        }

        const ok = await actions.updateAccountDetails?.({
            name,
            current_password: currentPwd || undefined,
            new_password: newPwd || undefined,
            confirm_password: confirmPwd || undefined,
        });
        
        if (!ok) return alert(store.updateStatusMsg || "No se pudo actualizar");
        
        // limpiamos contraseñas si se mandaron
        setCurrentPwd("");
        setNewPwd("");
        setConfirmPwd("");
        alert("Datos actualizados ✅");
    };

    // ======= Pedidos =======
    const OrdersTable = () => {
        const orders = store.orders || [];

        // fallback hardcodeado si no hay órdenes reales
        const displayOrders =
            orders.length > 0
                ? orders
                : [
                    {
                        id: 28816,
                        created_at: "2025-04-02T10:00:00Z",
                        status: "completado",
                        total_amount: 70500,
                        order_items: [
                            { product_name: "Vape Desechable XYZ", quantity: 2, price: 15000 },
                            { product_name: "Líquido Frutal 30ml", quantity: 1, price: 5000 },
                        ],
                    },
                    {
                        id: 28817,
                        created_at: "2025-03-15T14:30:00Z",
                        status: "pendiente",
                        total_amount: 45000,
                        order_items: [
                            { product_name: "Pod Recargable Blue", quantity: 1, price: 25000 },
                            { product_name: "Resistencias Pack x5", quantity: 1, price: 20000 },
                        ],
                    },
                ];

        const currency = (n) =>
            new Intl.NumberFormat("es-AR", {
                style: "currency",
                currency: "ARS",
                maximumFractionDigits: 0,
            }).format(n || 0);

        return (
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
                        {displayOrders.map((o) => (
                            <tr key={o.id} className="odd:bg-white even:bg-gray-50">
                                <td className="px-4 py-3 border-b">#{o.id}</td>
                                <td className="px-4 py-3 border-b">
                                    {new Date(o.created_at).toLocaleDateString("es-AR", {
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </td>
                                <td className="px-4 py-3 border-b capitalize">{o.status}</td>
                                <td className="px-4 py-3 border-b">{currency(o.total_amount)}</td>
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
                {orders.length === 0 && (
                    <Note>(Vista de ejemplo: cuando tengas órdenes reales, aparecerán aquí.)</Note>
                )}
            </div>
        );
    };

    // ======= Direcciones =======
    const AddressesSection = () => (
        <div>
            <SectionTitle>Direcciones</SectionTitle>
            <Note>
                Por ahora tu API expone una sola dirección (<code>address</code>) y teléfono; la usamos para
                facturación y envío.
            </Note>

            <div className="grid sm:grid-cols-2 gap-6 mt-6">
                {/* Facturación */}
                <div className="border rounded-xl p-5">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold">Dirección de facturación</h3>
                        <button
                            onClick={() => setIsEditingBilling(!isEditingBilling)}
                            className="text-sm px-3 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200"
                        >
                            {isEditingBilling ? "Cancelar" : "Editar"}
                        </button>
                    </div>
                    {isEditingBilling ? (
                        <>
                            <textarea
                                rows={4}
                                className="w-full border rounded-md p-2"
                                placeholder="Calle 123, Piso, Ciudad, Provincia"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                            <div className="mt-3">
                                <label className="block text-sm mb-1">Teléfono</label>
                                <input
                                    className="w-full border rounded-md p-2"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+54 9 ..."
                                />
                            </div>
                        </>
                    ) : (
                        <div className="text-gray-600">
                            <p className="mb-2">{address || "No hay dirección configurada"}</p>
                            <p className="text-sm">📞 {phone || "No hay teléfono configurado"}</p>
                        </div>
                    )}
                </div>

                {/* Envío */}
                <div className="border rounded-xl p-5">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold">Dirección de envío</h3>
                        <button
                            onClick={() => setIsEditingShipping(!isEditingShipping)}
                            className="text-sm px-3 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200"
                        >
                            {isEditingShipping ? "Cancelar" : "Editar"}
                        </button>
                    </div>
                    <Note>Usamos la misma dirección que facturación.</Note>
                    {isEditingShipping ? (
                        <>
                            <textarea
                                rows={4}
                                className="w-full border rounded-md p-2 mt-2"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                            <div className="mt-3">
                                <label className="block text-sm mb-1">Teléfono</label>
                                <input
                                    className="w-full border rounded-md p-2"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="text-gray-600 mt-2">
                            <p className="mb-2">{address || "No hay dirección configurada"}</p>
                            <p className="text-sm">📞 {phone || "No hay teléfono configurado"}</p>
                        </div>
                    )}
                </div>
            </div>

            {(isEditingBilling || isEditingShipping) && (
                <div className="mt-6">
                    <button
                        onClick={() => {
                            handleSaveAddress();
                            setIsEditingBilling(false);
                            setIsEditingShipping(false);
                        }}
                        className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700"
                    >
                        Guardar cambios
                    </button>
                </div>
            )}
        </div>
    );

    // ======= Detalles de la cuenta =======
    const AccountDetailsSection = () => (
        <div>
            <SectionTitle>Detalles de la cuenta</SectionTitle>

            <div className="grid sm:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm mb-1">Nombre</label>
                    <input
                        className="w-full border rounded-md p-2"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Nombre"
                    />
                </div>
                <div>
                    <label className="block text-sm mb-1">Apellido</label>
                    <input
                        className="w-full border rounded-md p-2"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Apellido"
                    />
                </div>
            </div>

            <Note>Se guarda como un solo campo <code>name</code> en el backend.</Note>

            <div className="mt-6 grid sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm mb-1">Contraseña actual</label>
                    <input
                        type="password"
                        className="w-full border rounded-md p-2"
                        value={currentPwd}
                        onChange={(e) => setCurrentPwd(e.target.value)}
                        placeholder="••••••••"
                    />
                </div>
                <div>
                    <label className="block text-sm mb-1">Nueva contraseña</label>
                    <input
                        type="password"
                        className="w-full border rounded-md p-2"
                        value={newPwd}
                        onChange={(e) => setNewPwd(e.target.value)}
                        placeholder="••••••••"
                    />
                </div>
                <div>
                    <label className="block text-sm mb-1">Confirmar nueva</label>
                    <input
                        type="password"
                        className="w-full border rounded-md p-2"
                        value={confirmPwd}
                        onChange={(e) => setConfirmPwd(e.target.value)}
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <div className="mt-6">
                <button
                    onClick={handleSaveAccount}
                    className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700"
                >
                    Guardar cambios
                </button>
                {store.updateStatusMsg && <Note>{store.updateStatusMsg}</Note>}
            </div>
        </div>
    );

    // ======= Render maestro =======
    const Content = useMemo(() => {
        switch (activeSection) {
            case "pedidos":
                return (
                    <div>
                        <SectionTitle>Mis pedidos</SectionTitle>
                        <OrdersTable />
                    </div>
                );
            case "direcciones":
                return <AddressesSection />;
            case "detalles":
                return <AccountDetailsSection />;
            default:
                return (
                    <div>
                        <p className="mb-6 text-sm text-gray-600">
                            Desde el escritorio podés ver tus pedidos, gestionar direcciones y editar tus datos.
                        </p>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            <AccessCard
                                onClick={() => setActiveSection("pedidos")}
                                title="Pedidos"
                                icon="📄"
                                isActive={activeSection === "pedidos"}
                            />
                            <AccessCard
                                onClick={() => setActiveSection("direcciones")}
                                title="Direcciones"
                                icon="📍"
                                isActive={activeSection === "direcciones"}
                            />
                            <AccessCard
                                onClick={() => setActiveSection("detalles")}
                                title="Detalles de la cuenta"
                                icon="👤"
                                isActive={activeSection === "detalles"}
                            />
                            <button
                                onClick={() => (window.location.href = "/cuenta/cerrar")}
                                className="border rounded-xl p-6 hover:shadow transition text-left border-red-200 hover:border-red-300"
                            >
                                🚪 Cerrar sesión
                            </button>
                        </div>
                    </div>
                );
        }
    }, [
        activeSection,
        store.orders,
        store.updateStatusMsg,
        address,
        phone,
        firstName,
        lastName,
        currentPwd,
        newPwd,
        confirmPwd,
    ]);

    return (
        <div>
            {activeSection !== "dashboard" && (
                <button
                    onClick={() => setActiveSection("dashboard")}
                    className="mb-4 text-purple-600 hover:text-purple-800 flex items-center"
                >
                    ← Volver al escritorio
                </button>
            )}
            {Content}
            
            {/* Footer simple */}
            <footer className="mt-16 pt-8 border-t border-gray-200">
                <div className="text-center text-gray-500 text-sm">
                    <p>&copy; 2025 Zarpados Vapers. Todos los derechos reservados.</p>
                    <div className="mt-2 flex justify-center space-x-4">
                        <a href="/#contacto" className="hover:text-purple-600">Contacto</a>
                        <span>•</span>
                        <a href="/terms" className="hover:text-purple-600">Términos</a>
                        <span>•</span>
                        <a href="/privacy" className="hover:text-purple-600">Privacidad</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
