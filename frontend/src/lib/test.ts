const localStore = localStorage.setItem

localStorage.setItem = function (key, value) {
	const event = new Event("localUpdated")
	event.key = key
	event.value = value

	document.dispatchEvent(event)
	localStore.apply(this, arguments)
}

const localStoreHandler = function (e) {
	console.log(`👉 localStorage.set('${e.key}', '${e.value}') updated`)
}

document.addEventListener("localUpdated", localStoreHandler, false)

localStorage.setItem("username", "amoos")

// After 2 second
setTimeout(() => localStorage.setItem("username", "rifat"), 2000)
