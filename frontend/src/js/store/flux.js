const backendUrl = import.meta.env.VITE_BACKEND_URL;

const getState = ({ getStore, getActions, setStore }) => {
	return {
		store: {
			personas: ["Pedro", "Maria"],
			demoMsg: "",
			// Store para la tienda de vapes
			products: [],
			cart: [],
			user: null,
			loading: false,
			categories: ["Vapes Desechables", "Pods", "Líquidos", "Accesorios"],
			orders: [],
			userAddress: { address: "", phone: "" },
			updateStatusMsg: "",

			// Toast notifications
			toast: {
				isVisible: false,
				message: "",

			}
		},
		actions: {

			exampleFunction: () => {
				console.log(backendUrl)
				return
			},

			demoFunction: async () => {
				const urlAboutPublic = backendUrl + '/public/demo';
				const store = getStore();

				try {

					const response = await fetch(urlAboutPublic, { method: 'GET' });

					if (!response.ok) {
						console.log(response.statusText)
						throw new Error('Network response error');
					}

					const data = await response.json();
					setStore({ ...store, demoMsg: data.msg })

					return data.msg

				} catch (error) {
					console.error('Error fetching data:', error);
					return false
				}
			},

			register: async (email, password, name) => {
				try {
					const response = await fetch(`${backendUrl}/user/signup`,
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json"
							},
							body: JSON.stringify({
								email,
								password,
								name
							})
						});

					if (!response.ok) {
						const errorData = await response.json();
						return { success: false, error: errorData.error || "Registro fallido" };
					}

					const data = await response.json();
					return { success: true, data: data };

				} catch (error) {
					return { success: false, error: "Ocurrió un error inesperado." };
				}
			},

			login: async (email, password) => {
				try {
					const response = await fetch(`${backendUrl}/user/login`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json"
						},
						body: JSON.stringify({
							email,
							password
						})
					})
					if (!response.ok) {
						const errorData = await response.json();
						return { success: false, error: errorData.error || "Login fallido" };
					}
					const data = await response.json();
					console.log("esta es la data", data)
					if (data.access_token) {
						localStorage.setItem("token", data.access_token);
					}
					const store = getStore();
					setStore({ ...store, user: data });
					return { success: true, data: data };

				} catch (error) {
					return { success: false, error: "ocurrió un error inesperado" };
				}
			},

			hydrateSession: async () => {
				const store = getStore();
				const token = localStorage.getItem("token");
				if (!token) return;
				try {
					const res = await fetch(`${backendUrl}/user/me`, {
						headers: { "Authorization": `Bearer ${token}` }
					});
					if (!res.ok) throw new Error("No se pudo hidratar sesión");
					const user = await res.json();
					setStore({ ...store, user });
				} catch (e) {
					localStorage.removeItem("token");
					setStore({ ...store, user: null });
				}
			},

			fetchUserAddress: async () => {
				const token = localStorage.getItem("token");
				if (!token) return null;
				try {
					const res = await fetch(`${backendUrl}/user/address`, {
						headers: { "Authorization": `Bearer ${token}` }
					});
					if (!res.ok) throw new Error("No se pudo obtener dirección");
					const data = await res.json(); // {address, phone}
					const store = getStore();
					setStore({ ...store, userAddress: data });
					return data;
				} catch (e) {
					console.error(e);
					return null;
				}
			},

			updateUserAddress: async (address, phone) => {
				const token = localStorage.getItem("token");
				if (!token) return;
				try {
					const res = await fetch(`${backendUrl}/user/address`, {
						method: "PUT",
						headers: {
							"Content-Type": "application/json",
							"Authorization": `Bearer ${token}`
						},
						body: JSON.stringify({ address, phone })
					});
					if (!res.ok) throw new Error("No se pudo actualizar dirección");
					const data = await res.json();
					const store = getStore();
					setStore({ ...store, userAddress: data, updateStatusMsg: "Dirección actualizada" });
					return true;
				} catch (e) {
					console.error(e);
					return false;
				}
			},

			updateAccountDetails: async ({ name, current_password, new_password, confirm_password }) => {
				const token = localStorage.getItem("token");
				if (!token) return;
				try {
					const res = await fetch(`${backendUrl}/user/me`, {
						method: "PUT",
						headers: {
							"Content-Type": "application/json",
							"Authorization": `Bearer ${token}`
						},
						body: JSON.stringify({ name, current_password, new_password, confirm_password })
					});
					const store = getStore();
					if (!res.ok) {
						const err = await res.json();
						setStore({ ...store, updateStatusMsg: err.error || "No se pudo actualizar" });
						return false;
					}
					const user = await res.json();
					setStore({ ...store, user, updateStatusMsg: "Datos actualizados" });
					return true;
				} catch (e) {
					console.error(e);
					return false;
				}
			},

			sendPasswordSetupEmail: async (email) => {
				try {
					const response = await fetch(`${backendUrl}/user/register-email`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json"
						},
						body: JSON.stringify({ email })
					});

					if (!response.ok) {
						const errorData = await response.json();
						return { success: false, error: errorData.error || "Error al enviar email" };
					}

					const data = await response.json();
					return { success: true, data: data };
				} catch (error) {
					return { success: false, error: "Error inesperado al enviar email" };
				}
			},

			setupPassword: async (token, password, name) => {
				try {
					const response = await fetch(`${backendUrl}/user/setup-password`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json"
						},
						body: JSON.stringify({ token, password, name })
					});

					if (!response.ok) {
						const errorData = await response.json();
						return { success: false, error: errorData.error || "Error al establecer contraseña" };
					}

					const data = await response.json();
					return { success: true, data: data };
				} catch (error) {
					return { success: false, error: "Error inesperado" };
				}
			},

			// === ACCIONES PARA LA TIENDA DE VAPES ===

			// Categorías
			fetchCategories: async () => {
				const store = getStore();
				setStore({ ...store, loading: true });

				try {
					const response = await fetch(`${backendUrl}/public/categories`);
					if (!response.ok) {
						throw new Error('Error al obtener categorías');
					}
					const categories = await response.json();
					setStore({ ...store, categories, loading: false });
					return { success: true, data: categories };
				} catch (error) {
					console.error("Error fetching categories:", error);
					setStore({ ...store, loading: false });
					return { success: false, error: error.message };
				}
			},

			// Productos
			fetchProducts: async () => {
				const store = getStore();
				setStore({ ...store, loading: true });

				try {
					const response = await fetch(`${backendUrl}/public/products`);
					if (!response.ok) {
						throw new Error('Error al obtener productos');
					}
					const products = await response.json();
					setStore({ ...store, products, loading: false });
					return { success: true, data: products };
				} catch (error) {
					console.error("Error fetching products:", error);
					setStore({ ...store, loading: false });
					return { success: false, error: error.message };
				}
			},


			addToCart: (product, quantity = 1) => {
				const store = getStore();
				const currentCart = store.cart || [];
				const existingItemIndex = currentCart.findIndex((item) => item.id === product.id);

				let updatedCart;
				if (existingItemIndex >= 0) {
					updatedCart = [...currentCart];
					updatedCart[existingItemIndex] = {
						...updatedCart[existingItemIndex],
						quantity: updatedCart[existingItemIndex].quantity + quantity
					};
				} else {
					updatedCart = [...currentCart, { ...product, quantity }];
				}

				// Actualizar store (localStorage se maneja en appContext)
				setStore({
					cart: updatedCart,
					toast: {
						isVisible: true,
						message: "Producto agregado al carrito"
					}
				});

			},


			// Toast actions
			hideToast: () => {
				setStore({
					toast: {
						isVisible: false,
						message: ""
					}
				});

			},

			removeFromCart: (productId) => {
				const store = getStore();
				const cart = store.cart.filter((item) => item.id !== productId);
				setStore({ cart });

			},

			updateCartQuantity: (productId, quantity) => {
				const store = getStore();
				const cart = store.cart.map((item) =>
					item.id === productId ? { ...item, quantity } : item
				);
				setStore({ cart });


			},

			clearCart: () => {
				setStore({ cart: [] });
			},

			// Usuario (funciones adicionales)
			logoutUser: () => {
				localStorage.removeItem("token");
				const store = getStore();
				setStore({ ...store, user: null });
			},

			// Órdenes
			createOrder: async (orderData) => {
				const store = getStore();
				setStore({ ...store, loading: true });

				try {
					const token = localStorage.getItem("token");
					const response = await fetch(`${backendUrl}/user/orders`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"Authorization": `Bearer ${token}`
						},
						body: JSON.stringify(orderData),
					});

					if (!response.ok) {
						const errorData = await response.json();
						throw new Error(errorData.error || 'Error al crear la orden');
					}

					const order = await response.json();
					const orders = [...store.orders, order];
					setStore({ ...store, orders, loading: false, cart: [] });
					return { success: true, data: order };
				} catch (error) {
					console.error("Error creating order:", error);
					setStore({ ...store, loading: false });
					return { success: false, error: error.message };
				}
			},

			fetchOrders: async () => {
				const store = getStore();
				setStore({ ...store, loading: true });

				try {
					const token = localStorage.getItem("token");
					const response = await fetch(`${backendUrl}/user/orders`, {
						headers: {
							"Authorization": `Bearer ${token}`
						}
					});

					if (!response.ok) {
						throw new Error('Error al obtener órdenes');
					}

					const orders = await response.json();
					setStore({ ...store, orders, loading: false });
					return { success: true, data: orders };
				} catch (error) {
					console.error("Error fetching orders:", error);
					setStore({ ...store, loading: false });
					return { success: false, error: error.message };
				}
			},

			// Forgot password
			forgotPassword: async (email) => {
				try {
					const response = await fetch(`${backendUrl}/user/forgot-password`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json"
						},
						body: JSON.stringify({ email })
					});

					const data = await response.json();

					if (!response.ok) {
						return { success: false, error: data.error || "Error al enviar email de recuperación" };
					}

					return { success: true, message: data.message };
				} catch (error) {
					return { success: false, error: "Error inesperado al procesar solicitud" };
				}
			},

			// Reset password
			resetPassword: async (token, password) => {
				try {
					const response = await fetch(`${backendUrl}/user/reset-password`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json"
						},
						body: JSON.stringify({ token, password })
					});

					const data = await response.json();

					if (!response.ok) {
						return { success: false, error: data.error || "Error al restablecer contraseña" };
					}

					return { success: true, message: data.message };
				} catch (error) {
					return { success: false, error: "Error inesperado al restablecer contraseña" };
				}
			},

		}
	};
};

export default getState;