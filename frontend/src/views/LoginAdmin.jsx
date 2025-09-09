import { useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { Context } from "../js/store/appContext"

export default function LoginAdmin() {
    const [email, setEmail] = useState("admin@vapestore.com")
    const [password, setPassword] = useState("admin123")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const { actions } = useContext(Context)
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const result = await actions.adminLogin(email, password)

        if (result.success && result.isAdmin) {
            navigate("/admin/products")
        } else {
            setError(result.error || "Credenciales inválidas o sin permisos de admin")
        }
        setLoading(false)
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <form
                onSubmit={handleLogin}
                className="bg-white p-6 rounded-lg shadow-md w-80 space-y-4"
            >
                <h1 className="text-lg font-semibold text-center">Login Admin</h1>

                {error && (
                    <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
                        {error}
                    </div>
                )}

                <input
                    type="email"
                    placeholder="Email"
                    className="w-full border rounded px-3 py-2"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Contraseña"
                    className="w-full border rounded px-3 py-2"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-purple-600 text-white rounded px-3 py-2 hover:bg-purple-700 disabled:opacity-50"
                >
                    {loading ? "Ingresando..." : "Ingresar"}
                </button>

                <p className="text-xs text-gray-500 text-center">
                    Usa: admin@vapestore.com / admin123
                </p>
            </form>
        </div>
    )
}