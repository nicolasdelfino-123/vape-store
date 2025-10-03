// src/components/Spinner.jsx
import { useState, useEffect } from 'react';
import spinner from "@/assets/spinner.gif";

export default function Spinner({ images = [], minDelay = 500, onLoadComplete }) {
    const [loading, setLoading] = useState(true);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const startTime = Date.now();

        const loadImages = images.map(src => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(src);
                img.onerror = () => resolve(src);
                img.src = src;
            });
        });

        Promise.all(loadImages).then(() => {
            if (!isMounted) return;

            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, minDelay - elapsed);

            setTimeout(() => {
                if (!isMounted) return;

                if (onLoadComplete) onLoadComplete();

                setFadeOut(true);

                setTimeout(() => {
                    if (isMounted) setLoading(false);
                }, 3200);

            }, remaining);
        });

        return () => {
            isMounted = false;
        };
    }, [images, minDelay, onLoadComplete]);

    if (!loading) return null;

    return (
        <div
            className={`fixed inset-0 flex items-center justify-center bg-white z-[9999] transition-opacity duration-1500 ${fadeOut ? 'opacity-0' : 'opacity-100'
                }`}
        >
            <img src={spinner} alt="Cargando..." className="w-24 h-24" />
        </div>
    );
}