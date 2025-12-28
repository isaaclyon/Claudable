import {
  CLAUDE_MODEL_DEFINITIONS,
  getClaudeModelDefinitionsAsync,
  getClaudeModelDisplayName,
  getDefaultClaudeModel,
  normalizeClaudeModelId,
  normalizeClaudeModelIdAsync,
} from './claudeModels';
import type { ClaudeModelDefinition } from './claudeModels';

export type ModelDefinition = ClaudeModelDefinition;

/**
 * Get the default model for Claude
 * @param _cli Ignored - always returns Claude default
 */
export function getDefaultModelForCli(_cli?: string | null): string {
  return getDefaultClaudeModel();
}

/**
 * Normalize a model ID to a valid Claude model
 * @param _cli Ignored - always normalizes for Claude
 * @param model Model ID or alias to normalize
 */
export function normalizeModelId(_cli?: string | null, model?: string | null): string {
  return normalizeClaudeModelId(model);
}

/**
 * Normalize a model ID asynchronously (uses fresh API data)
 * @param _cli Ignored - always normalizes for Claude
 * @param model Model ID or alias to normalize
 */
export async function normalizeModelIdAsync(
  _cli?: string | null,
  model?: string | null
): Promise<string> {
  return normalizeClaudeModelIdAsync(model);
}

/**
 * Get the display name for a Claude model
 * @param _cli Ignored - always displays Claude model name
 * @param modelId Model ID to get display name for
 */
export function getModelDisplayName(_cli?: string | null, modelId?: string | null): string {
  return getClaudeModelDisplayName(normalizeClaudeModelId(modelId));
}

/**
 * Get all available Claude model definitions (sync, uses cache or fallback)
 * @param _cli Ignored - always returns Claude models
 */
export function getModelDefinitionsForCli(_cli?: string | null): ModelDefinition[] {
  return CLAUDE_MODEL_DEFINITIONS;
}

/**
 * Get all available Claude model definitions (async, fetches from API)
 * @param _cli Ignored - always returns Claude models
 */
export async function getModelDefinitionsForCliAsync(
  _cli?: string | null
): Promise<ModelDefinition[]> {
  return getClaudeModelDefinitionsAsync();
}

// Re-export cache invalidation for convenience
export { invalidateModelsCache } from './claudeModels';
