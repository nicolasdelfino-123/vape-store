import { useContext, useEffect, useState } from "react";
import { Context } from '../js/store/appContext.jsx';

export default function AddressesPage() {
    const { store, actions } = useContext(Context);
    const [form, setForm] = useState({
        name: "",
        lastname: "",
        country: "Argentina",
        address: "",
        apartment: "",
        city: "",
        province: "Córdoba",
        postalCode: "",
        phone: "",
        email: ""
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Precargar datos del usuario
        if (store.user) {
            const [firstName, ...lastNameParts] = (store.user.name || "").split(" ");
            setForm(prev => ({
                ...prev,
                name: firstName || "",
                lastname: lastNameParts.join(" ") || "",
                email: store.user.email || ""
            }));
        }

        // Cargar dirección existente
        actions.fetchUserAddress?.().then((addr) => {
            if (addr && addr.address) {
                setForm(prev => ({
                    ...prev,
                    address: addr.address || "",
                    phone: addr.phone || ""
                }));
            }
        });
    }, [store.user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        // Construir dirección completa
        const fullAddress = [
            form.address,
            form.apartment && `Depto: ${form.apartment}`,
            form.city,
            form.province,
            form.postalCode && `CP: ${form.postalCode}`
        ].filter(Boolean).join(", ");

        const success = await actions.updateUserAddress?.(fullAddress, form.phone);

        if (success) {
            alert("Dirección actualizada correctamente");
        } else {
            alert("Error al actualizar la dirección");
        }

        setSaving(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold mb-2">Direcciones</h1>
                <p className="text-sm text-gray-600">
                    Las siguientes direcciones se usarán por defecto en la página de pago.
                </p>
            </div>

            {/* Vista actual de direcciones */}
            <div className="grid gap-6 md:grid-cols-2 mb-8">
                <div className="border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">Dirección de facturación</h3>
                        <button
                            onClick={() => document.getElementById("form-direccion").scrollIntoView({ behavior: "smooth" })}
                            className="text-sm text-purple-600 hover:underline"
                        >
                            Editar
                        </button>
                    </div>
                    <div className="text-gray-700 whitespace-pre-line text-sm">
                        {form.name} {form.lastname}
                        {"\n"}{form.address || "Sin dirección configurada"}
                        {form.apartment && `\nDepto: ${form.apartment}`}
                        {form.city && `\n${form.city}, ${form.province}`}
                        {form.postalCode && `\nCP: ${form.postalCode}`}
                        {"\n"}{form.country}
                        {form.phone && `\nTel: ${form.phone}`}
                        {form.email && `\n${form.email}`}
                    </div>
                </div>

                <div className="border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">Dirección de envío</h3>
                        <button
                            onClick={() => document.getElementById("form-direccion").scrollIntoView({ behavior: "smooth" })}
                            className="text-sm text-purple-600 hover:underline"
                        >
                            Editar
                        </button>
                    </div>
                    <div className="text-gray-700 whitespace-pre-line text-sm">
                        {form.name} {form.lastname}
                        {"\n"}{form.address || "Sin dirección configurada"}
                        {form.apartment && `\nDepto: ${form.apartment}`}
                        {form.city && `\n${form.city}, ${form.province}`}
                        {form.postalCode && `\nCP: ${form.postalCode}`}
                        {"\n"}{form.country}
                        {form.phone && `\nTel: ${form.phone}`}
                        {form.email && `\n${form.email}`}
                    </div>
                </div>
            </div>

            {/* Formulario de edición */}
            <form id="form-direccion" onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-lg font-semibold">Dirección de facturación</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nombre *</label>
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Apellidos *</label>
                        <input
                            type="text"
                            required
                            value={form.lastname}
                            onChange={(e) => setForm({ ...form, lastname: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">País / Región *</label>
                    <select
                        value={form.country}
                        onChange={(e) => setForm({ ...form, country: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="Argentina">Argentina</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Dirección de la calle *</label>
                    <input
                        type="text"
                        required
                        placeholder="Nombre de la calle y número"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Piso, departamento, etc. (opcional)</label>
                    <input
                        type="text"
                        value={form.apartment}
                        onChange={(e) => setForm({ ...form, apartment: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Ciudad *</label>
                    <input
                        type="text"
                        required
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Provincia *</label>
                        <select
                            value={form.province}
                            onChange={(e) => setForm({ ...form, province: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="Córdoba">Córdoba</option>
                            <option value="Buenos Aires">Buenos Aires</option>
                            <option value="Santa Fe">Santa Fe</option>
                            <option value="Mendoza">Mendoza</option>
                            {/* Agregar más provincias según necesites */}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Código postal *</label>
                        <input
                            type="text"
                            required
                            value={form.postalCode}
                            onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Teléfono *</label>
                    <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Dirección de correo electrónico *</label>
                    <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md disabled:opacity-60 font-medium"
                >
                    {saving ? "Guardando..." : "GUARDAR DIRECCIÓN"}
                </button>
            </form>
        </div>
    );
}