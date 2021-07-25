let db;
// Creates a new db request for the progressive budget database.
const request = indexedDB.open("budget", 1);

// Creates an object store called "transaction" that autoIncrements when set "true".
request.onupgradeneeded = (e) => {
	const db = e.target.result;
	db.createObjectStore("transaction", { autoIncrement: true });
};

request.onsuccess = (e) => {
	db = e.target.result;
	// Checks to verify if app is online before checking database.
	if (navigator.onLine) {
		checkDatabase();
	}
};

request.onerror = (e) => {
	console.log(`Error ${e.target.errorCode}`);
};

const saveTransaction = (data) => {
	// Create a transaction on the transaction DB with read-write access
	const transaction = db.transaction([ "transaction" ], "readwrite");

	// Access the object store.
	const store = transaction.objectStore("transaction");

	// Add data to store with add method.
	store.add(data);
};

function checkDatabase() {
	// Open a transaction on store db
	const transaction = db.transaction([ "transaction" ], "readwrite");
	// Access pending object store
	const store = transaction.objectStore("transaction");
	// Get all records from store and set to a variable
	const getAll = store.getAll();

	getAll.onsuccess = async () => {
		try {
			if (getAll.result.length > 0) {
				const response = await fetch("/api/transaction/bulk", {
					method: "POST",
					body: JSON.stringify(getAll.result),
					headers: {
						Accept: "application/json, text/plain, */*",
						"Content-Type": "application/json"
					}
				});
				response.json();

				const transaction = db.transaction([ "transaction" ], "readwrite");

				// Access transaction object store
				const store = transaction.objectStore("transaction");

				// Clear all items in store
				store.clear();
			}
		} catch (error) {
			console.log(`Error ${error}`);
		}
	};
}

// Listen for the app to come back online.
window.addEventListener("online", checkDatabase);