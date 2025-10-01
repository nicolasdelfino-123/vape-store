import React, { useContext, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import injectContext, { Context } from "./js/store/appContext.jsx";

// Vistas existentes
import Home from "./views/Home";
import Register from "./views/Register.jsx";
import Login from "./views/Login.jsx";
import SetupPassword from "./views/SetupPassword.jsx";
import ResetPassword from "./views/ResetPassword.jsx";
import Logout from "./views/Logout.jsx";
import Inicio from "./views/Inicio.jsx";

import ProductDetail from "./views/ProductDetail.jsx";
import Footer from "./components/Footer.jsx";

// Componentes existentes
import Cart from "./components/Cart.jsx";
import ProductGrid from "./components/ProductGrid.jsx";
import Header from "./components/Header.jsx";
import Toast from "./components/Toast.jsx";
import AdminProducts from "./views/AdminProducts.jsx";
import Checkout from "./components/Checkout.jsx";
import CheckoutSuccess from "./views/CheckoutSuccess.jsx";
import CheckoutFailure from "./views/CheckoutFailure.jsx";
import CheckoutPending from "./views/CheckoutPending.jsx";

// Páginas de "Mi Cuenta"
import AccountLayout from "./views/AccountLayout.jsx";
import Dashboard from "./views/Dashboard.jsx";
import OrderListPage from "./views/OrderListPage.jsx";
import OrderDetailPage from "./views/OrderDetailPage.jsx";
import AddressesPage from "./views/AddressesPage.jsx";
import AccountDetailsPage from "./views/AccountDetailsPage.jsx";
import LoginAdmin from "./views/LoginAdmin.jsx";
import FloatingButtons from "./components/FloatingButtons.jsx";
import Mayorista from "./views/Mayorista.jsx";
import ThankYou from "./views/ThankYou.jsx";
// Layout principal que envuelve toda la app




const Layout = () => {
  const { store, actions } = useContext(Context);
  const basename = import.meta.env.VITE_BASENAME || "";

  // 🔥 MEJORAR: Hidratar sesión al cargar la app

  // 🔥 Hidratar carrito al montar
  useEffect(() => {
    const initializeApp = async () => {
      console.log("🚀 [LAYOUT] Inicializando aplicación...");

      // 1. Hidratar carrito (solo si no venimos de thank-you)
      const skipHydrate = window.location.pathname.includes("thank-you");
      if (!skipHydrate) {
        console.log("🛒 [LAYOUT] Hidratando carrito...");
        console.log("🛒 [LAYOUT] localStorage ANTES de hidratar:", localStorage.getItem('cart'));
        actions.hydrateCart?.();

        // Verificar después de hidratar
        setTimeout(() => {
          console.log("🛒 [LAYOUT] store.cart DESPUÉS de hidratar:", store.cart);
        }, 100);
      } else {
        console.log("⏭️ [LAYOUT] Saltando hydrateCart porque venimos de thank-you");
      }

      // 2. Hidratar sesión si hay token
      if (actions.hydrateSession) {
        console.log("💧 [LAYOUT] Hidratando sesión...");
        console.log("💧 [LAYOUT] Token en localStorage:", localStorage.getItem('token') ? 'SÍ' : 'NO');
        await actions.hydrateSession();
        console.log("💧 [LAYOUT] Usuario después de hidratar:", store.user?.email || 'No logueado');
      }

      // 3. Cargar categorías desde API
      if (actions.fetchCategoriesFromAPI) {
        console.log("📂 [LAYOUT] Cargando categorías...");
        await actions.fetchCategoriesFromAPI();
        console.log("📂 [LAYOUT] Categorías cargadas:", store.categories?.length || 0);
      }

      // 4. Cargar productos si no están cargados
      if (actions.fetchProducts && (!store.products || store.products.length === 0)) {
        console.log("📦 [LAYOUT] Cargando productos...");
        await actions.fetchProducts();
        console.log("📦 [LAYOUT] Productos cargados:", store.products?.length || 0);
      } else {
        console.log("📦 [LAYOUT] Productos ya cargados:", store.products?.length || 0);
      }

      console.log("✅ [LAYOUT] Aplicación inicializada");
      console.log("🔍 [LAYOUT] Estado final:");
      console.log("  - Carrito items:", store.cart?.length || 0);
      console.log("  - Usuario:", store.user?.email || 'No logueado');
      console.log("  - Productos:", store.products?.length || 0);
      console.log("  - localStorage cart:", localStorage.getItem('cart') ? 'EXISTE' : 'VACÍO');
    };

    initializeApp();
  }, []); // Solo al montar la app


  return (
    <div>
      <BrowserRouter basename={basename}>
        <FloatingButtons />
        <Header />

        <Routes>
          {/* ===== Rutas que ya tenías ===== */}
          <Route exact path="/" element={<Inicio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/setup-password" element={<SetupPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/products" element={<ProductGrid />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/failure" element={<CheckoutFailure />} />
          <Route path="/checkout/pending" element={<CheckoutPending />} />
          <Route path="/categoria/:slug" element={<ProductGrid />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/login" element={<LoginAdmin />} />
          <Route path="/mayorista" element={<Mayorista />} />

          <Route path="/pago/exitoso" element={<ThankYou />} />
          <Route path="/pago/fallido" element={<ThankYou />} />
          <Route path="/pago/pendiente" element={<ThankYou />} />
          <Route path="/thank-you" element={<ThankYou />} />



          {/* ===== Mi Cuenta con subrutas ===== */}
          <Route path="/cuenta" element={<AccountLayout />}>
            {/* Escritorio */}
            <Route index element={<Dashboard />} />
            {/* Pedidos: listado y detalle */}
            <Route path="pedidos" element={<OrderListPage />} />
            <Route path="pedidos/:orderId" element={<OrderDetailPage />} />
            {/* Direcciones */}
            <Route path="direcciones" element={<AddressesPage />} />
            {/* Detalles de la cuenta */}
            <Route path="detalles" element={<AccountDetailsPage />} />
            {/* Cerrar sesión */}
            <Route path="cerrar" element={<Logout />} />
          </Route>

        </Routes>
        <Footer />

        {/* Toast global */}
        <Toast
          message={store.toast?.message || ""}
          isVisible={store.toast?.isVisible || false}
          onClose={() => actions.hideToast && actions.hideToast()}
        />
      </BrowserRouter>
    </div>
  );
};

export default injectContext(Layout);