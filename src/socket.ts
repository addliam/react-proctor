import { io } from "socket.io-client";
const URL = `${import.meta.env.VITE_BACKEND_SUPERVISION_API}`;
export const socket = io(URL);
