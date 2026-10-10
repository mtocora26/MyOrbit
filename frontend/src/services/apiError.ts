export async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const problem = await response.json() as { detail?: string };
    return problem.detail || fallback;
  } catch {
    return fallback;
  }
}
