import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function LoginAdmin() {
    const [user, setUser] = useState("")
    const [pass, setPass] = useState("")
    const navigate = useNavigate()

    const handleLogin = (e) => {
        e.preventDefault()
        if (user === "admin" && pass === "admin") {
            localStorage.setItem("admin_token", "ok")
            navigate("/admin/products")
        } else {
            alert("Credenciales inválidas")
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <form
                onSubmit={handleLogin}
                className="bg-white p-6 rounded-lg shadow-md w-80 space-y-4"
            >
                <h1 className="text-lg font-semibold text-center">Login Admin</h1>
                <input
                    type="text"
                    placeholder="Usuario"
                    className="w-full border rounded px-3 py-2"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Contraseña"
                    className="w-full border rounded px-3 py-2"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                />
                <button
                    type="submit"
                    className="w-full bg-purple-600 text-white rounded px-3 py-2 hover:bg-purple-700"
                >
                    Ingresar
                </button>
            </form>
        </div>
    )
}
