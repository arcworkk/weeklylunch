const API_URL = String(import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");
const TOKEN_KEY = "weeklylunch_token";
const API_TIMEOUT_MS = 15000;

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);

export const setAuthToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearAuthToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | object | null;
};

export const apiRequest = async <T>(path: string, options: ApiOptions = {}) => {
  const token = getAuthToken();
  const headers = new Headers(options.headers);
  const isJsonBody =
    options.body !== undefined &&
    options.body !== null &&
    !(options.body instanceof FormData);

  if (!headers.has("Content-Type") && isJsonBody) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const timeoutController = new AbortController();
  const timeoutId = window.setTimeout(
    () => timeoutController.abort(),
    API_TIMEOUT_MS
  );

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: options.signal ?? timeoutController.signal,
      body: isJsonBody
        ? JSON.stringify(options.body)
        : (options.body as BodyInit | null | undefined)
    });
  } catch (error) {
    if (timeoutController.signal.aborted) {
      throw new Error("L'API ne repond pas. Verifiez votre connexion reseau.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? "Erreur API");
  }

  return data as T;
};
