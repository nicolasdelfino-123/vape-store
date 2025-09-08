import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Context } from "../js/store/appContext";

export default function Logout() {
    const { actions } = useContext(Context);
    const navigate = useNavigate();

    useEffect(() => {
        // Cerrar sesión
        actions.logoutUser();

        // Mostrar mensaje breve y redirigir
        setTimeout(() => {
            navigate("/");
        }, 1500);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Sesión cerrada
                </h2>
                <p className="text-gray-600">
                    Redirigiendo al inicio...
                </p>
            </div>
        </div>
    );
}
