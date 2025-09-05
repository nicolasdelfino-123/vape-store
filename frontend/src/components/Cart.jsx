import { useContext, useEffect, useRef, useState } from "react";
import { Context } from "../js/store/appContext.jsx";
import { useNavigate, Link } from "react-router-dom";


// helper para título robusto
// reemplazá tu helper por este (arriba del componente)
const getTitle = (it) => String(
  it?.name ??
  it?.product?.name ??
  it?.title ??           // por si todavía tenés algún mock viejo
  "Producto"
);


export default function Cart({ isOpen: controlledOpen, onClose: controlledOnClose }) {
  const { store, actions } = useContext(Context);
  const navigate = useNavigate();


  const isRouteMode = controlledOpen === undefined && controlledOnClose === undefined;
  const [internalOpen, setInternalOpen] = useState(true);

  const isOpen = isRouteMode ? internalOpen : !!controlledOpen;
  const close = () => {
    if (isRouteMode) {
      setInternalOpen(false);
      // pequeño delay para permitir la animación antes de navegar atrás
      setTimeout(() => navigate(-1), 180);
    } else if (controlledOnClose) {
      controlledOnClose();
    }
  };

  const total =
    store.cart?.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0) || 0;

  // UI local para "medios de envío"
  const [postalCode, setPostalCode] = useState("");
  const [pickup, setPickup] = useState(false);

  // Accesibilidad: cerrar con ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && isOpen) close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Focus al abrir
  const closeBtnRef = useRef(null);
  useEffect(() => {
    if (isOpen && closeBtnRef.current) {
      closeBtnRef.current.focus();
    }
  }, [isOpen]);

  // Si no está abierto (drawer), no pinto nada
  if (!isOpen && !isRouteMode) return null;

  // Contenido principal del drawer
  const DrawerContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between p-4 sm:p-5 border-b">
        <h2 className="text-xl sm:text-2xl font-bold">Carrito de compras</h2>
        <button
          ref={closeBtnRef}
          onClick={close}
          aria-label="Cerrar carrito"
          className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
        {!store.cart || store.cart.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            <p className="text-base sm:text-lg">Tu carrito está vacío</p>
            <button
              onClick={() => (isRouteMode ? navigate("/") : close())}
              className="mt-4 w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Ver más productos
            </button>
          </div>
        ) : (
          <>
            {store.cart.map((item) => (
              <div
                key={item.id}
                className="bg-white border rounded-lg p-3 sm:p-4 shadow-sm"
              >
                <div className="flex gap-3">
                  <img
                    src={item.image_url || "/placeholder-product.jpg"}
                    alt={getTitle(item)}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-medium text-sm sm:text-base leading-snug">
                          {getTitle(item)}
                        </h4>


                        <p className="text-gray-900 font-semibold">
                          ${Number(item.price || 0).toLocaleString("es-AR")}
                        </p>
                      </div>

                      <button
                        onClick={() => actions.removeFromCart(item.id)}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="Eliminar producto"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      {/* Controles cantidad */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            actions.updateCartQuantity(
                              item.id,
                              Math.max(1, (item.quantity || 1) - 1)
                            )
                          }
                          aria-label="Disminuir cantidad"
                          className="w-9 h-9 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-lg"
                        >
                          -
                        </button>
                        <span className="min-w-[36px] text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            actions.updateCartQuantity(item.id, (item.quantity || 1) + 1)
                          }
                          aria-label="Aumentar cantidad"
                          className="w-9 h-9 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-lg"
                        >
                          +
                        </button>
                      </div>

                      {/* Total por ítem */}
                      <div className="text-right font-semibold">
                        ${(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString("es-AR")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Subtotal */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-gray-700">
                Subtotal <span className="text-sm text-gray-400">(sin envío)</span> :
              </span>
              <span className="font-semibold">
                ${total.toLocaleString("es-AR")}
              </span>
            </div>

            {/* Medios de envío */}
            <div className="pt-2">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span>Medios de envío</span>
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Tu código postal"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-200"
                />
                <button
                  onClick={() => {
                    // placeholder para tu lógica real de cálculo
                    actions.showToast?.("Cálculo de envío próximamente");
                  }}
                  className="px-4 sm:px-5 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                  CALCULAR
                </button>
              </div>
              <button
                type="button"
                onClick={() => window.open("https://www.correoargentino.com.ar/formularios/cpa", "_blank")}
                className="mt-2 text-sm text-gray-500 underline hover:text-gray-700"
              >
                No sé mi código postal
              </button>
            </div>

            {/* Nuestro local (retiro en tienda) */}
            <div>
              <h3 className="font-semibold mb-2">Nuestro local</h3>
              <label className="flex items-start gap-3 bg-white border rounded-lg p-3 sm:p-4 shadow-sm">
                <input
                  type="checkbox"
                  checked={pickup}
                  onChange={(e) => setPickup(e.target.checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="text-sm sm:text-base">
                    Local Vapeclub - Arturo illia 636
                    <span className="block text-gray-500">
                      Lunes a viernes 10:30hs a 13:00hs | 16:00hs hasta 22:00hs
                      <br />
                      Sábado 13:00hs a 22:00hs | Domingo cerrado
                    </span>
                  </p>
                </div>
                <span className="text-green-600 font-semibold">Gratis</span>
              </label>
            </div>
          </>
        )}
      </div>

      {/* Footer Totales / Acciones */}
      {store.cart && store.cart.length > 0 && (
        <div className="border-t p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xl font-semibold">Total:</span>
            <span className="text-2xl font-bold text-purple-600">
              ${total.toLocaleString("es-AR")}
            </span>
          </div>

          <button
            onClick={() => alert("Iniciar compra (integrar checkout)")}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            INICIAR COMPRA
          </button>

          <div className="mt-4 text-center">
            {isRouteMode ? (
              <Link to="/" className="text-gray-700 underline hover:text-gray-900">
                Ver más productos
              </Link>
            ) : (
              <button
                onClick={close}
                className="text-gray-700 underline hover:text-gray-900"
              >
                Ver más productos
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Si es modo ruta, se muestra como página normal (sin overlay).
  if (isRouteMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto">{DrawerContent}</div>
      </div>
    );
  }

  // Drawer con overlay (modo modal)
  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={close}
      />
      {/* Panel */}
      <aside
        className={`
    absolute right-0 top-0 h-full w-full max-w-md md:max-w-lg bg-white shadow-2xl
    transform transition-transform duration-200
    ${isOpen ? "translate-x-0" : "translate-x-full"}
    flex flex-col
    text-gray-900
  `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
      >
        {DrawerContent}
      </aside>
    </div>
  );
}
