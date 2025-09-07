import { useContext, useEffect, useState } from "react";
import { Context } from '../js/store/appContext.jsx';

export default function AccountDetailsPage() {
    const { store, actions } = useContext(Context);
    const [name, setName] = useState("");
    const [email] = useState(store.user?.email || "");
    const [currentPass, setCurrentPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => { setName(store.user?.name || ""); }, [store.user]);

    const onSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        await actions.updateAccountDetails({
            name,
            current_password: currentPass || undefined,
            new_password: newPass || undefined,
            confirm_password: confirmPass || undefined
        });
        setCurrentPass(""); setNewPass(""); setConfirmPass("");
        setSaving(false);
    };

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium mb-1">Nombre</label>
                    <input className="w-full border rounded-md p-2" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Apellidos</label>
                    <input className="w-full border rounded-md p-2" placeholder="(opcional)" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Correo electrónico</label>
                    <input className="w-full border rounded-md p-2 bg-gray-100" value={email} disabled readOnly />
                </div>
            </div>

            <div className="border rounded-xl p-4 space-y-4">
                <h3 className="font-semibold">Cambio de contraseña</h3>
                <div>
                    <label className="block text-sm font-medium mb-1">Contraseña actual (dejá en blanco para no cambiar)</label>
                    <input type="password" className="w-full border rounded-md p-2" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Nueva contraseña (dejá en blanco para no cambiar)</label>
                    <input type="password" className="w-full border rounded-md p-2" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Confirmar nueva contraseña</label>
                    <input type="password" className="w-full border rounded-md p-2" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
                </div>
            </div>

            <button type="submit" disabled={saving} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md disabled:opacity-60">
                {saving ? "Guardando..." : "Guardar cambios"}
            </button>
        </form>
    );
}
