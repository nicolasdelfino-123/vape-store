import React, { useState, useEffect } from "react";
import getState from "./flux.js";


export const Context = React.createContext(null);

const injectContext = PassedComponent => {
	const StoreWrapper = props => {
		const [state, setState] = useState(null);

		// Inicializar solo una vez
		if (!state) {
			// Cargar carrito desde localStorage PRIMERO
			let savedCart = [];
			try {
				const savedCartData = localStorage.getItem('cart');
				if (savedCartData) {
					savedCart = JSON.parse(savedCartData);
				}
			} catch (error) {
				console.error('Error loading cart:', error);
			}

			// Variable para almacenar el estado actual
			let currentState = null;

			const initialState = getState({
				getStore: () => currentState?.store || {},
				getActions: () => currentState?.actions || {},
				setStore: updatedStore => {
					setState(prevState => {
						const newState = {
							...prevState,
							store: { ...prevState.store, ...updatedStore }
						};

						// Actualizar la referencia del estado actual
						currentState = newState;

						// Guardar carrito en localStorage cuando se actualiza
						if (newState.store.cart) {
							localStorage.setItem('cart', JSON.stringify(newState.store.cart));
						}

						return newState;
					});
				}
			});

			// Asignar el carrito cargado al estado inicial
			initialState.store.cart = savedCart;

			// Establecer la referencia inicial
			currentState = initialState;

			setState(initialState);
		}

		return (
			<Context.Provider value={state}>
				<PassedComponent {...props} />
			</Context.Provider>
		);
	};
	return StoreWrapper;
};

export default injectContext;