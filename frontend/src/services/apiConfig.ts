// Vacío = mismo origen: en dev lo resuelve el proxy de Vite y en producción nginx.
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "";
