function storeValue(key, value) {
	localStorage.setItem(key, value)
}

function getValue(key) {
	return localStorage.getItem(key)
}

function deleteValue(key) {
	localStorage.removeItem(key)
}

export { storeValue, getValue, deleteValue }
