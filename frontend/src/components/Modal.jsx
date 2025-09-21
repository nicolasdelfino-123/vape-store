// src/components/Modal.jsx
import React, { useEffect } from "react";

export default function Modal({
    open = false,
    onClose = () => { },
    title = "",
    body = "",
    confirmText = "Entendido",
}) {
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        if (open) window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
            />
            <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-gray-600">{body}</p>
                <div className="mt-4 text-right">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
