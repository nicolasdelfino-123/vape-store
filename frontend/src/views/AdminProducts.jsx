import { useEffect, useState, useContext } from "react"
import { Context } from "../js/store/appContext.jsx"

import TagsInput from "../components/TagsInput.jsx"

const API = import.meta.env.VITE_BACKEND_URL

export default function AdminProducts() {
    const { store } = useContext(Context)
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(false)
    const [q, setQ] = useState("")
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState(blank())

    function blank() {
        return {
            name: "", description: "", brand: "",
            price: "", stock: "", category_id: "", image_url: "",
            is_active: true, flavors: []
        }
    }

    const token = localStorage.getItem("token")

    const authHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    }

    const fetchAll = async () => {
        setLoading(true)
        const [pRes, cRes] = await Promise.all([
            fetch(`${API}/products?only_active=false`).then(r => r.json()),
            fetch(`${API}/categories`).then(r => r.json()),
        ])
        setProducts(Array.isArray(pRes) ? pRes : [])
        setCategories(Array.isArray(cRes) ? cRes : [])
        setLoading(false)
    }

    useEffect(() => { fetchAll() }, [])

    const openNew = () => { setEditing(null); setForm(blank()) }
    const openEdit = (p) => {
        setEditing(p); setForm({
            name: p.name ?? "", description: p.description ?? "", brand: p.brand ?? "",
            price: p.price ?? "", stock: p.stock ?? "", category_id: p.category_id ?? "",
            image_url: p.image_url ?? "", is_active: !!p.is_active, flavors: p.flavors || []
        })
    }

    const save = async (e) => {
        e.preventDefault()
        setLoading(true)
        const url = editing ? `${API}/admin/products/${editing.id}` : `${API}/admin/products`
        const method = editing ? "PUT" : "POST"
        const res = await fetch(url, {
            method, headers: authHeaders, body: JSON.stringify({
                ...form,
                price: Number(form.price || 0),
                stock: Number(form.stock || 0),
                category_id: Number(form.category_id || 0),
            })
        })
        if (!res.ok) alert("Error al guardar")
        await fetchAll()
        setEditing(null); setForm(blank())
    }

    const toggleActive = async (p) => {
        const res = await fetch(`${API}/admin/products/${p.id}`, {
            method: "PUT", headers: authHeaders, body: JSON.stringify({ is_active: !p.is_active })
        })
        if (!res.ok) alert("Error")
        await fetchAll()
    }

    const filtered = products.filter(p =>
        (!q || (p.name?.toLowerCase().includes(q.toLowerCase()))))

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <h1 className="text-2xl font-bold mb-4">Admin de Productos</h1>

            <div className="mb-4 flex gap-3">
                <input
                    className="flex-1 rounded border px-3 py-2"
                    placeholder="Buscar por nombre…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />
                <button onClick={openNew} className="rounded bg-emerald-600 px-4 py-2 text-white">Nuevo</button>
            </div>

            <div className="overflow-x-auto rounded-2xl border bg-white">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2 text-left">Producto</th>
                            <th className="px-3 py-2 text-left">Categoría</th>
                            <th className="px-3 py-2">Precio</th>
                            <th className="px-3 py-2">Stock</th>
                            <th className="px-3 py-2">Act.</th>
                            <th className="px-3 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(p => (
                            <tr key={p.id} className="border-t">
                                <td className="px-3 py-2">
                                    <div className="flex items-center gap-3">
                                        <img src={p.image_url || "/placeholder-product.jpg"} className="h-12 w-12 rounded object-cover" />
                                        <div>
                                            <div className="font-medium">{p.name}</div>
                                            <div className="text-xs text-gray-500 line-clamp-1">{p.description}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-3 py-2">{p.category_name}</td>
                                <td className="px-3 py-2 text-center">${p.price}</td>
                                <td className="px-3 py-2 text-center">{p.stock}</td>
                                <td className="px-3 py-2 text-center">
                                    <span className={`inline-block rounded px-2 py-1 text-xs ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                        {p.is_active ? "Sí" : "No"}
                                    </span>
                                </td>
                                <td className="px-3 py-2 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => openEdit(p)} className="rounded border px-3 py-1">Editar</button>
                                        <button onClick={() => toggleActive(p)} className="rounded border px-3 py-1">
                                            {p.is_active ? "Desactivar" : "Activar"}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!filtered.length && (
                            <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={6}>Sin resultados</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Drawer/Modal simple */}
            {(editing || form.name) && (
                <form onSubmit={save} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">{editing ? "Editar producto" : "Nuevo producto"}</h2>
                            <button type="button" onClick={() => { setEditing(null); setForm(blank()) }}>✕</button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Text label="Nombre" value={form.name} onChange={v => setForm({ ...form, name: v })} required />
                            <Text label="Marca" value={form.brand} onChange={v => setForm({ ...form, brand: v })} />
                            <Text label="Precio" type="number" value={form.price} onChange={v => setForm({ ...form, price: v })} required />
                            <Text label="Stock" type="number" value={form.stock} onChange={v => setForm({ ...form, stock: v })} required />
                            <Text label="Imagen (URL)" value={form.image_url} onChange={v => setForm({ ...form, image_url: v })} />
                            <Select
                                label="Categoría"
                                options={categories.map(c => ({ value: c.id, label: c.name }))}
                                value={form.category_id}
                                onChange={v => setForm({ ...form, category_id: v })}
                                required
                            />
                            <div className="md:col-span-2">
                                <Label>Descripción</Label>
                                <textarea className="w-full rounded border px-3 py-2" rows="3"
                                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <Label>Sabores (solo desechables)</Label>
                                <TagsInput value={form.flavors} onChange={(v) => setForm({ ...form, flavors: v })} />
                            </div>
                            <div className="flex items-center gap-2 md:col-span-2">
                                <input id="is_active" type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                                <label htmlFor="is_active" className="text-sm">Activo</label>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button type="button" onClick={() => { setEditing(null); setForm(blank()) }} className="rounded border px-4 py-2">Cancelar</button>
                            <button type="submit" className="rounded bg-emerald-600 px-4 py-2 text-white">{editing ? "Guardar" : "Crear"}</button>
                        </div>
                    </div>
                </form>
            )}

            {loading && <div className="fixed inset-0 z-40 bg-black/20" />}
        </div>
    )
}

function Label({ children }) { return <div className="mb-1 text-sm font-medium">{children}</div> }
function Text({ label, type = "text", value, onChange, required }) {
    return (
        <div>
            <Label>{label}</Label>
            <input className="w-full rounded border px-3 py-2" type={type} value={value}
                onChange={(e) => onChange(e.target.value)} required={required} />
        </div>
    )
}
function Select({ label, value, onChange, options, required }) {
    return (
        <div>
            <Label>{label}</Label>
            <select className="w-full rounded border px-3 py-2"
                value={value} onChange={(e) => onChange(e.target.value)} required={required}>
                <option value="">Selecciona…</option>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    )
}
