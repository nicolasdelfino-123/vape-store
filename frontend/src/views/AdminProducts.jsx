import { useEffect, useState } from "react"

const API = import.meta.env.VITE_BACKEND_URL

export default function AdminProducts() {
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState(["Desechables", "Recargables", "Celulares", "Perfumes"])
    const [form, setForm] = useState(null)
    const [q, setQ] = useState("")

    const token = localStorage.getItem("admin_token")
    if (!token) return <div className="p-6">No autorizado</div>

    const fetchAll = async () => {
        const res = await fetch(`${API}/products?only_active=false`)
        const data = await res.json()
        setProducts(data || [])
    }

    useEffect(() => { fetchAll() }, [])

    const save = async (e) => {
        e.preventDefault()
        const method = form.id ? "PUT" : "POST"
        const url = form.id ? `${API}/admin/products/${form.id}` : `${API}/admin/products`
        await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form)
        })
        setForm(null)
        fetchAll()
    }

    const filtered = products.filter(p =>
        !q || p.name?.toLowerCase().includes(q.toLowerCase()) || p.barcode === q
    )

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Admin Productos</h1>

            <div className="flex gap-3 mb-4">
                <input
                    placeholder="Buscar por nombre o código"
                    className="flex-1 border rounded px-3 py-2"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />
                <button onClick={() => setForm({})} className="bg-emerald-600 text-white px-4 py-2 rounded">Nuevo</button>
            </div>

            <table className="w-full text-sm border">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="p-2 text-left">Producto</th>
                        <th className="p-2">Precio</th>
                        <th className="p-2">Stock</th>
                        <th className="p-2">Categoría</th>
                        <th className="p-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map(p => (
                        <tr key={p.id} className="border-t">
                            <td className="p-2">{p.name}</td>
                            <td className="p-2">${p.price}</td>
                            <td className="p-2">{p.stock}</td>
                            <td className="p-2">{p.category_name}</td>
                            <td className="p-2 text-right">
                                <button onClick={() => setForm(p)} className="px-2 border rounded">Editar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {form && (
                <form
                    onSubmit={save}
                    className="fixed inset-0 bg-black/40 flex items-center justify-center"
                >
                    <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-3">
                        <h2 className="text-lg font-semibold">{form.id ? "Editar" : "Nuevo"} Producto</h2>

                        <input className="w-full border rounded px-3 py-2"
                            placeholder="Nombre" value={form.name || ""}
                            onChange={(e) => setForm({ ...form, name: e.target.value })} required />

                        <textarea className="w-full border rounded px-3 py-2"
                            placeholder="Descripción" value={form.description || ""}
                            onChange={(e) => setForm({ ...form, description: e.target.value })} />

                        <input className="w-full border rounded px-3 py-2"
                            placeholder="Precio" type="number" value={form.price || ""}
                            onChange={(e) => setForm({ ...form, price: e.target.value })} required />

                        <input className="w-full border rounded px-3 py-2"
                            placeholder="Stock" type="number" value={form.stock || ""}
                            onChange={(e) => setForm({ ...form, stock: e.target.value })} required />

                        <input className="w-full border rounded px-3 py-2"
                            placeholder="Imagen (URL o /public/...)" value={form.image_url || ""}
                            onChange={(e) => setForm({ ...form, image_url: e.target.value })} />

                        <select className="w-full border rounded px-3 py-2"
                            value={form.category_name || ""}
                            onChange={(e) => {
                                if (e.target.value === "add") {
                                    const newCat = prompt("Nueva categoría:")
                                    if (newCat) setCategories([...categories, newCat])
                                } else {
                                    setForm({ ...form, category_name: e.target.value })
                                }
                            }}>
                            <option value="">Selecciona categoría</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            <option value="add">+ Agregar nueva…</option>
                        </select>

                        <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setForm(null)} className="px-3 py-2 border rounded">Cancelar</button>
                            <button type="submit" className="px-3 py-2 bg-purple-600 text-white rounded">Guardar</button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    )
}
