export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
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
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    return handleResponse<T>(response);
  },

  async get<T>(url: string): Promise<T> {
    const response = await fetch(url);
    return handleResponse<T>(response);
  }
};
