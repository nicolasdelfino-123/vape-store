import { useEffect, useState } from "react"
import TagsInput from "../components/TagsInput.jsx" // Reutilizar el componente existente

const API = import.meta.env.VITE_BACKEND_URL

export default function AdminProducts() {
    const [products, setProducts] = useState([])
    const [categories] = useState(["Vapes Desechables", "Pods", "Líquidos", "Accesorios", "Celulares", "Perfumes"])
    const [form, setForm] = useState(null)
    const [q, setQ] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("Todos")

    const token = localStorage.getItem("token") || localStorage.getItem("admin_token")
    if (!token) return <div className="p-6">No autorizado</div>

    const fetchAll = async () => {
        try {
            const res = await fetch(`${API}/admin/products`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setProducts(data || [])
            }
        } catch (error) {
            console.error("Error fetching products:", error)
        }
    }

    useEffect(() => { fetchAll() }, [])

    const save = async (e) => {
        e.preventDefault()
        try {
            const method = form.id ? "PUT" : "POST"
            const url = form.id ? `${API}/admin/products/${form.id}` : `${API}/admin/products`

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(form)
            })

            if (res.ok) {
                setForm(null)
                fetchAll()
                alert(form.id ? "Producto actualizado" : "Producto creado exitosamente")
            } else {
                const error = await res.json()
                alert(`Error: ${error.error || 'No se pudo guardar el producto'}`)
            }
        } catch (error) {
            console.error("Error saving product:", error)
            alert("Error al guardar producto")
        }
    }

    // Función para determinar si debe mostrar sabores según categoría
    const shouldShowFlavors = (categoryId) => {
        // 1: Vapes Desechables, 3: Líquidos (según tu configuración)
        return [1, 3].includes(Number(categoryId))
    }

    const filtered = products.filter(p => {
        const matchesSearch = !q || p.name?.toLowerCase().includes(q.toLowerCase()) || p.brand?.toLowerCase().includes(q.toLowerCase())
        const matchesCategory = selectedCategory === "Todos" || p.category_name === selectedCategory
        return matchesSearch && matchesCategory
    })

    return (
        <div className="p-4 sm:p-6">
            <h1 className="text-2xl font-bold mb-4">Admin Productos</h1>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <input
                    placeholder="Buscar por nombre o marca"
                    className="flex-1 border rounded px-3 py-2"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="border rounded px-3 py-2 sm:w-48"
                >
                    <option value="Todos">Todas las categorías</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <button onClick={() => setForm({ category_id: 1 })} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700">
                    Nuevo
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-2 text-left">Producto</th>
                            <th className="p-2 text-left">Descripción</th>
                            <th className="p-2 text-left">Descripción breve</th>
                            <th className="p-2">Precio</th>
                            <th className="p-2">Stock</th>
                            <th className="p-2">Categoría</th>
                            <th className="p-2">Sabores</th>
                            <th className="p-2">Estado</th>
                            <th className="p-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(p => (
                            <tr key={p.id} className="border-t">
                                <td className="p-2">
                                    <div>
                                        <div className="font-medium">{p.name}</div>
                                        {p.brand && <div className="text-gray-500 text-xs">{p.brand}</div>}
                                    </div>
                                </td>
                                {/* Descripción larga */}
                                <td className="p-2 max-w-xs">
                                    <div className="truncate" title={p.description}>
                                        {p.description || "Sin descripción"}
                                    </div>
                                </td>

                                {/* Descripción breve */}
                                <td className="p-2 max-w-xs">
                                    <div className="truncate" title={p.short_description}>
                                        {p.short_description || "Sin descripción breve"}
                                    </div>
                                </td>
                                <td className="p-2 text-center">${p.price}</td>
                                <td className="p-2 text-center">{p.stock}</td>
                                <td className="p-2 text-center">{p.category_name}</td>
                                <td className="p-2 text-center">
                                    {p.flavor_enabled ? (
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                            {p.flavors?.length || 0} sabores
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-500">Sin sabores</span>
                                    )}
                                </td>
                                <td className="p-2 text-center">
                                    <span className={`px-2 py-1 rounded text-xs ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {p.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="p-2 text-right">
                                    <button
                                        onClick={() => setForm(p)}
                                        className="px-3 py-1 border rounded hover:bg-gray-50"
                                    >
                                        Editar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    No se encontraron productos
                </div>
            )}

            {form && (
                <form
                    onSubmit={save}
                    className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
                >
                    <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-3 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-semibold">{form.id ? "Editar" : "Nuevo"} Producto</h2>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre
                        </label>
                        <input className="w-full border rounded px-3 py-2"
                            placeholder="Nombre" value={form.name || ""}
                            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                        {/* Descripción breve (subtítulo) */}
                        <label htmlFor="short_description" className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción breve
                        </label>
                        <textarea
                            id="short_description"
                            className="w-full border rounded px-3 py-2"
                            placeholder="Subtítulo (máx. 200 caracteres)"
                            rows={2}
                            maxLength={200}
                            value={form.short_description || ""}
                            onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                        />

                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea className="w-full border rounded px-3 py-2"
                            placeholder="Descripción" value={form.description || ""}
                            onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                            Marca
                        </label>
                        <input className="w-full border rounded px-3 py-2"
                            placeholder="Marca" value={form.brand || ""}
                            onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                            Precio
                        </label>
                        <input className="w-full border rounded px-3 py-2"
                            placeholder="Precio" type="number" step="0.01" value={form.price || ""}
                            onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                        <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                            Stock
                        </label>
                        <input className="w-full border rounded px-3 py-2"
                            placeholder="Stock" type="number" value={form.stock || ""}
                            onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
                        <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
                            URL de imagen
                        </label>
                        <input className="w-full border rounded px-3 py-2"
                            placeholder="URL de imagen" value={form.image_url || ""}
                            onChange={(e) => setForm({ ...form, image_url: e.target.value })} />

                        <select className="w-full border rounded px-3 py-2"
                            value={form.category_id || ""}
                            onChange={(e) => {
                                const categoryId = parseInt(e.target.value)
                                setForm({
                                    ...form,
                                    category_id: categoryId,
                                    flavor_enabled: shouldShowFlavors(categoryId),
                                    flavors: shouldShowFlavors(categoryId) ? (form.flavors || []) : []
                                })
                            }}
                            required>
                            <option value="">Selecciona categoría</option>
                            <option value={1}>Vapes Desechables</option>
                            <option value={2}>Pods</option>
                            <option value={3}>Líquidos</option>
                            <option value={4}>Accesorios</option>
                            <option value={5}>Celulares</option>
                            <option value={6}>Perfumes</option>
                        </select>

                        {/* MOSTRAR SABORES SOLO PARA DESECHABLES Y LÍQUIDOS */}
                        {shouldShowFlavors(form.category_id) && (
                            <>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={form.flavor_enabled ?? true}
                                        onChange={(e) => setForm({ ...form, flavor_enabled: e.target.checked })}
                                    />
                                    Habilitar selector de sabores
                                </label>

                                {form.flavor_enabled && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Sabores disponibles</label>
                                        <TagsInput
                                            value={form.flavors || []}
                                            onChange={(flavors) => setForm({ ...form, flavors })}
                                            placeholder="Agregar sabor y presionar Enter"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Ej: Fresa, Menta, Vainilla, etc.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={form.is_active ?? true}
                                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                            />
                            Producto activo
                        </label>

                        <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setForm(null)} className="px-3 py-2 border rounded">
                                Cancelar
                            </button>
                            <button type="submit" className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                                Guardar
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    )
}