import { useState, useContext } from "react";
import { Context } from "../js/store/appContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const { actions } = useContext(Context);
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [loginForm, setLoginForm] = useState({
        email: "",
        password: "",
        remember: false
    });

    const [registerForm, setRegisterForm] = useState({
        email: ""
    });

    const [forgotPasswordForm, setForgotPasswordForm] = useState({
        email: ""
    });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await actions.login(loginForm.email, loginForm.password);

        if (result.success) {
            navigate("/cuenta");
        } else {
            setError(result.error || "Error al iniciar sesión");
        }
        setLoading(false);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await actions.sendPasswordSetupEmail(registerForm.email);

        if (result.success) {
            setMessage("Se enviará un enlace a tu dirección de correo electrónico para establecer una nueva contraseña.");
        } else {
            setError(result.error || "Error al enviar el correo");
        }
        setLoading(false);
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await actions.forgotPassword(forgotPasswordForm.email);

        if (result.success) {
            setMessage("Se ha enviado un enlace de recuperación a tu correo electrónico.");
        } else {
            setError(result.error || "Error al enviar el correo de recuperación");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Panel izquierdo - Formulario */}
            <div className="flex-1 flex items-center justify-center px-8">
                <div className="max-w-md w-full">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {isForgotPassword ? "RECUPERAR CONTRASEÑA" : (isRegister ? "REGISTRO" : "ACCEDER")}
                        </h1>
                        <p className="text-gray-600 text-sm">
                            {isForgotPassword
                                ? "Ingresá tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña."
                                : (isRegister
                                    ? "Se enviará un enlace a tu dirección de correo electrónico para establecer una nueva contraseña."
                                    : ""
                                )
                            }
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

                    {/* Formulario Login */}
                    {!isRegister && !isForgotPassword && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre de usuario o correo electrónico *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={loginForm.email}
                                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Contraseña *
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={loginForm.password}
                                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center text-sm">
                                    <input
                                        type="checkbox"
                                        checked={loginForm.remember}
                                        onChange={(e) => setLoginForm({ ...loginForm, remember: e.target.checked })}
                                        className="mr-2"
                                    />
                                    Recordarme
                                </label>
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setIsForgotPassword(true);
                                        setError("");
                                        setMessage("");
                                    }}
                                    className="text-sm text-gray-600 hover:underline"
                                >
                                    ¿Perdiste tu contraseña?
                                </a>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-black text-white py-2 px-4 rounded font-medium hover:bg-gray-800 disabled:opacity-50"
                            >
                                {loading ? "ACCEDIENDO..." : "ACCEDER"}
                            </button>
                        </form>
                    )}

                    {/* Formulario Registro */}
                    {isRegister && !isForgotPassword && (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Correo electrónico *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={registerForm.email}
                                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-black text-white py-2 px-4 rounded font-medium hover:bg-gray-800 disabled:opacity-50"
                            >
                                {loading ? "REGISTRANDO..." : "REGISTRARSE"}
                            </button>
                        </form>
                    )}

                    {/* Formulario Recuperar Contraseña */}
                    {isForgotPassword && (
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Correo electrónico *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={forgotPasswordForm.email}
                                    onChange={(e) => setForgotPasswordForm({ ...forgotPasswordForm, email: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-black text-white py-2 px-4 rounded font-medium hover:bg-gray-800 disabled:opacity-50"
                            >
                                {loading ? "ENVIANDO..." : "ENVIAR ENLACE DE RECUPERACIÓN"}
                            </button>
                        </form>
                    )}

                    {/* Toggle */}
                    <div className="mt-6 text-center">
                        {isForgotPassword ? (
                            <button
                                onClick={() => {
                                    setIsForgotPassword(false);
                                    setError("");
                                    setMessage("");
                                }}
                                className="text-sm text-gray-600 hover:underline"
                            >
                                ← Volver al inicio de sesión
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    setIsRegister(!isRegister);
                                    setError("");
                                    setMessage("");
                                }}
                                className="text-sm text-gray-600 hover:underline"
                            >
                                {isRegister
                                    ? "¿Ya tenés cuenta? Iniciar sesión"
                                    : "¿No tenés cuenta? Registrarse"
                                }
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Panel derecho - Imagen */}
            <div className="hidden lg:block lg:w-1/2 relative">
                <img
                    src="/hero-bg.png"
                    alt="Vapeadores"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-purple-900 bg-opacity-60 flex items-center justify-center">
                    <div className="text-center text-white px-8">
                        <h2 className="text-4xl font-bold mb-4">Bienvenido a Zarpados Vapers</h2>
                        <p className="text-lg">
                            Los mejores productos de vapeo con envíos a todo el país
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}