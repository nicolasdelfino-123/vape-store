import { useState, useMemo } from "react"
import { Menu, X } from "lucide-react"

const CATEGORIES = [
    { id: 1, name: "Vapes Desechables", slug: "vapes-desechables" },
    { id: 2, name: "Pods Recargables", slug: "pods-recargables" },
    { id: 3, name: "Líquidos", slug: "liquidos" },
    { id: 4, name: "Resistencias", slug: "resistencias" },   // ✅ corregido
    { id: 5, name: "Celulares", slug: "celulares" },
    { id: 6, name: "Perfumes", slug: "perfumes" },
];


// normalizador simple (lowercase + sin tildes + colapsa espacios)
const norm = (s = "") =>
    String(s)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ")

export default function SidebarFilters({
    currentCategorySlug,
    onSelectCategory,

    // Precio
    priceMin = 0,
    priceMax = 50000,
    price,                      // {min, max}
    onChangePrice,

    className = "",

    // Fabricantes
    brandOptions = [],          // [{ key, label, count }]
    selectedBrands = [],        // ["ignite","elfbar"]
    onToggleBrand = () => { },
    onClearBrands = () => { },

    // Puffs
    puffsOptions = [],          // [{ value, label, count }]
    selectedPuffs = [],
    onTogglePuffs = () => { },
    onClearPuffs = () => { },

    // Sabores
    flavorOptions = [],         // [{ value, label, count }]
    selectedFlavors = [],       // ["aloe grape ice", ...] (normalizados desde ProductGrid)
    onToggleFlavor = () => { },
    onClearFlavors = () => { },
}) {
    const [open, setOpen] = useState(false)
    const [flavorSearch, setFlavorSearch] = useState("")

    const p = useMemo(() => ({
        min: Math.max(priceMin, Math.min(price?.min ?? priceMin, priceMax)),
        max: Math.min(priceMax, Math.max(price?.max ?? priceMax, priceMin)),
    }), [priceMin, priceMax, price])

    const setMin = (val) => {
        const v = Math.max(priceMin, Math.min(Number(val), p.max))
        onChangePrice?.({ min: v, max: p.max })
    }
    const setMax = (val) => {
        const v = Math.min(priceMax, Math.max(Number(val), p.min))
        onChangePrice?.({ min: p.min, max: v })
    }

    // Filtrado local de la lista de sabores según el buscador
    const filteredFlavorOptions = useMemo(() => {
        const list = Array.isArray(flavorOptions) ? flavorOptions : []
        const q = norm(flavorSearch)
        if (!q) return list
        const tokens = q.split(" ").filter(Boolean)
        return list.filter(({ value, label }) => {
            const haystack = norm(label || value)
            return tokens.every(t => haystack.includes(t))
        })
    }, [flavorOptions, flavorSearch])

    // Calcular si hay filtros activos
    const hasActiveFilters = useMemo(() => {
        return selectedBrands.length > 0 ||
            selectedPuffs.length > 0 ||
            selectedFlavors.length > 0 ||
            (price?.min && price.min > priceMin) ||
            (price?.max && price.max < priceMax)
    }, [selectedBrands, selectedPuffs, selectedFlavors, price, priceMin, priceMax])

    // Generar etiquetas de filtros activos
    const getActiveFilterTags = () => {
        const tags = []

        // Marcas
        selectedBrands.forEach(brandKey => {
            const brand = brandOptions.find(b => b.key === brandKey)
            if (brand) {
                tags.push({
                    type: 'brand',
                    key: brandKey,
                    label: `Marca: ${brand.label}`,
                    onRemove: () => onToggleBrand(brandKey)
                })
            }
        })

        // Puffs
        selectedPuffs.forEach(puffValue => {
            tags.push({
                type: 'puff',
                key: puffValue,
                label: `${puffValue} puffs`,
                onRemove: () => onTogglePuffs(puffValue)
            })
        })

        // Sabores
        selectedFlavors.forEach(flavorValue => {
            const flavor = flavorOptions.find(f => f.value === flavorValue)
            if (flavor) {
                tags.push({
                    type: 'flavor',
                    key: flavorValue,
                    label: `Sabor: ${flavor.label}`,
                    onRemove: () => onToggleFlavor(flavorValue)
                })
            }
        })

        // Precio
        if ((price?.min && price.min > priceMin) || (price?.max && price.max < priceMax)) {
            const isCustomMin = price?.min && price.min > priceMin
            const isCustomMax = price?.max && price.max < priceMax

            let priceLabel = "Precio: "
            if (isCustomMin && isCustomMax) {
                priceLabel += `$${price.min.toLocaleString("es-AR")} - $${price.max.toLocaleString("es-AR")}`
            } else if (isCustomMin) {
                priceLabel += `Desde $${price.min.toLocaleString("es-AR")}`
            } else if (isCustomMax) {
                priceLabel += `Hasta $${price.max.toLocaleString("es-AR")}`
            }

            tags.push({
                type: 'price',
                key: 'price',
                label: priceLabel,
                onRemove: () => onChangePrice?.({ min: priceMin, max: priceMax })
            })
        }

        return tags
    }

    const clearAllFilters = () => {
        onClearBrands()
        onClearPuffs()
        onClearFlavors()
        onChangePrice?.({ min: priceMin, max: priceMax })
    }

    // ⚠️ sin h-full (rompe sticky); nada de overflow aquí
    const body = (
        <div className="w-64 max-w-[80vw] bg-white border-r p-4 space-y-6">
            <div className="md:hidden flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Filtros</h3>
                <button onClick={() => setOpen(false)} className="px-3 py-1 border rounded">Cerrar</button>
            </div>

            {/* Etiquetas de filtros activos */}
            {hasActiveFilters && (
                <div className="border-b pb-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">Filtros activos</h4>
                        <button
                            onClick={clearAllFilters}
                            className="text-xs text-purple-600 hover:text-purple-800 underline"
                        >
                            Limpiar todos
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {getActiveFilterTags().map((tag) => (
                            <div
                                key={`${tag.type}-${tag.key}`}
                                className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm border"
                            >
                                <span className="max-w-[120px] truncate">{tag.label}</span>
                                <button
                                    onClick={tag.onRemove}
                                    className="text-gray-500 hover:text-gray-700 flex-shrink-0"
                                    title="Remover filtro"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Categorías */}
            <div>
                <h4 className="text-sm font-semibold mb-2 uppercase tracking-wide">Categorías</h4>
                <ul className="space-y-2">
                    {CATEGORIES.map(c => {
                        const active = c.slug === currentCategorySlug
                        return (
                            <li key={c.slug}>
                                <button
                                    onClick={() => { onSelectCategory?.(c.slug); setOpen(false) }}
                                    className={`w-full text-left px-2 py-1 rounded hover:bg-gray-100 ${active ? "bg-gray-100 font-medium" : ""}`}
                                >
                                    {c.name}
                                </button>
                            </li>
                        )
                    })}
                </ul>
            </div>

            {/* Precio */}
            <div>
                <h4 className="text-sm font-semibold mb-2 uppercase tracking-wide">Filtrar por precio</h4>

                <div className="flex items-center justify-between text-sm mb-2">
                    <span>${p.min.toLocaleString("es-AR")}</span>
                    <span>${p.max.toLocaleString("es-AR")}</span>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-gray-600">Mínimo</label>
                        <input
                            type="range"
                            min={priceMin}
                            max={priceMax}
                            step={100}
                            value={p.min}
                            onChange={(e) => setMin(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-600">Máximo</label>
                        <input
                            type="range"
                            min={priceMin}
                            max={priceMax}
                            step={100}
                            value={p.max}
                            onChange={(e) => setMax(e.target.value)}
                            className="w-full"
                        />
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="number"
                            className="w-1/2 border rounded px-2 py-1"
                            min={priceMin}
                            max={p.max}
                            value={p.min}
                            onChange={(e) => setMin(e.target.value)}
                        />
                        <input
                            type="number"
                            className="w-1/2 border rounded px-2 py-1"
                            min={p.min}
                            max={priceMax}
                            value={p.max}
                            onChange={(e) => setMax(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Fabricante */}
            {brandOptions.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold mb-2 uppercase tracking-wide">Fabricante</h4>

                    {selectedBrands.length > 0 && (
                        <button
                            type="button"
                            onClick={onClearBrands}
                            className="text-xs text-purple-600 hover:underline mb-2"
                            title="Limpiar selección"
                        >
                            Limpiar selección
                        </button>
                    )}

                    <div className="space-y-2 max-h-56 overflow-auto pr-1 border rounded p-2">
                        {brandOptions.map(({ key, label, count }) => {
                            const checked = selectedBrands.includes(key)
                            return (
                                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => onToggleBrand(key)}
                                        className="rounded border-gray-300"
                                    />
                                    <span className="flex-1">
                                        {label} <span className="text-gray-500">({count})</span>
                                    </span>
                                </label>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Puffs */}
            {puffsOptions.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold mb-2 uppercase tracking-wide">Puffs</h4>

                    {selectedPuffs.length > 0 && (
                        <button
                            type="button"
                            onClick={onClearPuffs}
                            className="text-xs text-purple-600 hover:underline mb-2"
                            title="Limpiar selección"
                        >
                            Limpiar selección
                        </button>
                    )}

                    <div className="space-y-2 max-h-56 overflow-auto pr-1 border rounded p-2">
                        {puffsOptions.map(({ value, label, count }) => {
                            const numeric = Number(value)
                            const checked = selectedPuffs.includes(numeric)
                            return (
                                <label key={numeric} className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => onTogglePuffs(numeric)}
                                        className="rounded border-gray-300"
                                    />
                                    <span className="flex-1">
                                        {label} puffs <span className="text-gray-500">({count})</span>
                                    </span>
                                </label>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Sabores */}
            {flavorOptions.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold mb-2 uppercase tracking-wide">Sabores</h4>

                    <div className="flex items-center justify-between mb-2">
                        {selectedFlavors.length > 0 ? (
                            <button
                                type="button"
                                onClick={onClearFlavors}
                                className="text-xs text-purple-600 hover:underline"
                                title="Limpiar selección"
                            >
                                Limpiar selección
                            </button>
                        ) : <span className="text-xs text-gray-500">Seleccioná uno o más</span>}
                    </div>

                    {/* 🔎 Buscador local de sabores */}
                    <div className="mb-2">
                        <input
                            type="text"
                            value={flavorSearch}
                            onChange={(e) => setFlavorSearch(e.target.value)}
                            placeholder="Buscar sabor..."
                            className="w-full border rounded px-2 py-1 text-sm"
                        />
                    </div>

                    <div className="space-y-2 max-h-56 overflow-auto pr-1 border rounded p-2">
                        {filteredFlavorOptions.length === 0 && (
                            <div className="text-xs text-gray-500 px-1">Sin resultados</div>
                        )}
                        {filteredFlavorOptions.map(({ value, label, count }) => {
                            const checked = selectedFlavors.includes(value)
                            return (
                                <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => onToggleFlavor(value)}
                                        className="rounded border-gray-300"
                                    />
                                    <span className="flex-1">
                                        {label} <span className="text-gray-500">({count})</span>
                                    </span>
                                </label>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )

    return (
        <>
            <style>{`
      /* Firefox */
      #sf-scroll { scrollbar-width: thin; scrollbar-color: #e5e7eb transparent; }
      /* WebKit (Chrome/Edge/Brave/Opera) */
      #sf-scroll::-webkit-scrollbar { width: 10px; }
      #sf-scroll::-webkit-scrollbar-track { background: transparent; }
      #sf-scroll::-webkit-scrollbar-thumb {
        background: #e5e7eb;           /* gris clarito */
        border-radius: 9999px;
        border: 2px solid transparent; /* se ve más finito */
        background-clip: content-box;
      }
      #sf-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
    `}</style>

            <aside className={className}>
                {/* Botón hamburguesa (mobile) */}
                <div className="md:hidden mb-3">
                    <button
                        onClick={() => setOpen(true)}
                        className="inline-flex items-center gap-2 px-3 py-2 border rounded-md"
                    >
                        <Menu size={18} />
                        Filtros
                        {hasActiveFilters && (
                            <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                                {getActiveFilterTags().length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Desktop: sticky + propia barra de scroll */}
                <div className="hidden md:block">
                    <div
                        id="sf-scroll"
                        className="md:sticky md:top-4 md:max-h-[calc(100vh-2rem)] md:overflow-auto"
                    >
                        {body}
                    </div>
                </div>

                {/* Drawer mobile (scroll interno) */}
                {open && (
                    <div className="fixed inset-0 z-50 md:hidden">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
                        <div id="sf-scroll" className="absolute left-0 top-0 h-full overflow-auto">
                            {body}
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
}