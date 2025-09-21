import { useEffect } from 'react'

export default function Toast({ message, isVisible, onClose, duration = 3000 }) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose()
            }, duration)
            return () => clearTimeout(timer)
        }
    }, [isVisible, onClose, duration])

    if (!isVisible) return null

    return (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 max-w-md">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium flex-1">{message}</span>
                <button
                    onClick={onClose}
                    className="flex-shrink-0 p-1 rounded-full hover:bg-green-600 hover:bg-opacity-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 bg-transparent border-0"
                    aria-label="Cerrar notificación"
                >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    )
}