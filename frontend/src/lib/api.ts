import type { ApiErrorResponse } from "../types/api";

const rawApiUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "";

export const API_BASE_URL = rawApiUrl.replace(/\/$/, "");

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiRequestError(
      "Сервис временно недоступен. Попробуй ещё раз.",
      0,
    );
  }

  if (!response.ok) {
    let message = `Ошибка запроса (${response.status})`;

    try {
      const body = (await response.json()) as Partial<ApiErrorResponse>;
      message = body.message || message;
    } catch {
      // The server may return an empty or non-JSON error response.
    }

    throw new ApiRequestError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getFriendlyError(
  error: unknown,
  context: "general" | "login" = "general",
): string {
  if (!(error instanceof ApiRequestError)) {
    return "Что-то пошло не так. Попробуй ещё раз.";
  }

  if (error.status === 401) {
    return context === "login"
      ? "Неверный email или пароль."
      : "Нужно войти в аккаунт.";
  }

  if (error.status === 409) {
    return "Недостаточно звёзд.";
  }

  return error.message;
}

export function formatCoins(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export function resolveAssetUrl(url?: string): string | undefined {
  if (!url || /^https?:\/\//i.test(url)) {
    return url;
  }

  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}
