import React, { useContext } from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from './views/Home';
import injectContext, { Context } from './js/store/appContext.jsx';
import './index.css';
import Register from './views/Register.jsx';
import Login from './views/Login.jsx';
import Inicio from './views/Inicio.jsx';
import AdminPanel from './views/AdminPanel.jsx';
import ProductDetail from './views/ProductDetail.jsx';
// Importar componentes de la tienda
import Cart from './components/Cart.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import Header from './components/Header.jsx';
import Toast from './components/Toast.jsx';

const Layout = () => {
  const { store, actions } = useContext(Context);
  const basename = import.meta.env.VITE_BASENAME || "";

  return (
    <div>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route exact path='/' element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/products" element={<ProductGrid />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>

        {/* Toast global */}
        <Toast
          message={store.toast?.message || ""}
          isVisible={store.toast?.isVisible || false}
          onClose={() => actions.hideToast && actions.hideToast()}
        />
      </BrowserRouter>
    </div>
  )
}

export default injectContext(Layout);