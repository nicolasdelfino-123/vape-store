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

    const [shippingForm, setShippingForm] = useState(emptyForm);
    const [savingShipping, setSavingShipping] = useState(false);

    // true | false
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        if (store.user) {
            const [firstName, ...lastNameParts] = (store.user.name || "").split(" ");
            const baseUser = {
                name: firstName || "",
                lastname: lastNameParts.join(" ") || "",
                email: store.user.email || "",
            };
            setShippingForm((f) => ({ ...f, ...baseUser }));
        }

        // Cargar direcciones completas
        actions.fetchUserAddresses?.();
    }, [store.user]);  // ← Mantener esto igual

    // Scroll suave al abrir el form
    const scrollToForm = () => {
        setTimeout(() => {
            document
                .getElementById("form-anchor")
                ?.scrollIntoView({ behavior: "smooth" });
        }, 0);
    };

    useEffect(() => {
        if (store.shippingAddress) {
            setShippingForm(f => ({ ...f, ...store.shippingAddress }));
        }
    }, [store.shippingAddress]);


    const saveShippingAddress = async (formData) => {
        setSavingShipping(true);
        const payload = {
            name: formData.name,
            lastname: formData.lastname,
            dni: formData.dni,
            country: formData.country,
            address: formData.address,
            apartment: formData.apartment,
            city: formData.city,
            province: formData.province,
            postalCode: formData.postalCode,
            phone: formData.phone,
            email: formData.email,
        };
        const ok = await actions.saveShippingAddress?.(payload);
        alert(ok ? "Dirección de envío actualizada correctamente" : "Error al actualizar la dirección de envío");
        setSavingShipping(false);
        return ok;
    };


    const handleSubmitShipping = async (e) => {
        e.preventDefault();
        const ok = await saveShippingAddress(shippingForm);
        if (ok) setEditing(false);
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
                    La siguiente dirección se usará por defecto en la página de pago.
                </p>
            </div>

            {/* Vista actual de direcciones (solo envío) */}
            <div className="grid gap-6 md:grid-cols-1">
                <div className="border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">Dirección de envío</h3>
                        <button
                            onClick={() => {
                                setEditing(true);
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

            {/* Ancla para el scroll suave al abrir el form */}
            <div id="form-anchor" />

            {/* Formulario de envío (solo si está en edición) */}
            {editing && (
                <form
                    id="form-shipping"
                    onSubmit={handleSubmitShipping}
                    className="space-y-6 border-t pt-6"
                >
                    <h2 className="text-lg font-semibold">Dirección de envío</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nombre *</label>
                            <input
                                type="text"
                                required
                                value={shippingForm.name}
                                onChange={(e) =>
                                    setShippingForm({ ...shippingForm, name: e.target.value })
                                }
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Apellidos *
                            </label>
                            <input
                                type="text"
                                required
                                value={shippingForm.lastname}
                                onChange={(e) =>
                                    setShippingForm({ ...shippingForm, lastname: e.target.value })
                                }
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
                            onChange={(e) =>
                                setShippingForm({ ...shippingForm, dni: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            País / Región *
                        </label>
                        <select
                            value={shippingForm.country}
                            onChange={(e) =>
                                setShippingForm({ ...shippingForm, country: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="Argentina">Argentina</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Dirección de la calle *
                        </label>
                        <input
                            type="text"
                            required
                            value={shippingForm.address}
                            onChange={(e) =>
                                setShippingForm({ ...shippingForm, address: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Piso, departamento, etc. (opcional)
                        </label>
                        <input
                            type="text"
                            value={shippingForm.apartment}
                            onChange={(e) =>
                                setShippingForm({ ...shippingForm, apartment: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Ciudad *</label>
                        <input
                            type="text"
                            required
                            value={shippingForm.city}
                            onChange={(e) =>
                                setShippingForm({ ...shippingForm, city: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Provincia *
                            </label>
                            <select
                                value={shippingForm.province}
                                onChange={(e) =>
                                    setShippingForm({ ...shippingForm, province: e.target.value })
                                }
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
                            <label className="block text-sm font-medium mb-1">
                                Código postal *
                            </label>
                            <input
                                type="text"
                                required
                                value={shippingForm.postalCode}
                                onChange={(e) =>
                                    setShippingForm({
                                        ...shippingForm,
                                        postalCode: e.target.value,
                                    })
                                }
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Teléfono *
                        </label>
                        <input
                            type="tel"
                            required
                            value={shippingForm.phone}
                            onChange={(e) =>
                                setShippingForm({ ...shippingForm, phone: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Dirección de correo electrónico *
                        </label>
                        <input
                            type="email"
                            required
                            value={shippingForm.email}
                            onChange={(e) =>
                                setShippingForm({ ...shippingForm, email: e.target.value })
                            }
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
                            onClick={() => setEditing(false)}
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
