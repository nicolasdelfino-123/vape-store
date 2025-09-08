import { useState, useContext, useEffect } from "react";
import { Context } from "../js/store/appContext";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function SetupPassword() {
    const { actions } = useContext(Context);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const [form, setForm] = useState({
        name: "",
        password: "",
        confirmPassword: ""
    });

    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            navigate('/login');
        }
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (form.password !== form.confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }
        
        setLoading(true);
        setError("");
        
        const result = await actions.setupPassword(token, form.password, form.name);
        
        if (result.success) {
            alert("¡Contraseña establecida correctamente! Ya podés iniciar sesión.");
            navigate('/login');
        } else {
            setError(result.error || "Error al establecer contraseña");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Establecer Contraseña</h2>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre completo *
                        </label>
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm({...form, name: e.target.value})}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña *
                        </label>
                        <input
                            type="password"
                            required
                            value={form.password}
                            onChange={(e) => setForm({...form, password: e.target.value})}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirmar contraseña *
                        </label>
                        <input
                            type="password"
                            required
                            value={form.confirmPassword}
                            onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-purple-600 text-white py-2 px-4 rounded font-medium hover:bg-purple-700 disabled:opacity-50"
                    >
                        {loading ? "Estableciendo..." : "Establecer Contraseña"}
                    </button>
                </form>
            </div>
        </div>
    );
}