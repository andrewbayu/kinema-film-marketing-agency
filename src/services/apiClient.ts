export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function resolveUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url}`;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.error || `Request failed with status ${response.status}`,
      data
    );
  }

  return data as T;
}

export const apiClient = {
  async post<T>(url: string, body: any): Promise<T> {
    const response = await fetch(resolveUrl(url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return handleResponse<T>(response);
  },

  async get<T>(url: string): Promise<T> {
    const response = await fetch(resolveUrl(url));
    return handleResponse<T>(response);
  }
};
