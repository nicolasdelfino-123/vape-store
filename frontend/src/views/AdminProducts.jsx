import { useEffect, useRef, useState } from "react"



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

const sumActiveFlavorStock = (catalog = []) =>
    (catalog || [])
        .filter((x) => x?.active)
        .reduce((acc, x) => acc + (Number.isFinite(Number(x?.stock)) ? Number(x.stock) : 0), 0)

// ----- Píldoras/lista de sabores con ACTIVO y STOCK -----
function FlavorPills({ catalog = [], onChange }) {
    const [input, setInput] = useState("")

    const normalize = (arr) =>
        (arr || []).map((f) => ({
            name: String(f?.name ?? f ?? "").trim(),
            active: Boolean(f?.active ?? true),
            stock: Number.isFinite(Number(f?.stock)) ? Number(f.stock) : 0,
        }))

    const ensure = (next) => onChange(normalize(next))

    const toggle = (idx) => {
        const next = [...catalog]
        next[idx] = { ...next[idx], active: !next[idx].active }
        ensure(next)
    }

    const remove = (idx) => {
        const next = catalog.filter((_, i) => i !== idx)
        ensure(next)
    }

    const changeName = (idx, name) => {
        const next = [...catalog]
        next[idx] = { ...next[idx], name }
        ensure(next)
    }

    const changeStock = (idx, stock) => {
        // Forzamos número entero >= 0
        const nRaw = Number(stock);
        const n = Number.isFinite(nRaw) ? Math.max(0, Math.floor(nRaw)) : 0;
        const next = [...catalog];
        next[idx] = { ...next[idx], stock: n };
        ensure(next);
    };


    const add = () => {
        const t = input.trim()
        if (!t) return
        ensure([...(catalog || []), { name: t, active: true, stock: 0 }])
        setInput("")
    }

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <input
                    className="flex-1 border rounded px-2 py-1"
                    placeholder="Agregar sabor y presionar Enter"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => (e.key === "Enter" ? (e.preventDefault(), add()) : null)}
                />
                <button type="button" onClick={add} className="px-3 py-1 border rounded">
                    Agregar
                </button>
            </div>

            <div className="border rounded">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-2 text-left">Activo</th>
                            <th className="p-2 text-left">Sabor</th>
                            <th className="p-2 text-left">Stock</th>
                            <th className="p-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {normalize(catalog).map((f, idx) => (
                            <tr key={idx} className="border-t">
                                <td className="p-2">
                                    <input type="checkbox" checked={f.active} onChange={() => toggle(idx)} />
                                </td>
                                <td className="p-2">
                                    <input
                                        className="w-full border rounded px-2 py-1"
                                        value={f.name}
                                        onChange={(e) => changeName(idx, e.target.value)}
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        className="w-28 border rounded px-2 py-1 text-right"
                                        type="number"
                                        min={0}
                                        step={1}
                                        value={f.stock}
                                        onChange={(e) => changeStock(idx, e.target.value)}
                                    />
                                </td>
                                <td className="p-2 text-right">
                                    <button
                                        type="button"
                                        onClick={() => remove(idx)}
                                        className="px-2 py-1 border rounded text-gray-600 hover:bg-gray-50"
                                        title="Quitar sabor"
                                    >
                                        🗑
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {(!catalog || catalog.length === 0) && (
                            <tr>
                                <td colSpan={4} className="p-3 text-center text-gray-500">
                                    Sin sabores cargados
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <p className="text-xs text-gray-500">
                Solo los <strong>activos</strong> se publican en la web. El stock por sabor se usa si activás el modo “stock por sabor”.
            </p>
        </div>
    )
}

// arriba, junto a otros useRef/useState:
const API = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "") || "";

// Normaliza paths viejos
const normalizeImagePath = (u = "") => {
    if (!u) return "";
    // corrige cosas antiguas
    if (u.startsWith("/admin/uploads/")) u = u.replace("/admin", "/public");
    if (u.startsWith("/uploads/")) u = `/public${u}`; // si alguna vez vino sin /public
    return u;
};

