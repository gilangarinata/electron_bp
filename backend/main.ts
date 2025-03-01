import path from 'node:path'
import { app, BrowserWindow, ipcMain } from 'electron'
import log from 'electron-log'
import electronUpdater from 'electron-updater'
import electronIsDev from 'electron-is-dev'
import ElectronStore from 'electron-store'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const { autoUpdater } = electronUpdater
let appWindow: BrowserWindow | null = null
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const store = new ElectronStore()

import sqlite3 from 'sqlite3';

// Define the database path
const dbPath: string = resolve(__dirname, "sqlite.db").replace('app.asar', 'app.asar.unpacked').replace("/backend/build", "");

// Create a new database instance
const db: sqlite3.Database = new sqlite3.Database(dbPath, (error: Error | null) => {
	if (error) {
		// Log the error message and the database path
		console.error(`Error opening database: ${error.message} at path: ${dbPath}`);

		// Throw a new error with a descriptive message
		throw new Error(`Failed to open database at path: ${dbPath}`);
	} else {
		console.log('Database connection established successfully.');
	}
});

// Create the products table if it does not exist
db.serialize(() => {
	db.run("CREATE TABLE IF NOT EXISTS products (name TEXT PRIMARY KEY, price TEXT, brand TEXT)");
});


class AppUpdater {
	constructor() {
		log.transports.file.level = 'info'
		autoUpdater.logger = log
		autoUpdater.checkForUpdatesAndNotify()
	}
}

const installExtensions = async () => {
	/**
	 * NOTE:
	 * As of writing this comment, Electron does not support the `scripting` API,
	 * which causes errors in the REACT_DEVELOPER_TOOLS extension.
	 * A possible workaround could be to downgrade the extension but you're on your own with that.
	 */
	/*
	const {
		default: electronDevtoolsInstaller,
		//REACT_DEVELOPER_TOOLS,
		REDUX_DEVTOOLS,
	} = await import('electron-devtools-installer')
	// @ts-expect-error Weird behaviour
	electronDevtoolsInstaller.default([REDUX_DEVTOOLS]).catch(console.log)
	*/
}

const spawnAppWindow = async () => {
	if (electronIsDev) await installExtensions()

	const RESOURCES_PATH = electronIsDev
		? path.join(__dirname, '../../assets')
		: path.join(process.resourcesPath, 'assets')

	const getAssetPath = (...paths: string[]): string => {
		return path.join(RESOURCES_PATH, ...paths)
	}

	const PRELOAD_PATH = path.join(__dirname, 'preload.js')

	appWindow = new BrowserWindow({
		width: 800,
		height: 600,
		icon: getAssetPath('icon.png'),
		show: false,
		webPreferences: {
			preload: PRELOAD_PATH,
		},
	})


	// Listen for addProduct requests from the renderer process
	ipcMain.on('add-product', (event, product) => {
		addProduct(product.name, product.price, product.brand);
		event.reply('product-added', {success: true});
	});

	ipcMain.on('get-product', async (event, name) => {
		getProductByName(name, (err: any, rows: any) => {
			if (err) {
				event.reply('product-retrieved', err.message);
			} else {
				event.reply('product-retrieved', rows);
			}
		});
	});

	ipcMain.on('get-all-products', async (event, name) => {
		getAllProduct((err: any, rows: any) => {
			if (err) {
				event.reply('all-products-retrieved', err.message);
			} else {
				event.reply('all-products-retrieved', rows);
			}
		});
	});

	ipcMain.on('update-product', (event, product) => {
		updateProduct(product.name, product.price, product.brand);
		event.reply('product-updated', {success: true});
	});

	ipcMain.on('delete-product', (event, name) => {
		deleteProduct(name);
		event.reply('product-deleted', {success: true});
	});

	appWindow.loadURL(
		electronIsDev
			? 'http://localhost:3000'
			: `file://${path.join(__dirname, '../../frontend/build/index.html')}`
	)
	appWindow.maximize()
	appWindow.setMenu(null)
	appWindow.show()

	if (electronIsDev) appWindow.webContents.openDevTools({ mode: 'right' })

	appWindow.on('closed', () => {
		appWindow = null
	})
}

app.on('ready', () => {
	new AppUpdater()
	spawnAppWindow()
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

/*
 * ======================================================================================
 *                                IPC Main Events
 * ======================================================================================
 */

ipcMain.handle('sample:ping', () => {
	return 'pong'
})




// Define the function to add a product
export function addProduct(name: string, price: string, brand: string): void {
	db.run("INSERT INTO products (name, price, brand) VALUES (?, ?, ?)", [name, price, brand], function(err: Error | null) {
		if (err) {
			return console.error(err.message);
		}
		console.log(`A row has been inserted with rowid ${this.lastID}`);
	});
}

// Define the function to get a product by name
export function getProductByName(name: string, callback: (error: Error | null, rows: any) => void): void {
	if (name === "") {
		callback(null, []);
		return;
	}
	db.all("SELECT * FROM products WHERE name LIKE ? LIMIT 10", [`%${name}%`], (err: Error | null, rows: any) => {
		if (err) {
			console.error(err.message);
			callback(err, null); // Return the error through the callback
			return;
		}
		callback(null, rows); // Return the rows through the callback
	});
}

// Define the function to get all products
export function getAllProduct(callback: (error: Error | null, rows: any) => void): void {
	db.all("SELECT * FROM products", (err: Error | null, rows: any) => {
		if (err) {
			console.error(err.message);
			callback(err, null); // Return the error through the callback
			return;
		}
		callback(null, rows); // Return the rows through the callback
	});
}

// Define the function to update a product
export function updateProduct(name: string, price: string, brand: string): void {
	db.run("UPDATE products SET price = ?, brand = ? WHERE name = ?", [price, brand, name], function(err: Error | null) {
		if (err) {
			return console.error(err.message);
		}
		console.log(`Row(s) updated: ${this.changes}`);
	});
}

// Define the function to delete a product
export function deleteProduct(name: string): void {
	db.run("DELETE FROM products WHERE name = ?", [name], function(err: Error | null) {
		if (err) {
			return console.error(err.message);
		}
		console.log(`Row(s) deleted ${this.changes}`);
	});
}

