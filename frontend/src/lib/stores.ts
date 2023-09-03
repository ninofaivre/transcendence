import { localStorageStore } from "@skeletonlabs/skeleton"
import { get } from "svelte/store"

console.log("The stores module is being executed...")

export const logged_in = localStorageStore("logged", false)

console.log("Am I logged in ?:", get(logged_in))
