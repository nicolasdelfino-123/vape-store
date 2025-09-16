import { useContext, useEffect, useState } from "react";
import { Context } from "../js/store/appContext.jsx";

export default function AddressesPage() {
    const { store, actions } = useContext(Context);

    const emptyForm = {
        name: "",
        lastname: "",
        dni: "",
        country: "Argentina",
        address: "",
        apartment: "",
        city: "",
        province: "Córdoba",
        postalCode: "",
        phone: "",
        email: "",
    };

    const [billingForm, setBillingForm] = useState(emptyForm);
    const [shippingForm, setShippingForm] = useState(emptyForm);
    const [savingBilling, setSavingBilling] = useState(false);
    const [savingShipping, setSavingShipping] = useState(false);

    // 'billing' | 'shipping' | null
    const [editing, setEditing] = useState(null);

    useEffect(() => {
        if (store.user) {
            const [firstName, ...lastNameParts] = (store.user.name || "").split(" ");
            const baseUser = {
                name: firstName || "",
                lastname: lastNameParts.join(" ") || "",
                email: store.user.email || "",
            };
            setBillingForm((f) => ({ ...f, ...baseUser }));
            setShippingForm((f) => ({ ...f, ...baseUser }));
        }

        // Precargar direcciones guardadas (si existen)
        actions.fetchUserBillingAddress?.().then((addr) => {
            if (addr) setBillingForm((f) => ({ ...f, ...addr }));
        });
        actions.fetchUserShippingAddress?.().then((addr) => {
            if (addr) setShippingForm((f) => ({ ...f, ...addr }));
        });
    }, [store.user]);

    const scrollToForm = () => {
        // esperar al próximo frame para asegurar el render del form
        setTimeout(() => {
            document.getElementById("form-anchor")?.scrollIntoView({ behavior: "smooth" });
        }, 0);
    };

    const saveAddress = async (formData, type, setSaving) => {
        setSaving(true);

        const fullAddress = [
            formData.address,
            formData.apartment && `Depto: ${formData.apartment}`,
            formData.city,
            formData.province,
            formData.postalCode && `CP: ${formData.postalCode}`,
        ]
            .filter(Boolean)
            .join(", ");

        const success = await actions.updateUserAddress?.(
            fullAddress,
            formData.phone,
            type,        // 'facturación' | 'envío'
            formData.dni // DNI
        );

        alert(
            success
                ? `Dirección de ${type} actualizada correctamente`
                : `Error al actualizar la dirección de ${type}`
        );

        setSaving(false);
        return success;
    };

    const handleSubmitBilling = async (e) => {
        e.preventDefault();
        const ok = await saveAddress(billingForm, "facturación", setSavingBilling);
        if (ok) setEditing(null);
    };

    const handleSubmitShipping = async (e) => {
        e.preventDefault();
        const ok = await saveAddress(shippingForm, "envío", setSavingShipping);
        if (ok) setEditing(null);
    };

    const provinces = [
        "Buenos Aires",
        "Catamarca",
        "Chaco",
        "Chubut",
        "Córdoba",
        "Corrientes",
        "Entre Ríos",
        "Formosa",
        "Jujuy",
        "La Pampa",
        "La Rioja",
        "Mendoza",
        "Misiones",
        "Neuquén",
        "Río Negro",
        "Salta",
        "San Juan",
        "San Luis",
        "Santa Cruz",
        "Santa Fe",
        "Santiago del Estero",
        "Tierra del Fuego",
        "Tucumán",
        "Ciudad Autónoma de Buenos Aires",
    ];

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-xl font-semibold mb-2">Direcciones</h1>
                <p className="text-sm text-gray-600">
                    Las siguientes direcciones se usarán por defecto en la página de pago.
                </p>
            </div>

            {/* Vista actual de direcciones */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Facturación */}
                <div className="border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">Dirección de facturación</h3>
                        <button
                            onClick={() => {
                                setEditing("billing");
                                scrollToForm();
                            }}
                            className="text-sm text-purple-600 hover:underline"
                        >
                            Editar
                        </button>
                    </div>
                    <div className="text-gray-700 whitespace-pre-line text-sm">
                        {billingForm.name} {billingForm.lastname}
                        {billingForm.dni && `\nDNI: ${billingForm.dni}`}
                        {"\n"}
                        {billingForm.address || "Sin dirección configurada"}
                        {billingForm.apartment && `\nDepto: ${billingForm.apartment}`}
                        {billingForm.city && `\n${billingForm.city}, ${billingForm.province}`}
                        {billingForm.postalCode && `\nCP: ${billingForm.postalCode}`}
                        {"\n"}
                        {billingForm.country}
                        {billingForm.phone && `\nTel: ${billingForm.phone}`}
                        {billingForm.email && `\n${billingForm.email}`}
                    </div>
                </div>

                {/* Envío */}
                <div className="border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">Dirección de envío</h3>
                        <button
                            onClick={() => {
                                setEditing("shipping");
                                scrollToForm();
                            }}
                            className="text-sm text-purple-600 hover:underline"
                        >
                            Editar
                        </button>
                    </div>
                    <div className="text-gray-700 whitespace-pre-line text-sm">
                        {shippingForm.name} {shippingForm.lastname}
                        {shippingForm.dni && `\nDNI: ${shippingForm.dni}`}
                        {"\n"}
                        {shippingForm.address || "Sin dirección configurada"}
                        {shippingForm.apartment && `\nDepto: ${shippingForm.apartment}`}
                        {shippingForm.city && `\n${shippingForm.city}, ${shippingForm.province}`}
                        {shippingForm.postalCode && `\nCP: ${shippingForm.postalCode}`}
                        {"\n"}
                        {shippingForm.country}
                        {shippingForm.phone && `\nTel: ${shippingForm.phone}`}
                        {shippingForm.email && `\n${shippingForm.email}`}
                    </div>
                </div>
            </div>

            {/* Ancla para el scroll suave al abrir un form */}
            <div id="form-anchor" />

            {/* Formulario de facturación (solo si está en edición) */}
            {editing === "billing" && (
                <form id="form-billing" onSubmit={handleSubmitBilling} className="space-y-6 border-t pt-6">
                    <h2 className="text-lg font-semibold">Dirección de facturación</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nombre *</label>
                            <input
                                type="text"
                                required
                                value={billingForm.name}
                                onChange={(e) => setBillingForm({ ...billingForm, name: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Apellidos *</label>
                            <input
                                type="text"
                                required
                                value={billingForm.lastname}
                                onChange={(e) => setBillingForm({ ...billingForm, lastname: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">DNI *</label>
                        <input
                            type="text"
                            required
                            value={billingForm.dni}
                            onChange={(e) => setBillingForm({ ...billingForm, dni: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">País / Región *</label>
                        <select
                            value={billingForm.country}
                            onChange={(e) => setBillingForm({ ...billingForm, country: e.target.value })}
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
                            value={billingForm.address}
                            onChange={(e) => setBillingForm({ ...billingForm, address: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Piso, departamento, etc. (opcional)</label>
                        <input
                            type="text"
                            value={billingForm.apartment}
                            onChange={(e) => setBillingForm({ ...billingForm, apartment: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Ciudad *</label>
                        <input
                            type="text"
                            required
                            value={billingForm.city}
                            onChange={(e) => setBillingForm({ ...billingForm, city: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Provincia *</label>
                            <select
                                value={billingForm.province}
                                onChange={(e) => setBillingForm({ ...billingForm, province: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                {provinces.map((prov) => (
                                    <option key={prov} value={prov}>
                                        {prov}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Código postal *</label>
                            <input
                                type="text"
                                required
                                value={billingForm.postalCode}
                                onChange={(e) => setBillingForm({ ...billingForm, postalCode: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Teléfono *</label>
                        <input
                            type="tel"
                            required
                            value={billingForm.phone}
                            onChange={(e) => setBillingForm({ ...billingForm, phone: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Dirección de correo electrónico *</label>
                        <input
                            type="email"
                            required
                            value={billingForm.email}
                            onChange={(e) => setBillingForm({ ...billingForm, email: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={savingBilling}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md disabled:opacity-60 font-medium"
                        >
                            {savingBilling ? "Guardando..." : "GUARDAR DIRECCIÓN"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setEditing(null)}
                            className="text-sm text-gray-600 hover:underline"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* Formulario de envío (solo si está en edición) */}
            {editing === "shipping" && (
                <form id="form-shipping" onSubmit={handleSubmitShipping} className="space-y-6 border-t pt-6">
                    <h2 className="text-lg font-semibold">Dirección de envío</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nombre *</label>
                            <input
                                type="text"
                                required
                                value={shippingForm.name}
                                onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Apellidos *</label>
                            <input
                                type="text"
                                required
                                value={shippingForm.lastname}
                                onChange={(e) => setShippingForm({ ...shippingForm, lastname: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">DNI *</label>
                        <input
                            type="text"
                            required
                            value={shippingForm.dni}
                            onChange={(e) => setShippingForm({ ...shippingForm, dni: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">País / Región *</label>
                        <select
                            value={shippingForm.country}
                            onChange={(e) => setShippingForm({ ...shippingForm, country: e.target.value })}
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
                            value={shippingForm.address}
                            onChange={(e) => setShippingForm({ ...shippingForm, address: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Piso, departamento, etc. (opcional)</label>
                        <input
                            type="text"
                            value={shippingForm.apartment}
                            onChange={(e) => setShippingForm({ ...shippingForm, apartment: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Ciudad *</label>
                        <input
                            type="text"
                            required
                            value={shippingForm.city}
                            onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Provincia *</label>
                            <select
                                value={shippingForm.province}
                                onChange={(e) => setShippingForm({ ...shippingForm, province: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                {provinces.map((prov) => (
                                    <option key={prov} value={prov}>
                                        {prov}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Código postal *</label>
                            <input
                                type="text"
                                required
                                value={shippingForm.postalCode}
                                onChange={(e) => setShippingForm({ ...shippingForm, postalCode: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Teléfono *</label>
                        <input
                            type="tel"
                            required
                            value={shippingForm.phone}
                            onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Dirección de correo electrónico *</label>
                        <input
                            type="email"
                            required
                            value={shippingForm.email}
                            onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={savingShipping}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md disabled:opacity-60 font-medium"
                        >
                            {savingShipping ? "Guardando..." : "GUARDAR DIRECCIÓN"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setEditing(null)}
                            className="text-sm text-gray-600 hover:underline"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
