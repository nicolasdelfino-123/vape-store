import { useState } from "react"


export default function TagsInput({ value = [], onChange, placeholder = "Agregar y Enter" }) {
    const [input, setInput] = useState("")

    const add = () => {
        const v = input.trim()
        if (!v) return
        const next = [...new Set([...(value || []), v])]
        onChange?.(next)
        setInput("")
    }

    const remove = (tag) => onChange?.((value || []).filter(t => t !== tag))

    return (
        <div className="border rounded-lg p-2">
            <div className="flex flex-wrap gap-2 mb-2">
                {(value || []).map(tag => (
                    <span key={tag} className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm">
                        {tag}
                        <button type="button" className="text-gray-500 hover:text-gray-700" onClick={() => remove(tag)}>×</button>
                    </span>
                ))}
            </div>
            <div className="flex gap-2">
                <input
                    className="flex-1 rounded border px-3 py-2 text-sm"
                    placeholder={placeholder}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
                />
                <button type="button" onClick={add} className="rounded bg-gray-900 px-3 py-2 text-white text-sm">Agregar</button>
            </div>
        </div>
    )
}
