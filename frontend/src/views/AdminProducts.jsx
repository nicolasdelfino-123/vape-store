import { useEffect, useRef, useState } from "react"

const API = import.meta.env.VITE_BACKEND_URL

// ----- Helpers de categorías -----
const CATEGORY_NAME_TO_ID = {
    "Vapes Desechables": 1,
    "Pods": 2,
    "Líquidos": 3,
    "Accesorios": 4,
    "Celulares": 5,
    "Perfumes": 6,
}
const ID_TO_CATEGORY_NAME = Object.fromEntries(
    Object.entries(CATEGORY_NAME_TO_ID).map(([k, v]) => [v, k])
)
function mapCategoryId(name) {
    const n = (name || "").toLowerCase()
    if (n.includes("desech")) return 1
    if (n.includes("vape")) return 1
    if (n.includes("líquido") || n.includes("liquido")) return 3
    if (n.includes("pod")) return 2
    return 1 // default
}

// ----- Píldoras de sabores (catálogo con activo/inactivo) -----
function FlavorPills({ catalog = [], onChange }) {
    const [input, setInput] = useState("")
    const toggle = (idx) => onChange(catalog.map((f, i) => i === idx ? { ...f, active: !f.active } : f))
    const remove = (idx) => onChange(catalog.filter((_, i) => i !== idx))
    const add = () => {
        const t = input.trim()
        if (!t) return
        onChange([...(catalog || []), { name: t, active: false }])
        setInput("")
    }

    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-2">
                {catalog.map((f, idx) => (
                    <span
                        key={idx}
                        className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs border
              ${f.active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}
                    >
                        {f.name}
                        <button
                            type="button"
                            onClick={() => toggle(idx)}
                            title={f.active ? "Desactivar" : "Activar"}
                            className="w-4 h-4 rounded-full flex items-center justify-center border"
                        >
                            {f.active ? "✓" : "×"}
                        </button>
                        <button type="button" onClick={() => remove(idx)} title="Quitar" className="text-gray-500">
                            🗑
                        </button>
                    </span>
                ))}
            </div>
            <div className="flex gap-2">
                <input
                    className="flex-1 border rounded px-2 py-1"
                    placeholder="Agregar sabor y presionar Enter"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" ? (e.preventDefault(), add()) : null}
                />
                <button type="button" onClick={add} className="px-3 py-1 border rounded">Agregar</button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
                Click en la {`"${'×'}"`} para inactivar (rojo) / **✓** para activar (verde). Solo los **activos** se publican.
            </p>
        </div>
    )
}

