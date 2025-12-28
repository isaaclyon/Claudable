/**
 * Dynamic model discovery from Anthropic API
 *
 * Fetches available models from https://api.anthropic.com/v1/models
 * with in-memory caching and fallback to static list.
 */

export interface AnthropicModelInfo {
  id: string;
  display_name: string;
  created_at: string;
  type: 'model';
}

interface ModelsApiResponse {
  data: AnthropicModelInfo[];
  first_id: string;
  last_id: string;
  has_more: boolean;
}

/** Fallback models when API is unavailable */
const FALLBACK_MODELS: AnthropicModelInfo[] = [
  {
    id: 'claude-opus-4-5-20251101',
    display_name: 'Claude Opus 4.5',
    created_at: '2025-11-01T00:00:00Z',
    type: 'model',
  },
  {
    id: 'claude-sonnet-4-5-20241022',
    display_name: 'Claude Sonnet 4.5',
    created_at: '2024-10-22T00:00:00Z',
    type: 'model',
  },
  {
    id: 'claude-3-5-haiku-20241022',
    display_name: 'Claude 3.5 Haiku',
    created_at: '2024-10-22T00:00:00Z',
    type: 'model',
  },
];

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/models';
const ANTHROPIC_VERSION = '2023-06-01';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

class ModelsCache {
  private models: AnthropicModelInfo[] | null = null;
  private fetchedAt = 0;
  private fetchPromise: Promise<AnthropicModelInfo[]> | null = null;

  async getModels(): Promise<AnthropicModelInfo[]> {
    const now = Date.now();

    // Return cached data if still valid
    if (this.models && now - this.fetchedAt < CACHE_TTL_MS) {
      return this.models;
    }

    // If a fetch is already in progress, wait for it
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    // Start a new fetch
    this.fetchPromise = this.fetchAndCache();
    try {
      return await this.fetchPromise;
    } finally {
      this.fetchPromise = null;
    }
  }

  private async fetchAndCache(): Promise<AnthropicModelInfo[]> {
    try {
      const models = await fetchModelsFromApi();
      this.models = models;
      this.fetchedAt = Date.now();
      return models;
    } catch (error) {
      // Return stale cache if available, otherwise fallback
      if (this.models) {
        console.warn('[models-api] API fetch failed, using stale cache:', error);
        return this.models;
      }
      console.warn('[models-api] API fetch failed, using fallback models:', error);
      return FALLBACK_MODELS;
    }
  }

  /** Force refresh on next getModels() call */
  invalidate(): void {
    this.models = null;
    this.fetchedAt = 0;
  }

  /** Get cached models synchronously (may be null) */
  getCachedModels(): AnthropicModelInfo[] | null {
    return this.models;
  }
}

async function fetchModelsFromApi(): Promise<AnthropicModelInfo[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn('[models-api] ANTHROPIC_API_KEY not set, using fallback models');
    return FALLBACK_MODELS;
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as ModelsApiResponse;

  if (!data.data || data.data.length === 0) {
    throw new Error('Anthropic API returned empty model list');
  }

  return data.data;
}

// Singleton cache instance
const modelsCache = new ModelsCache();

/**
 * Get available Claude models from Anthropic API (cached)
 * Returns fallback models if API is unavailable
 */
export async function getAnthropicModels(): Promise<AnthropicModelInfo[]> {
  return modelsCache.getModels();
}

/**
 * Force refresh the models cache
 */
export function invalidateModelsCache(): void {
  modelsCache.invalidate();
}

/**
 * Get cached models synchronously (may be null if not yet fetched)
 * Triggers async fetch in background if cache is empty/stale
 */
export function getCachedModelsSync(): AnthropicModelInfo[] | null {
  const cached = modelsCache.getCachedModels();

  // Trigger background refresh if no cache
  if (!cached) {
    modelsCache.getModels().catch(() => {
      // Errors already logged in cache
    });
  }

  return cached;
}

/**
 * Get fallback models (for immediate sync access when API unavailable)
 */
export function getFallbackModels(): AnthropicModelInfo[] {
  return FALLBACK_MODELS;
}
