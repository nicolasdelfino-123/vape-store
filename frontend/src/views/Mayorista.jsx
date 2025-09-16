import React, { useState } from "react";

export default function Mayorista() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        message: ""
    });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        setError(null);

        try {
            const payload = {
                name: form.name,
                email: form.email,
                phone: form.phone,
                message: form.message,
                _subject: "Nueva solicitud mayorista",
                _captcha: "false",        // usa captcha de FormSubmit si querés: "true"
                _template: "table",       // email lindo en formato tabla
                _honey: ""                // honeypot (si lo llenan, se descarta)
            };

            //const res = await fetch( "https://formsubmit.co/ajax/email-del-mauri-aca@gmail.com", eso tengo q poner abajo luego
            //y despues reeplazarlo por el codigo q me da formsubmit.co como lo hice acá abajo

            const res = await fetch(
                "https://formsubmit.co/ajax/81e70398f5514885c7164c437eaa10f0",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Accept: "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`Error enviando formulario: ${txt}`);
            }

            setSent(true);
            setForm({ name: "", email: "", phone: "", message: "" });

        } catch (err) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    };


    return (
        <section className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-10">
            {/* Texto a la izquierda */}
            <div>
                <h1 className="text-3xl font-bold mb-6">Solicitud Mayorista</h1>
                <p className="mb-4 text-gray-700 leading-relaxed text-justify">
                    Usted solicitará una lista mayorista para poder acceder a nuestra extensa lista de productos.
                    Esta solicitud será revisada a la brevedad y será notificado para más información.
                    También puede contactarnos directamente usando los datos de la sección Contacto.
                </p>
            </div>

            {/* Formulario */}
            <div>
                {sent ? (
                    <div className="bg-green-100 border border-green-400 text-green-700 p-4 rounded">
                        ¡Gracias! Tu solicitud fue enviada correctamente.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-lg">
                        {/* 👇 Honeypot oculto: evita spam bots */}
                        <input
                            type="text"
                            name="_honey"
                            className="hidden"
                            tabIndex={-1}
                            autoComplete="off"
                        />

                        <input
                            name="name"
                            placeholder="Nombre y Apellido"
                            value={form.name}
                            onChange={handleChange}
                            className="w-full border p-3 rounded"
                            required
                        />
                        <input
                            name="email"
                            type="email"
                            placeholder="Email"
                            value={form.email}
                            onChange={handleChange}
                            className="w-full border p-3 rounded"
                            required
                        />
                        <input
                            name="phone"
                            placeholder="Teléfono"
                            value={form.phone}
                            onChange={handleChange}
                            className="w-full border p-3 rounded"
                        />
                        <textarea
                            name="message"
                            placeholder="Mensaje"
                            value={form.message}
                            onChange={handleChange}
                            className="w-full border p-3 rounded h-32"
                            required
                        />
                        {error && <div className="text-red-600">{error}</div>}
                        <button
                            type="submit"
                            disabled={sending}
                            className="w-full bg-purple-600 text-white py-3 rounded hover:bg-purple-700 transition-colors"
                        >
                            {sending ? "Enviando..." : "Enviar"}
                        </button>
                    </form>
                )}
            </div>
        </section>
    );
}
