import { useState, useMemo } from "react"
import { Menu } from "lucide-react"

const CATEGORIES = [
    { id: 1, name: "Vapes Desechables", slug: "vapes-desechables" },
    { id: 2, name: "Pods Recargables", slug: "pods-recargables" },
    { id: 3, name: "Líquidos", slug: "liquidos" },
    { id: 4, name: "Accesorios", slug: "accesorios" },
    { id: 5, name: "Celulares", slug: "celulares" },
    { id: 6, name: "Perfumes", slug: "perfumes" },
]

export default function SidebarFilters({
    currentCategorySlug,
    onSelectCategory,           // (slug) => void
    priceMin = 0,
    priceMax = 50000,
    price,                      // {min, max}
    onChangePrice,              // ({min,max}) => void
    className = "",
}) {
    const [open, setOpen] = useState(false)

    // valores seguros
    const p = useMemo(() => ({
        min: Math.max(priceMin, Math.min(price?.min ?? priceMin, priceMax)),
        max: Math.min(priceMax, Math.max(price?.max ?? priceMax, priceMin)),
    }), [priceMin, priceMax, price])

    // handlers con CLAMP para que min <= max y max >= min
    const setMin = (val) => {
        const v = Math.max(priceMin, Math.min(Number(val), p.max))
        onChangePrice?.({ min: v, max: p.max })
    }
    const setMax = (val) => {
        const v = Math.min(priceMax, Math.max(Number(val), p.min))
        onChangePrice?.({ min: p.min, max: v })
    }

    const body = (
        <div className="w-64 max-w-[80vw] bg-white h-full border-r p-4 space-y-6">
            <div className="md:hidden flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Filtros</h3>
                <button onClick={() => setOpen(false)} className="px-3 py-1 border rounded">Cerrar</button>
            </div>

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

                    {/* inputs numéricos por si el usuario quiere teclear */}
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
        </div>
    )

    return (
        <aside className={className}>
            {/* Botón hamburguesa solo en mobile */}
            <div className="md:hidden mb-3">
                <button
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 border rounded-md"
                >
                    <Menu size={18} />
                    Filtros
                </button>
            </div>

            {/* Lateral fijo en desktop */}
            <div className="hidden md:block sticky top-4">{body}</div>

            {/* Drawer en mobile */}
            {open && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
                    <div className="absolute left-0 top-0 h-full">{body}</div>
                </div>
            )}
        </aside>
    )
}
