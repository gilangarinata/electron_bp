export interface IBloopAPI {
	foo: string;
	ping: () => Promise<string>;
	addProduct: (product: { name: string; price: string; brand: string }) => void;
	getProduct: (name: string) => void;
	getAllProducts: () => void;
	updateProduct: (product: { name: string; price: string; brand: string }) => void;
	deleteProduct: (name: string) => void;
	onProductAdded: (callback: (response: any) => void) => void;
	onProductUpdated: (callback: (response: any) => void) => void;
	onProductDeleted: (callback: (response: any) => void) => void;
	onGetProduct: (callback: (response: any) => void) => void;
	onGetAllProducts: (callback: (response: any) => void) => void;
}

declare global {
	interface Window {
		BloopAPI: IBloopAPI;
	}
}
