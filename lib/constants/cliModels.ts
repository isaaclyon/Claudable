import { CLAUDE_DEFAULT_MODEL, CLAUDE_MODEL_DEFINITIONS, getClaudeModelDisplayName, normalizeClaudeModelId } from './claudeModels';
import type { ClaudeModelDefinition } from './claudeModels';

export type ModelDefinition = ClaudeModelDefinition;

/**
 * Get the default model for Claude
 * @param _cli Ignored - always returns Claude default
 */
export function getDefaultModelForCli(_cli?: string | null): string {
  return CLAUDE_DEFAULT_MODEL;
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
 * Get the display name for a Claude model
 * @param _cli Ignored - always displays Claude model name
 * @param modelId Model ID to get display name for
 */
export function getModelDisplayName(_cli?: string | null, modelId?: string | null): string {
  return getClaudeModelDisplayName(normalizeClaudeModelId(modelId));
}

/**
 * Get all available Claude model definitions
 * @param _cli Ignored - always returns Claude models
 */
export function getModelDefinitionsForCli(_cli?: string | null): ModelDefinition[] {
  return CLAUDE_MODEL_DEFINITIONS;
}
