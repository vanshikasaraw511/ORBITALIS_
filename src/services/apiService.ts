/**
 * API Service for communicating with the Python FastAPI backend
 * Includes transparent fallback to client-side DSP engine if backend is offline.
 */

export interface BackendStatus {
  isAvailable: boolean;
  url: string;
  version?: string;
  lastChecked: string;
}

const DEFAULT_BACKEND_URL = 'http://localhost:8000';

export async function checkBackendHealth(baseUrl = DEFAULT_BACKEND_URL): Promise<BackendStatus> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        isAvailable: true,
        url: baseUrl,
        version: data.version || '1.0.0',
        lastChecked: new Date().toLocaleTimeString(),
      };
    }
  } catch {
    // Backend not running locally; graceful fallback to client DSP
  }

  return {
    isAvailable: false,
    url: baseUrl,
    lastChecked: new Date().toLocaleTimeString(),
  };
}
