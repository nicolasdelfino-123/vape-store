import { useContext, useEffect, useState } from "react";
import { Context } from '../js/store/appContext.jsx';

export default function AddressesPage() {
    const { store, actions } = useContext(Context);
    const [form, setForm] = useState({ address: "", phone: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        actions.fetchUserAddress().then((addr) => {
            if (addr) setForm({ address: addr.address || "", phone: addr.phone || "" });
        });
    }, []);

    const onSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        await actions.updateUserAddress(form.address, form.phone);
        setSaving(false);
    };

    const pretty = (t) => (t || "Sin dirección");

    return (
        <div className="space-y-6">
            <p className="text-sm text-gray-600">Las siguientes direcciones se usarán por defecto en la compra.</p>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">Dirección de facturación</h3>
                        <a href="#editar" onClick={(e) => { e.preventDefault(); document.getElementById("form-direccion").scrollIntoView({ behavior: "smooth" }); }} className="text-sm text-purple-600 hover:underline">Editar</a>
                    </div>
                    <div className="text-gray-700 whitespace-pre-line">
                        {store.user?.name || ""}
                        {"\n"}{pretty(form.address)}
                        {"\n"}Tel: {form.phone || "—"}
                    </div>
                </div>

                <div className="border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">Dirección de envío</h3>
                        <a href="#editar" onClick={(e) => { e.preventDefault(); document.getElementById("form-direccion").scrollIntoView({ behavior: "smooth" }); }} className="text-sm text-purple-600 hover:underline">Editar</a>
                    </div>
                    <div className="text-gray-700 whitespace-pre-line">
                        {store.user?.name || ""}
                        {"\n"}{pretty(form.address)}
                        {"\n"}Tel: {form.phone || "—"}
                    </div>
                </div>
            </div>

            <form id="form-direccion" onSubmit={onSubmit} className="border rounded-xl p-4 space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Dirección</label>
                    <textarea
                        className="w-full border rounded-md p-2" rows={3}
                        value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder="Calle, número, referencias" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Teléfono</label>
                    <input className="w-full border rounded-md p-2"
                        value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="Ej: 351-..." />
                </div>
                <button type="submit" disabled={saving}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md disabled:opacity-60">
                    {saving ? "Guardando..." : "Guardar cambios"}
                </button>
            </form>
        </div>
    );
}
