export async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const problem = await response.json() as { detail?: string };
    return problem.detail || fallback;
  } catch {
    return fallback;
  }
}

export const NETWORK_ERROR_MESSAGE = "No se pudo conectar con el servidor. Revisa tu conexión.";

/**
 * El navegador reporta los fallos de red como TypeError en inglés («Failed to fetch», «Load failed»). Se traducen
 * una sola vez aquí para que ninguna pantalla, formulario ni aviso muestre texto en inglés al estudiante.
 */
export function translateNetworkErrors(): void {
  const original = window.fetch.bind(window);
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    try {
      return await original(...args);
    } catch (error) {
      if (error instanceof TypeError) throw new Error(NETWORK_ERROR_MESSAGE);
      throw error;
    }
  };
}
