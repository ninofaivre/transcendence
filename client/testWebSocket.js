import  { io } from "https://cdn.socket.io/4.3.2/socket.io.esm.min.js"
import { getCookie } from "./global.js"

const socket = io("http://88.172.94.204:49153")
socket.emit("message", "jkldfjklsjkfldj")
