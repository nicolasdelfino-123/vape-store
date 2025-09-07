import { Link, useNavigate } from "react-router-dom";

function AccessCard({ to, title, icon }) {
    return (
        <Link to={to} className="border rounded-xl p-6 hover:shadow transition block">
            <div className="text-3xl">{icon}</div>
            <div className="mt-3 font-semibold">{title}</div>
        </Link>
    );
}

export default function Dashboard() {
    const navigate = useNavigate();
    return (
        <div>
            <p className="mb-6 text-sm text-gray-600">
                Desde el escritorio podés ver tus pedidos, gestionar direcciones y editar tus datos.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <AccessCard to="/cuenta/pedidos" title="Pedidos" icon="📄" />
                <AccessCard to="/cuenta/direcciones" title="Direcciones" icon="📍" />
                <AccessCard to="/cuenta/detalles" title="Detalles de la cuenta" icon="👤" />
                <button onClick={() => navigate("/cuenta/cerrar")}
                    className="border rounded-xl p-6 hover:shadow transition text-left">🚪 Cerrar sesión</button>
            </div>
        </div>
    );
}
