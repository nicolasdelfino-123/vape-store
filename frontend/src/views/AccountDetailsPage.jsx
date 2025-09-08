import React, { useState, useContext, useEffect } from 'react';
import { Context } from '../js/store/appContext';

const AccountDetailsPage = () => {
    const { store, actions } = useContext(Context);
    const [formData, setFormData] = useState({
        name: '',
        email: ''
    });

    useEffect(() => {
        if (store.user) {
            setFormData({
                name: store.user.name || '',
                email: store.user.email || ''
            });
        }
    }, [store.user]);

    // Limpiar mensaje después de 3 segundos
    useEffect(() => {
        if (store.updateStatusMsg) {
            const timer = setTimeout(() => {
                actions.clearUpdateStatusMsg();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [store.updateStatusMsg, actions]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log("Formulario enviado con datos:", formData);

        if (!formData.name.trim()) {
            console.log("Nombre vacío, no se enviará");
            return;
        }

        console.log("Llamando a updateAccountDetails...");
        const result = await actions.updateAccountDetails(formData);
        console.log("Resultado de updateAccountDetails:", result);
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Detalles de la Cuenta</h1>

            {/* Mensaje de estado */}
            {store.updateStatusMsg && (
                <div className={`mb-4 p-3 rounded text-sm ${store.updateStatusMsg.includes('Error') || store.updateStatusMsg.includes('error')
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-green-100 text-green-700 border border-green-300'
                    }`}>
                    {store.updateStatusMsg}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">El email no se puede modificar</p>
                </div>

                <button
                    type="submit"
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-200"
                >
                    Guardar cambios
                </button>
            </form>
        </div>
    );
};

export default AccountDetailsPage;