// ----- Componente principal -----
export default function AdminProducts() {
    const [products, setProducts] = useState([])
    const [categories] = useState(["Vapes Desechables", "Pods", "Líquidos", "Accesorios", "Celulares", "Perfumes"])
    const [form, setForm] = useState(null)
    const [q, setQ] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("Todos")

    // Importación masiva
    const fileInputRef = useRef(null)
    const [importPreview, setImportPreview] = useState([]) // array transformado listo para crear
    const [importOpen, setImportOpen] = useState(false)
    const [importing, setImporting] = useState(false)

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

    const shouldShowFlavors = (categoryId) => [1, 3].includes(Number(categoryId))

    const save = async (e) => {
        e.preventDefault()
        try {
            const method = form.id ? "PUT" : "POST"
            const url = form.id ? `${API}/admin/products/${form.id}` : `${API}/admin/products`

            // Publicar solo sabores activos (si hay catálogo); si no, usar flavors tal cual
            const activeFlavors = (form.flavor_catalog
                ? form.flavor_catalog.filter(x => x.active).map(x => x.name)
                : (form.flavors || []))

            const payload = {
                ...form,
                short_description: "", // no usamos
                flavors: activeFlavors,
                flavor_enabled: shouldShowFlavors(form.category_id) && activeFlavors.length > 0,
            }

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
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

    const filtered = products.filter(p => {
        const matchesSearch = !q || p.name?.toLowerCase().includes(q.toLowerCase()) || p.brand?.toLowerCase().includes(q.toLowerCase())
        const matchesCategory = selectedCategory === "Todos" || p.category_name === selectedCategory
        return matchesSearch && matchesCategory
    })

    return (
        <div className="p-4 sm:p-6">
            <h1 className="text-2xl font-bold mb-4">Admin Productos</h1>

            {/* Barra superior */}
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

                {/* Importar JSON */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                    Importar JSON
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                            const text = await file.text()
                            const raw = JSON.parse(text) // array del scraper

                            // === 👇 Normalización de nombres para evitar duplicados "similares" ===
                            const cleanName = n => n.replace(/\s+/g, " ").trim().toLowerCase()
                            const existingNames = new Set(products.map(p => cleanName(p.name)))

                            const transformed = (raw || [])
                                .filter(it => !existingNames.has(cleanName(it.name || "")))
                                .map(it => {
                                    const catId = it.category_id || mapCategoryId(it.category_name)
                                    const catalog = (it.flavors || []).map(f => ({ name: String(f), active: true })) // los traemos activos
                                    return {
                                        id: undefined,
                                        name: it.name || "",
                                        description: it.description || "",              // ✅ traer descripción real
                                        short_description: it.short_description || "",  // ✅ traer short description real
                                        brand: it.brand || "",
                                        price: it.price || 0,
                                        stock: it.stock || 0,
                                        image_url: it.image_url || "",
                                        category_id: catId,
                                        category_name: ID_TO_CATEGORY_NAME[catId] || "Vapes Desechables",
                                        flavor_enabled: catalog.length > 0,
                                        flavor_catalog: catalog,                        // ✅ catálogo completo para edición
                                        flavors: catalog.map(x => x.name),              // ✅ todos los sabores como activos por defecto
                                        is_active: true,
                                        source_url: it.source_url || "",
                                    }
                                })

                            // === 👆 Fin de normalización ===

                            setImportPreview(transformed)
                            setImportOpen(true)
                        } catch (err) {
                            console.error(err)
                            alert("No se pudo leer el JSON")
                        } finally {
                            e.target.value = ""
                        }
                    }}


                />
            </div>

            {/* Tabla */}
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
                                <td className="p-2 max-w-xs">
                                    <div className="truncate" title={p.description}>
                                        {p.description || "Sin descripción"}
                                    </div>
                                </td>
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
                                        onClick={() => setForm({
                                            ...p,
                                            flavor_catalog: p.flavor_catalog || (p.flavors || []).map(n => ({ name: n, active: true }))
                                        })}

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

            {/* Modal edición/creación */}
            {form && (
                <form
                    onSubmit={save}
                    className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
                >
                    <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-3 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-semibold">{form.id ? "Editar" : "Nuevo"} Producto</h2>

                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input
                            className="w-full border rounded px-3 py-2"
                            placeholder="Nombre"
                            value={form.name || ""}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                        />

                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción breve</label>
                        <textarea
                            className="w-full border rounded px-3 py-2"
                            placeholder="(no se usa en la web)"
                            rows={2}
                            maxLength={200}
                            value={form.short_description || ""}
                            onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                        />

                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <textarea
                            className="w-full border rounded px-3 py-2"
                            placeholder="Descripción"
                            value={form.description || ""}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />

                        <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                        <input
                            className="w-full border rounded px-3 py-2"
                            placeholder="Marca"
                            value={form.brand || ""}
                            onChange={(e) => setForm({ ...form, brand: e.target.value })}
                        />

                        <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                        <input
                            className="w-full border rounded px-3 py-2"
                            placeholder="Precio"
                            type="number"
                            step="0.01"
                            value={form.price || ""}
                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                            required
                        />

                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                        <input
                            className="w-full border rounded px-3 py-2"
                            placeholder="Stock"
                            type="number"
                            value={form.stock || ""}
                            onChange={(e) => setForm({ ...form, stock: e.target.value })}
                            required
                        />

                        <label className="block text-sm font-medium text-gray-700 mb-1">URL de imagen</label>
                        <input
                            className="w-full border rounded px-3 py-2"
                            placeholder="URL de imagen"
                            value={form.image_url || ""}
                            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                        />

                        <select
                            className="w-full border rounded px-3 py-2"
                            value={form.category_id || ""}
                            onChange={(e) => {
                                const categoryId = parseInt(e.target.value)
                                setForm({
                                    ...form,
                                    category_id: categoryId,
                                    category_name: ID_TO_CATEGORY_NAME[categoryId] || "Vapes Desechables",
                                    flavor_enabled: shouldShowFlavors(categoryId),
                                    flavors: shouldShowFlavors(categoryId) ? (form.flavors || []) : []
                                })
                            }}
                            required
                        >
                            <option value="">Selecciona categoría</option>
                            <option value={1}>Vapes Desechables</option>
                            <option value={2}>Pods</option>
                            <option value={3}>Líquidos</option>
                            <option value={4}>Accesorios</option>
                            <option value={5}>Celulares</option>
                            <option value={6}>Perfumes</option>
                        </select>

                        {/* Sabores solo para 1 y 3 */}
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
                                        <label className="block text-sm font-medium mb-1">Sabores (activar/desactivar)</label>
                                        <FlavorPills
                                            catalog={form.flavor_catalog || (form.flavors || []).map(n => ({ name: n, active: true }))}
                                            onChange={(next) => setForm({
                                                ...form,
                                                flavor_catalog: next,
                                                flavors: next.filter(x => x.active).map(x => x.name)
                                            })}
                                        />
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

            {/* Modal de importación masiva */}
            {importOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Importar productos ({importPreview.length})</h2>
                            <button onClick={() => setImportOpen(false)} className="px-3 py-1 border rounded">Cerrar</button>
                        </div>

                        <div className="border rounded">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-2 text-left">Nombre</th>
                                        <th className="p-2 text-left">Categoría</th>
                                        <th className="p-2 text-left">Precio</th>
                                        <th className="p-2 text-left">Stock</th>
                                        <th className="p-2 text-left">Sabores (catálogo)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {importPreview.map((p, idx) => (
                                        <tr key={idx} className="border-t">
                                            <td className="p-2">{p.name}</td>
                                            <td className="p-2">{p.category_name}</td>
                                            <td className="p-2">${p.price}</td>
                                            <td className="p-2">{p.stock}</td>
                                            <td className="p-2">{p.flavor_catalog?.length || 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setImportOpen(false)} className="px-3 py-2 border rounded">
                                Cancelar
                            </button>
                            <button
                                disabled={importing}
                                onClick={async () => {
                                    try {
                                        setImporting(true)
                                        for (const p of importPreview) {
                                            const active = (p.flavor_catalog || []).filter(x => x.active).map(x => x.name)
                                            const body = {
                                                ...p,
                                                flavors: active,                       // solo los activos se publican
                                                flavor_enabled: p.flavor_catalog.length > 0,
                                                flavor_catalog: p.flavor_catalog       // guardamos el catálogo completo para edición
                                            }

                                            // tu API usa category_id; no necesita category_name
                                            delete body.category_name
                                            const res = await fetch(`${API}/admin/products`, {
                                                method: "POST",
                                                headers: {
                                                    "Content-Type": "application/json",
                                                    "Authorization": `Bearer ${token}`
                                                },
                                                body: JSON.stringify(body)
                                            })
                                            if (!res.ok) {
                                                const err = await res.json().catch(() => ({}))
                                                console.warn("Fallo al crear", p.name, err)
                                            }
                                        }
                                        setImportOpen(false)
                                        setImportPreview([])
                                        fetchAll()
                                        alert("Importación completada")
                                    } catch (e) {
                                        console.error(e)
                                        alert("Error en importación")
                                    } finally {
                                        setImporting(false)
                                    }
                                }}
                                className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {importing ? "Importando..." : `Crear ${importPreview.length} productos`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
