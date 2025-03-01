/* eslint-disable @typescript-eslint/no-var-requires */
// Electron doesnt support ESM for renderer process. Alternatively, pass this file
// through a bundler but that feels like an overkill
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('BloopAPI', {
	foo: 'bar',
	ping: () => ipcRenderer.invoke('sample:ping'),


	addProduct: (product: any) => ipcRenderer.send('add-product', product),
	getProduct: (name: any) => ipcRenderer.send('get-product', name),
	getAllProducts: () => ipcRenderer.send('get-all-products'),
	updateProduct: (product: any) => ipcRenderer.send('update-product', product),
	deleteProduct: (name: any) => ipcRenderer.send('delete-product', name),

	onProductAdded: (callback: any) => ipcRenderer.on('product-added', (event: any, response: any) => callback(response)),
	onProductUpdated: (callback: any) => ipcRenderer.on('product-updated', (event: any, response: any) => callback(response)),
	onProductDeleted: (callback: any) => ipcRenderer.on('product-deleted', (event: any, response: any) => callback(response)),
	onGetProduct: (callback: any) => ipcRenderer.on('product-retrieved', (event: any, response: any) => callback(response)),
	onGetAllProducts: (callback: any) => ipcRenderer.on('all-products-retrieved', (event: any, response: any) => callback(response)),
})
