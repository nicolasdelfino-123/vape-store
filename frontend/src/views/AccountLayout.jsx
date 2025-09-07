import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useContext } from "react";
import { Context } from '../js/store/appContext.jsx';

const linkStyle = ({ isActive }) =>
    "block px-4 py-2 rounded-md text-sm " +
    (isActive ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-50");

export default function AccountLayout() {
    const { store } = useContext(Context);
    if (!store.user) return <Navigate to="/login" replace />;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <aside className="lg:col-span-3">
                    <h2 className="text-lg font-semibold mb-4">MI CUENTA</h2>
                    <nav className="space-y-1">
                        <NavLink end to="/cuenta" className={linkStyle}>Escritorio</NavLink>
                        <NavLink to="/cuenta/pedidos" className={linkStyle}>Pedidos</NavLink>
                        <NavLink to="/cuenta/direcciones" className={linkStyle}>Direcciones</NavLink>
                        <NavLink to="/cuenta/detalles" className={linkStyle}>Detalles de la cuenta</NavLink>
                        <NavLink to="/cuenta/cerrar" className={linkStyle}>Cerrar sesión</NavLink>
                    </nav>
                </aside>

                <main className="lg:col-span-9">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
