import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Context } from "../js/store/appContext";

export default function ResetPassword() {
    const { token } = useParams();
    const { actions } = useContext(Context);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        if (formData.password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        setLoading(true);
        setError("");

        const result = await actions.resetPassword(token, formData.password);

        if (result.success) {
            setMessage("Contraseña restablecida exitosamente. Serás redirigido al login...");
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } else {
            setError(result.error || "Error al restablecer la contraseña");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-8">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        NUEVA CONTRASEÑA
                    </h1>
                    <p className="text-gray-600 text-sm">
                        Ingresá tu nueva contraseña para restablecer el acceso a tu cuenta.
                    </p>
                </div>

                {/* Mensajes */}
                {message && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                        {error}
                    </div>
                )}

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nueva contraseña *
                        </label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirmar contraseña *
                        </label>
                        <input
                            type="password"
                            required
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white py-2 px-4 rounded font-medium hover:bg-gray-800 disabled:opacity-50"
                    >
                        {loading ? "RESTABLECIENDO..." : "RESTABLECER CONTRASEÑA"}
                    </button>
                </form>

                {/* Volver al login */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate("/login")}
                        className="text-sm text-gray-600 hover:underline"
                    >
                        ← Volver al inicio de sesión
                    </button>
                </div>
            </div>
        </div>
    );
}
