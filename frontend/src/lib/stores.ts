import { localStorageStore } from "@skeletonlabs/skeleton"
import { get, writable } from "svelte/store"

console.log("The stores module is being executed...")

export const logged_in = localStorageStore("logged", false)

const num = 0
export const reload_img = writable(num)

