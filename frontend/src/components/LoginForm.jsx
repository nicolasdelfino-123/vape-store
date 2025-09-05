import React, { useState, useContext } from "react";
import { Context } from "../js/store/appContext";



const LoginForm = () => {
  const { actions } = useContext(Context);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await actions.login(email, password);

    if (result.success) {
      setMensaje("Inicio de sesión exitoso ✅");
      setError(null);
    } else {
      setError(result.error || "Ocurrió un error al iniciar sesión.");
      setMensaje(null);
    }
  };

  return (
    <div className="flex justify-center items-center w-full min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 bg-opacity-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white bg-opacity-90 p-8 rounded-2xl  shadow-lg w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Iniciar sesión</h2>

        {/* Cartel de éxito */}
        {mensaje && (
          <div className="mb-4 p-3 rounded bg-green-100 text-green-800 text-sm">
            {mensaje}
          </div>
        )}

        {/* Cartel de error */}
        {error && (
          <div className="mb-4 p-3 rounded bg-red-100 text-red-800 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 font-medium mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-400"
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block text-gray-700 font-medium mb-1">
            Contraseña
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-400"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200"
        >
          Iniciar sesión
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
