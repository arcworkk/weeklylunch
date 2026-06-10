const API_URL = "http://localhost:3001/api";
const TOKEN_KEY = "weeklylunch_token";

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

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: isJsonBody
      ? JSON.stringify(options.body)
      : (options.body as BodyInit | null | undefined)
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? "Erreur API");
  }

  return data as T;
};
