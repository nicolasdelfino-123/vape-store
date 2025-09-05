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

			// === ACCIONES PARA LA TIENDA DE VAPES ===

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

			// Carrito
			addToCart: (product, quantity = 1) => {
				const store = getStore();
				const cart = [...store.cart];
				const existingItem = cart.find((item) => item.id === product.id);

				if (existingItem) {
					existingItem.quantity += quantity;
				} else {
					cart.push({ ...product, quantity });
				}

				setStore({ ...store, cart });
			},

			removeFromCart: (productId) => {
				const store = getStore();
				const cart = store.cart.filter((item) => item.id !== productId);
				setStore({ ...store, cart });
			},

			updateCartQuantity: (productId, quantity) => {
				const store = getStore();
				const cart = store.cart.map((item) =>
					item.id === productId ? { ...item, quantity } : item
				);
				setStore({ ...store, cart });
			},

			clearCart: () => {
				const store = getStore();
				setStore({ ...store, cart: [] });
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

		}
	};
};

export default getState;