// Convierte relativo → absoluto
// Debe quedar exactamente así:
const toAbsUrl = (u = "") => {
    u = normalizeImagePath(u);
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;        // http(s) ya absoluto

    // ✅ SOLO assets del backend (tu server) van con API
    if (u.startsWith("/public/")) return `${API}${u}`;

    // ✅ Cualquier otro absoluto (p.ej. "/sin_imagen.jpg" en frontend) se deja igual
    if (u.startsWith("/")) return u;

    // 🧩 Relativo sin barra: si lo usás, asumimos backend
    return `${API}/${u}`;
};

const uniqPush = (arr = [], url = "") => {
    const u = normalizeImagePath(url);
    const set = new Set([...(arr || []), u]);
    return Array.from(set);
};




// ----- Componente principal -----
export default function AdminProducts() {
    const [products, setProducts] = useState([])
    const [categories] = useState(["Vapes Desechables", "Pods", "Líquidos", "Accesorios", "Celulares", "Perfumes"])
    const [form, setForm] = useState(null)
    const [q, setQ] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("Todos")
    // antes: const imgInputRef = useRef(null);
    const mainImgInputRef = useRef(null);
    const galImgInputRef = useRef(null);


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
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                const data = await res.json()
                setProducts(data || [])
            }
        } catch (error) {
            console.error("Error fetching products:", error)
        }
    }

    useEffect(() => {
        fetchAll()
    }, [])

    const uploadImage = async (file, { asMain = false } = {}) => {
        try {
            const fd = new FormData();
            fd.append("image", file);
            if (form?.id) fd.append("product_id", String(form.id)); // asocia a producto
            if (asMain) fd.append("as_main", "1");                   // marcar como principal en backend

            const res = await fetch(`${API}/admin/upload`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            const data = await res.json();
            if (!res.ok || !data?.url) throw new Error(data?.error || "No se pudo subir");

            // Refresca estado local: suma a galería y opcionalmente setea principal
            setForm((prev) => {
                if (!prev) return prev;
                const u = normalizeImagePath(data.url);
                return {
                    ...prev,
                    image_url: (asMain || !prev.image_url) ? u : prev.image_url,
                    image_urls: uniqPush(prev.image_urls, u),
                };
            });
        } catch (e) {
            console.error(e);
            alert("No se pudo subir la imagen");
        }
    };



    const shouldShowFlavors = (categoryId) => [1, 3].includes(Number(categoryId))

    const save = async (e) => {
        e.preventDefault()
        try {
            const method = form.id ? "PUT" : "POST"
            const url = form.id ? `${API}/admin/products/${form.id}` : `${API}/admin/products`

            // Normalizamos catálogo
            const catalog = (form.flavor_catalog || []).map((x) => ({
                name: String(x?.name ?? "").trim(),
                active: Boolean(x?.active ?? true),
                stock: Number.isFinite(Number(x?.stock)) ? Number(x.stock) : 0,
            }))

            const activeFlavors = catalog.filter((x) => x.active).map((x) => x.name)
            const enabled = shouldShowFlavors(form.category_id) && activeFlavors.length > 0

            // Si está activado el modo, el stock total se calcula como suma de los activos
            const totalFromFlavors = sumActiveFlavorStock(catalog)
            const finalStock = form.flavor_stock_mode ? totalFromFlavors : Number(form.stock ?? 0)
            // 🔒 Sanitiza y evita valores tipo "frutal" que causarían GET /frutal
            const normalizedImageUrl = (() => {
                const u = String(form.image_url || "").trim();
                if (!u) return "";
                if (/^https?:\/\//i.test(u)) return u;        // URL completa OK
                if (u.startsWith("/")) return normalizeImagePath(u); // relativo válido → normaliza /public
                return "";                                     // invalida textos sueltos (evita 404 /frutal)
            })();
            const { image_urls, ...cleanForm } = form;
            const payload = {
                ...cleanForm,
                image_url: normalizedImageUrl,   // ← guardás siempre relativo correcto
                short_description: form.short_description ?? "",
                flavors: activeFlavors,
                flavor_enabled: enabled,
                flavor_catalog: catalog, // guardamos el catálogo completo con stock
                stock: finalStock, // stock total coherente
                flavor_stock_mode: Boolean(form.flavor_stock_mode), // flag para front/backend
            }

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            })

            if (res.ok) {
                setForm(null)
                fetchAll()
                alert(form.id ? "Producto actualizado" : "Producto creado exitosamente")
            } else {
                const error = await res.json().catch(() => ({}))
                alert(`Error: ${error.error || "No se pudo guardar el producto"}`)
            }
        } catch (error) {
            console.error("Error saving product:", error)
            alert("Error al guardar producto")
        }
    }

    const filtered = products.filter((p) => {
        const matchesSearch =
            !q || p.name?.toLowerCase().includes(q.toLowerCase()) || p.brand?.toLowerCase().includes(q.toLowerCase())
        const matchesCategory = selectedCategory === "Todos" || p.category_name === selectedCategory
        return matchesSearch && matchesCategory
    })

    // 👇 Sincroniza el stock general cuando el modo por sabor está activo
    useEffect(() => {
        if (!form) return
        if (form.flavor_stock_mode) {
            const total = sumActiveFlavorStock(form.flavor_catalog || [])
            if (Number(form.stock) !== total) {
                setForm(prev => ({ ...prev, stock: total }))
            }
        }
    }, [form?.flavor_catalog, form?.flavor_stock_mode])


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
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
                <button
                    onClick={() => setForm({
                        category_id: 1,
                        flavor_stock_mode: false,
                        flavor_catalog: [],   // 👈 importante: lista vacía para poder agregar sabores
                        flavors: [],
                        is_active: true,
                        // 👇 DEFAULT DE IMAGEN (ruta servida por tu backend)
                        image_url: "/sin_imagen.jpg",
                        image_urls: [],
                    })}
                    className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
                >
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
                            const cleanName = (n) => n.replace(/\s+/g, " ").trim().toLowerCase()
                            const existingNames = new Set(products.map((p) => cleanName(p.name)))

                            const transformed = (raw || [])
                                .filter((it) => !existingNames.has(cleanName(it.name || "")))
                                .map((it) => {
                                    const catId = it.category_id || mapCategoryId(it.category_name)
                                    const catalog = (it.flavors || []).map((f) => ({ name: String(f), active: true, stock: 0 })) // activos + stock 0
                                    return {
                                        id: undefined,
                                        name: it.name || "",
                                        description: it.description || "", // ✅ traer descripción real
                                        short_description: it.short_description || "", // ✅ traer short description real
                                        brand: it.brand || "",
                                        price: it.price || 0,
                                        stock: it.stock || 0,
                                        image_url: it.image_url || "",
                                        category_id: catId,
                                        category_name: ID_TO_CATEGORY_NAME[catId] || "Vapes Desechables",
                                        flavor_enabled: catalog.length > 0,
                                        flavor_catalog: catalog, // ✅ catálogo completo para edición
                                        flavors: catalog.map((x) => x.name), // ✅ todos los sabores como activos por defecto
                                        flavor_stock_mode: false, // por defecto
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
                            <th className="p-2 text-left">Descripción corta</th>
                            <th className="p-2 text-left">Descripción larga</th>
                            <th className="p-2">Precio</th>
                            <th className="p-2">Stock</th>
                            <th className="p-2">Categoría</th>
                            <th className="p-2">Sabores</th>
                            <th className="p-2">Estado</th>
                            <th className="p-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((p) => (
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
                                <td className="p-2 text-center">
                                    {form && form.id === p.id && form.flavor_stock_mode
                                        ? sumActiveFlavorStock(form.flavor_catalog || [])
                                        : p.stock}
                                </td>

                                <td className="p-2 text-center">{p.category_name}</td>
                                <td className="p-2 text-center">
                                    {p.flavor_enabled ? (
                                        <span
                                            className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                                            title="activos / con stock"
                                        >
                                            {p.flavors?.length || 0} sabores ·{" "}
                                            {(p.flavor_catalog || []).filter((x) => x?.active && Number(x?.stock) > 0).length} con stock
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-500">Sin sabores</span>
                                    )}
                                </td>
                                <td className="p-2 text-center">
                                    <span
                                        className={`px-2 py-1 rounded text-xs ${p.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                            }`}
                                    >
                                        {p.is_active ? "Activo" : "Inactivo"}
                                    </span>
                                </td>
                                <td className="p-2 text-right">
                                    <button
                                        onClick={() => {
                                            let catalog = Array.isArray(p.flavor_catalog) ? p.flavor_catalog : [];
                                            if ((!catalog || catalog.length === 0) && Array.isArray(p.flavors) && p.flavors.length > 0) {
                                                catalog = p.flavors.map((n) => ({ name: n, active: true, stock: 0 }));
                                            }
                                            if (!Array.isArray(catalog)) catalog = [];

                                            const flavorStockMode = Boolean(p?.flavor_stock_mode ?? false);
                                            const sum = sumActiveFlavorStock(catalog);

                                            // 👇 si no tiene imagen cargada, asignamos default
                                            const safeImage = (p.image_url && String(p.image_url).trim())
                                                ? p.image_url
                                                : "/public/img/sin_imagen.jpg";

                                            setForm({
                                                ...p,
                                                image_url: safeImage,                    // 👈 default en edición
                                                image_urls: Array.isArray(p.image_urls) ? p.image_urls : (safeImage ? [safeImage] : []),
                                                flavor_catalog: catalog,
                                                flavor_enabled: p.flavor_enabled ?? (catalog.length > 0),
                                                flavor_stock_mode: flavorStockMode,
                                                stock: flavorStockMode ? sum : (Number.isFinite(Number(p.stock)) ? Number(p.stock) : 0),
                                            });
                                        }}
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

            {filtered.length === 0 && <div className="text-center py-8 text-gray-500">No se encontraron productos</div>}

            {/* Modal edición/creación */}
            {form && (
                <form onSubmit={save} className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
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

                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción larga</label>
                        <textarea
                            className="w-full border rounded px-3 py-2"
                            placeholder="(descripción detallada del producto)"
                            rows={2}
                            maxLength={40000}
                            value={form.short_description || ""}
                            onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                        />

                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción corta</label>
                        <textarea
                            className="w-full border rounded px-3 py-2"
                            placeholder="Descripción breve (se muestra debajo del precio)"
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

                        {/* Toggle modo stock por sabor (solo si hay sabores/categoría aplica) */}
                        {shouldShowFlavors(form.category_id) && (
                            <>
                                {/* ÚNICO checkbox de modo por sabor */}
                                <label className="flex items-center gap-2 mb-2">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(form.flavor_stock_mode)}
                                        onChange={(e) => {
                                            const checked = e.target.checked
                                            setForm(prev => {
                                                const safeCatalog = Array.isArray(prev.flavor_catalog) ? prev.flavor_catalog : []
                                                return {
                                                    ...prev,
                                                    flavor_stock_mode: checked,
                                                    // al activarlo, habilitamos editor y sincronizamos stock
                                                    flavor_enabled: checked ? true : prev.flavor_enabled,
                                                    flavor_catalog: safeCatalog, // asegura array para poder agregar sabores
                                                    stock: checked ? sumActiveFlavorStock(safeCatalog) : prev.stock,
                                                }
                                            })
                                        }}
                                    />
                                    Usar stock por sabor (recomendado si cada sabor tiene stock propio)
                                </label>

                                {/* Editor de sabores: visible SOLO si el modo por sabor está activo */}
                                {form.flavor_stock_mode && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium mb-1">
                                            Sabores (activar/desactivar y stock)
                                        </label>

                                        <FlavorPills
                                            catalog={Array.isArray(form.flavor_catalog)
                                                ? form.flavor_catalog
                                                : (form.flavors || []).map((n) => ({ name: n, active: true, stock: 0 }))
                                            }
                                            onChange={(next) =>
                                                setForm(prev => {
                                                    const activos = next.filter(x => x.active)
                                                    const total = sumActiveFlavorStock(next)
                                                    return {
                                                        ...prev,
                                                        flavor_catalog: next,
                                                        flavors: activos.map(x => x.name),
                                                        stock: prev.flavor_stock_mode ? total : prev.stock,
                                                    }
                                                })
                                            }
                                        />

                                        <div className="text-xs text-gray-600">
                                            Total (activos): <strong>{sumActiveFlavorStock(form.flavor_catalog || [])}</strong> unidades
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Stock general: solo visible si NO usamos stock por sabor */}
                        {!form.flavor_stock_mode && (
                            <>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                                <input
                                    className="w-full border rounded px-3 py-2"
                                    placeholder="Stock"
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={Number.isFinite(Number(form.stock)) ? form.stock : 0}
                                    onChange={(e) => {
                                        const n = Math.max(0, Math.floor(Number(e.target.value) || 0))
                                        setForm({ ...form, stock: n })
                                    }}
                                    required
                                />
                            </>
                        )}

                        <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del producto</label>

                        <div className="flex gap-2">
                            <input
                                className="w-full border rounded px-3 py-2"
                                placeholder="URL de imagen (opcional si subís una)"
                                value={form.image_url || ""}
                                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                            />

                            {/* Subir PRINCIPAL */}
                            <input
                                ref={mainImgInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) uploadImage(f, { asMain: true });
                                    e.target.value = "";
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => mainImgInputRef.current?.click()}
                                className="px-3 py-2 border rounded hover:bg-gray-50 shrink-0"
                                title="Subir como principal"
                            >
                                Subir principal
                            </button>

                            {/* Agregar a GALERÍA */}
                            <input
                                ref={galImgInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) uploadImage(f, { asMain: false });
                                    e.target.value = "";
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => galImgInputRef.current?.click()}
                                className="px-3 py-2 border rounded hover:bg-gray-50 shrink-0"
                                title="Agregar a galería"
                            >
                                Agregar foto
                            </button>
                        </div>


                        {/* Preview de imagen (compatible con /public/img/<id>), 1:1 sin recortes */}
                        <div className="mt-2">
                            <img
                                src={toAbsUrl(form.image_url) || `/sin_imagen.jpg`}
                                alt="Preview"
                                className="block w-full h-auto max-h-44 object-contain border rounded"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => { e.currentTarget.src = `/sin_imagen.jpg`; }}
                            />
                        </div>

                        {Array.isArray(form.image_urls) && form.image_urls.length > 0 && (
                            <div className="mt-2">
                                <div className="text-xs text-gray-600 mb-1">Galería (clic para principal)</div>
                                <div className="flex flex-wrap gap-2">
                                    {form.image_urls.map((u, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setForm((prev) => ({ ...prev, image_url: u }))}
                                            className={`border rounded p-0.5 ${form.image_url === u ? "ring-2 ring-purple-500" : ""}`}
                                            title="Hacer principal"
                                        >
                                            <img
                                                src={toAbsUrl(u)}
                                                className="w-16 h-16 object-contain"
                                                alt=""
                                                loading="lazy"
                                                onError={(e) => { e.currentTarget.src = `/sin_imagen.jpg`; }}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}




                        <select
                            className="w-full border rounded px-3 py-2"
                            value={form.category_id || ""}
                            onChange={(e) => {
                                const categoryId = parseInt(e.target.value)
                                const show = shouldShowFlavors(categoryId)
                                setForm({
                                    ...form,
                                    category_id: categoryId,
                                    category_name: ID_TO_CATEGORY_NAME[categoryId] || "Vapes Desechables",
                                    flavor_enabled: show,
                                    flavors: show ? form.flavors || [] : [],
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
                            <button onClick={() => setImportOpen(false)} className="px-3 py-1 border rounded">
                                Cerrar
                            </button>
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
                                            const active = (p.flavor_catalog || []).filter((x) => x.active).map((x) => x.name)
                                            const body = {
                                                ...p,
                                                flavors: active, // solo los activos se publican
                                                flavor_enabled: p.flavor_catalog.length > 0,
                                                flavor_catalog: p.flavor_catalog, // guardamos el catálogo completo para edición
                                                flavor_stock_mode: false,
                                            }

                                            // tu API usa category_id; no necesita category_name
                                            delete body.category_name
                                            const res = await fetch(`${API}/admin/products`, {
                                                method: "POST",
                                                headers: {
                                                    "Content-Type": "application/json",
                                                    Authorization: `Bearer ${token}`,
                                                },
                                                body: JSON.stringify(body),
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
