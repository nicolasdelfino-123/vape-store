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

// Páginas de "Mi Cuenta"
import AccountLayout from "./views/AccountLayout.jsx";
import Dashboard from "./views/Dashboard.jsx";
import OrderListPage from "./views/OrderListPage.jsx";
import OrderDetailPage from "./views/OrderDetailPage.jsx";
import AddressesPage from "./views/AddressesPage.jsx";
import AccountDetailsPage from "./views/AccountDetailsPage.jsx";
import LoginAdmin from "./views/LoginAdmin.jsx";




const Layout = () => {
  const { store, actions } = useContext(Context);
  const basename = import.meta.env.VITE_BASENAME || "";

  // 🔥 MEJORAR: Hidratar sesión al cargar la app

  useEffect(() => {
    const initializeApp = async () => {
      console.log("🚀 Inicializando aplicación...");

      // 1. Hidratar sesión si hay token
      if (actions.hydrateSession) {
        console.log("💧 Hidratando sesión...");
        await actions.hydrateSession();
      }

      // 2. Cargar categorías desde API
      if (actions.fetchCategoriesFromAPI) {
        console.log("📂 Cargando categorías...");
        await actions.fetchCategoriesFromAPI();
      }

      // 3. Cargar productos si no están cargados
      if (actions.fetchProducts && (!store.products || store.products.length === 0)) {
        console.log("📦 Cargando productos...");
        await actions.fetchProducts();
      }

      console.log("✅ Aplicación inicializada");
    };

    initializeApp();
  }, []); // Solo al montar la app

  return (
    <div>
      <BrowserRouter basename={basename}>
        <Header />

        <Routes>
          {/* ===== Rutas que ya tenías ===== */}
          <Route exact path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/setup-password" element={<SetupPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/products" element={<ProductGrid />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/categoria/:slug" element={<ProductGrid />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/login" element={<LoginAdmin />} />


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