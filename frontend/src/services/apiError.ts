import { isUnreachableStatus, reportApiResult } from "./connection";
import { cacheKeyFor, loadResponse, saveResponse } from "./offlineStore";

export async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const problem = await response.json() as { detail?: string };
    return problem.detail || fallback;
  } catch {
    return fallback;
  }
}

export const NETWORK_ERROR_MESSAGE = "No se pudo conectar con el servidor. Revisa tu conexión.";

/** Respuesta guardada: mismo JSON que dio el servidor, marcada para que se sepa que no es de ahora. */
function storedResponse(body: string): Response {
  return new Response(body, { status: 200, headers: { "Content-Type": "application/json", "X-MyOrbit-Cache": "stale" } });
}

/**
 * El navegador reporta los fallos de red como TypeError en inglés («Failed to fetch», «Load failed»). Se traducen
 * una sola vez aquí para que ninguna pantalla, formulario ni aviso muestre texto en inglés al estudiante.
 *
 * Aquí mismo se guarda cada lectura correcta de la API y, si no hay red o el servidor no responde, se devuelve la
 * última copia (ver `offlineStore.ts`): las pantallas siguen mostrando lo último que se vio sin saber que no hay red.
 */
export function translateNetworkErrors(): void {
  const original = window.fetch.bind(window);
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const [input, init] = args;
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method ?? (input instanceof Request ? input.method : "GET");
    const isApi = url.includes("/api/");
    const cacheKey = isApi ? cacheKeyFor(method, url) : null;
    try {
      const response = await original(...args);
      if (isApi) reportApiResult(!isUnreachableStatus(response.status));
      if (cacheKey && response.ok && (response.headers.get("Content-Type") ?? "").includes("json")) {
        response.clone().text().then((body) => saveResponse(cacheKey, body)).catch(() => undefined);
      }
      if (cacheKey && isUnreachableStatus(response.status)) {
        const saved = await loadResponse(cacheKey);
        if (saved !== null) return storedResponse(saved);
      }
      return response;
    } catch (error) {
      if (error instanceof TypeError) {
        if (isApi) reportApiResult(false);
        const saved = cacheKey ? await loadResponse(cacheKey) : null;
        if (saved !== null) return storedResponse(saved);
        throw new Error(NETWORK_ERROR_MESSAGE);
      }
      throw error;
    }
  };
}
