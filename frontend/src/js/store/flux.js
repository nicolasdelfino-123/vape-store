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
			billingAddress: null,   // ← NUEVO: JSON de facturación
			shippingAddress: null,  // ← NUEVO: JSON de envío
			dni: "",
			productSearch: "",


			// Toast notifications
			toast: {
				isVisible: false,
				message: "",

			}
		},
		actions: {

			getAuthHeaders: () => {
				const token = localStorage.getItem("token");
				return {
					"Content-Type": "application/json",
					...(token ? { "Authorization": `Bearer ${token}` } : {})
				};
			},

			fetchUserAddresses: async () => {
				const store = getStore();
				const token = localStorage.getItem("token");
				if (!token) return null;

				try {
					const url = `${backendUrl}/user/address`;
					const res = await fetch(url, {
						headers: { "Authorization": `Bearer ${token}` }
					});

					if (!res.ok) {
						throw new Error(`[${res.status}] ${res.statusText || "No se pudo obtener direcciones"}`);
					}

					const data = await res.json(); // { billing_address, shipping_address, dni }
					setStore({
						...store,
						billingAddress: data.billing_address || null,
						shippingAddress: data.shipping_address || null,
						dni: data.dni || ""
					});
					return data;
				} catch (e) {
					console.error("fetchUserAddresses:", e);
					return null;
				}
			},

			updateUserAddressTyped: async (type, payload) => {
				const store = getStore();
				const token = localStorage.getItem("token");
				if (!token) return false;

				try {
					const url = `${backendUrl}/user/address`;
					const res = await fetch(url, {
						method: "PUT",
						headers: {
							"Content-Type": "application/json",
							"Authorization": `Bearer ${token}`
						},
						body: JSON.stringify({ type, payload })
					});

					if (!res.ok) {
						const err = await res.json().catch(() => ({}));
						console.error("updateUserAddressTyped:", res.status, err);
						return false;
					}

					await getActions().fetchUserAddresses();
					setStore({ ...store, updateStatusMsg: `Dirección de ${type} actualizada` });
					return true;
				} catch (e) {
					console.error("updateUserAddressTyped:", e);
					return false;
				}
			},

			// Azúcar: guardar envío usando la función tipada
			fetchUserBillingAddress: async () => {
				const data = await getActions().fetchUserAddresses();
				return data?.billing_address || null;
			},

			fetchUserShippingAddress: async () => {
				const data = await getActions().fetchUserAddresses();
				return data?.shipping_address || null;
			},

			saveShippingAddress: async (payload) => {
				return getActions().updateUserAddressTyped("shipping", payload);
			},



			exampleFunction: () => {
				console.log(backendUrl)
				return
			},

			searchProducts: (query) => {
				const store = getStore();
				setStore({ ...store, productSearch: query });
			},

			searchProductsQuick: (query) => {
				const store = getStore();
				const q = query.toLowerCase();
				if (!q) return [];
				return (store.products || []).filter(
					p =>
						p.name?.toLowerCase().includes(q) ||
						p.brand?.toLowerCase().includes(q)
				);
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

					if (data.access_token) {
						localStorage.setItem("token", data.access_token);

						// Obtener datos completos del usuario
						try {
							const userRes = await fetch(`${backendUrl}/user/me`, {
								headers: { "Authorization": `Bearer ${data.access_token}` }
							});
							if (userRes.ok) {
								const userData = await userRes.json();
								const store = getStore();
								setStore({ ...store, user: userData });
								// cargar direcciones del usuario
								try { await getActions().fetchUserAddresses(); } catch { }

								return { success: true, data: userData };
							}
						} catch (userError) {
							console.log("Error obteniendo datos de usuario:", userError);
						}
					}

					// Fallback si falla la obtención de datos del usuario
					const store = getStore();
					setStore({ ...store, user: { role: data.role } });
					return { success: true, data: data };

				} catch (error) {
					return { success: false, error: "ocurrió un error inesperado" };
				}
			},



			// Login para administradores
			adminLogin: async (email, password) => {
				try {
					const response = await fetch(`${backendUrl}/user/login`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json"
						},
						body: JSON.stringify({ email, password })
					});

					if (!response.ok) {
						const errorData = await response.json();
						return { success: false, error: errorData.error || "Login fallido" };
					}

					const data = await response.json();

					if (data.access_token) {
						// Verificar si es admin
						try {
							const userRes = await fetch(`${backendUrl}/user/me`, {
								headers: { "Authorization": `Bearer ${data.access_token}` }
							});
							if (userRes.ok) {
								const userData = await userRes.json();
								if (userData.is_admin) {
									localStorage.setItem("token", data.access_token);
									localStorage.setItem("admin_token", data.access_token);
									const store = getStore();
									setStore({ ...store, user: userData });
									return { success: true, data: userData, isAdmin: true };
								} else {
									return { success: false, error: "No tienes permisos de administrador" };
								}
							}
						} catch (userError) {
							console.log("Error obteniendo datos de usuario:", userError);
						}
					}

					return { success: false, error: "Error en autenticación" };
				} catch (error) {
					return { success: false, error: "Error inesperado" };
				}
			},


			// Obtener categorías desde la API
			fetchCategoriesFromAPI: async () => {
				const store = getStore();
				setStore({ ...store, loading: true });

				try {
					const response = await fetch(`${backendUrl}/public/categories`);
					if (!response.ok) {
						throw new Error('Error al obtener categorías');
					}
					const categories = await response.json();
					const categoryNames = categories.map(cat => cat.name);
					setStore({ ...store, categories: categoryNames, loading: false });
					return { success: true, data: categoryNames };
				} catch (error) {
					console.error("Error fetching categories:", error);
					setStore({ ...store, loading: false });
					return { success: false, error: error.message };
				}
			},

			// Crear categoría desde admin
			createCategory: async (categoryData) => {
				try {
					const token = localStorage.getItem("token");
					const response = await fetch(`${backendUrl}/admin/categories`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"Authorization": `Bearer ${token}`
						},
						body: JSON.stringify(categoryData)
					});

					if (!response.ok) {
						const errorData = await response.json();
						throw new Error(errorData.error || 'Error al crear categoría');
					}

					const category = await response.json();
					return { success: true, data: category };
				} catch (error) {
					console.error("Error creating category:", error);
					return { success: false, error: error.message };
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
					try { await getActions().fetchUserAddresses(); } catch { }

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

			// 🔥 MEJORAR: Logs más detallados para debugging
			updateAccountDetails: async (userData) => {
				const token = localStorage.getItem("token");
				console.log("🔧 Actualizando cuenta:", { token: token ? "✅" : "❌", userData });

				if (!token) {
					const store = getStore();
					setStore({ ...store, updateStatusMsg: "Error: No hay sesión activa" });
					return false;
				}

				try {
					console.log("📤 Enviando PUT a:", `${backendUrl}/user/me`);

					const res = await fetch(`${backendUrl}/user/me`, {
						method: "PUT",
						headers: {
							"Content-Type": "application/json",
							"Authorization": `Bearer ${token}`
						},
						body: JSON.stringify(userData)
					});

					console.log("📥 Respuesta:", res.status, res.statusText);

					const store = getStore();

					if (!res.ok) {
						const err = await res.json();
						console.error("❌ Error del backend:", err);
						setStore({ ...store, updateStatusMsg: err.error || "No se pudo actualizar los datos" });
						return false;
					}

					const updatedUser = await res.json();
					console.log("✅ Usuario actualizado:", updatedUser);

					// 🔥 IMPORTANTE: Actualizar store con datos completos
					setStore({
						...store,
						user: updatedUser, // Datos actualizados del usuario
						updateStatusMsg: "Datos actualizados correctamente"
					});
					return true;
				} catch (e) {
					console.error("❌ Error en updateAccountDetails:", e);
					const store = getStore();
					setStore({ ...store, updateStatusMsg: "Error inesperado al actualizar" });
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

			// Limpiar mensaje de estado
			clearUpdateStatusMsg: () => {
				const store = getStore();
				setStore({ ...store, updateStatusMsg: "" });
			},

		}
	};
};

export default getState;