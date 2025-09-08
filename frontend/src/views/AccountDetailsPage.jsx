import React, { useState, useContext, useEffect } from 'react';
import { Context } from '../js/store/appContext';

const AccountDetailsPage = () => {
    const { store, actions } = useContext(Context);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [showPasswordFields, setShowPasswordFields] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cargar datos del usuario al montar el componente
    useEffect(() => {
        if (store.user) {
            setFormData(prev => ({
                ...prev,
                name: store.user.name || '',
                email: store.user.email || ''
            }));
        } else {
            // Si no hay usuario, intentar hidratar sesión
            actions.hydrateSession?.();
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
        setIsSubmitting(true);

        // Validaciones
        if (!formData.name.trim()) {
            setIsSubmitting(false);
            return;
        }

        // Si quiere cambiar contraseña, validar campos
        if (showPasswordFields) {
            if (!formData.current_password || !formData.new_password || !formData.confirm_password) {
                alert("Completá todos los campos de contraseña");
                setIsSubmitting(false);
                return;
            }
            if (formData.new_password !== formData.confirm_password) {
                alert("Las contraseñas nuevas no coinciden");
                setIsSubmitting(false);
                return;
            }
            if (formData.new_password.length < 6) {
                alert("La nueva contraseña debe tener al menos 6 caracteres");
                setIsSubmitting(false);
                return;
            }
        }

        // Preparar datos para enviar
        const dataToUpdate = {
            name: formData.name.trim()
        };

        // Solo incluir contraseñas si el usuario quiere cambiarlas
        if (showPasswordFields) {
            dataToUpdate.current_password = formData.current_password;
            dataToUpdate.new_password = formData.new_password;
            dataToUpdate.confirm_password = formData.confirm_password;
        }

        const result = await actions.updateAccountDetails(dataToUpdate);

        if (result) {
            // Limpiar campos de contraseña si la actualización fue exitosa
            if (showPasswordFields) {
                setFormData(prev => ({
                    ...prev,
                    current_password: '',
                    new_password: '',
                    confirm_password: ''
                }));
                setShowPasswordFields(false);
            }
        }

        setIsSubmitting(false);
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
                {/* Información básica */}
                <div className="bg-white p-6 rounded-lg border">
                    <h2 className="text-lg font-semibold mb-4">Información Personal</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre *
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
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">El email no se puede modificar</p>
                        </div>
                    </div>
                </div>

                {/* Cambio de contraseña */}
                <div className="bg-white p-6 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Cambiar Contraseña</h2>
                        <button
                            type="button"
                            onClick={() => setShowPasswordFields(!showPasswordFields)}
                            className="text-sm text-purple-600 hover:text-purple-700 underline"
                        >
                            {showPasswordFields ? 'Cancelar' : 'Cambiar contraseña'}
                        </button>
                    </div>

                    {showPasswordFields && (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Contraseña actual *
                                </label>
                                <input
                                    type="password"
                                    id="current_password"
                                    name="current_password"
                                    value={formData.current_password}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-2">
                                        Nueva contraseña *
                                    </label>
                                    <input
                                        type="password"
                                        id="new_password"
                                        name="new_password"
                                        value={formData.new_password}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        minLength={6}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirmar nueva contraseña *
                                    </label>
                                    <input
                                        type="password"
                                        id="confirm_password"
                                        name="confirm_password"
                                        value={formData.confirm_password}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        minLength={6}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-200 disabled:opacity-50"
                >
                    {isSubmitting ? "Guardando..." : "Guardar cambios"}
                </button>
            </form>
        </div>
    );
};

export default AccountDetailsPage;