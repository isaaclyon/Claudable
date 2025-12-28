import {
  getAnthropicModels,
  getCachedModelsSync,
  getFallbackModels,
  type AnthropicModelInfo,
} from '@/lib/services/models-api';

export interface ClaudeModelDefinition {
  id: string;
  /** Human friendly display name */
  name: string;
  /** Optional longer description */
  description?: string;
  /** Whether the model can accept images (all current Claude models support this) */
  supportsImages?: boolean;
  /** Acceptable alias strings that should resolve to this model id */
  aliases: string[];
}

/**
 * Generate aliases from a display name
 * "Claude Opus 4.5" → ['opus', 'opus-4', 'opus-4.5', 'claude-opus', 'claude-opus-4', 'claude-opus-4.5']
 */
function generateAliasesFromDisplayName(displayName: string, id: string): string[] {
  const aliases: string[] = [id];
  const lower = displayName.toLowerCase();

  // Match patterns like "Claude Opus 4.5" or "Claude 3.5 Sonnet"
  const pattern1 = lower.match(/claude\s+(\w+)\s+([\d.]+)/); // "Claude Opus 4.5"
  const pattern2 = lower.match(/claude\s+([\d.]+)\s+(\w+)/); // "Claude 3.5 Sonnet"

  let family: string | null = null;
  let version: string | null = null;

  if (pattern1) {
    [, family, version] = pattern1;
  } else if (pattern2) {
    [, version, family] = pattern2;
  }

  if (family && version) {
    const major = version.split('.')[0];
    const versionNoDots = version.replace('.', '-');

    // Family-based aliases
    aliases.push(family);
    aliases.push(`${family}-${major}`);
    aliases.push(`${family}-${version}`);
    aliases.push(`${family}-${versionNoDots}`);

    // Claude-prefixed aliases
    aliases.push(`claude-${family}`);
    aliases.push(`claude-${family}-${major}`);
    aliases.push(`claude-${family}-${version}`);
    aliases.push(`claude-${family}-${versionNoDots}`);

    // Legacy claude-3 style aliases for backward compatibility
    aliases.push(`claude-3-${family}`);
    aliases.push(`claude-3-${family}-latest`);
  }

  // Add ID variations (replace date suffix patterns)
  const idWithoutDate = id.replace(/-\d{8}$/, '');
  if (idWithoutDate !== id) {
    aliases.push(idWithoutDate);
  }

  return [...new Set(aliases)]; // Remove duplicates
}

/**
 * Convert API model info to our definition format
 */
function apiModelToDefinition(model: AnthropicModelInfo): ClaudeModelDefinition {
  return {
    id: model.id,
    name: model.display_name,
    supportsImages: true, // All current Claude models support images
    aliases: generateAliasesFromDisplayName(model.display_name, model.id),
  };
}

/**
 * Get model definitions from cache (sync) or fallback
 * Use getClaudeModelDefinitionsAsync() for guaranteed fresh data
 */
function getModelDefinitionsSync(): ClaudeModelDefinition[] {
  const cached = getCachedModelsSync();
  const models = cached ?? getFallbackModels();
  return models.map(apiModelToDefinition);
}

/**
 * Get model definitions asynchronously (fetches from API if needed)
 */
export async function getClaudeModelDefinitionsAsync(): Promise<ClaudeModelDefinition[]> {
  const models = await getAnthropicModels();
  return models.map(apiModelToDefinition);
}

/**
 * Synchronous access to model definitions
 * Uses cached API data or fallback; triggers background refresh if stale
 * @deprecated Prefer getClaudeModelDefinitionsAsync() for guaranteed fresh data
 */
export const CLAUDE_MODEL_DEFINITIONS: ClaudeModelDefinition[] = getModelDefinitionsSync();

/**
 * Build alias map from model definitions
 */
function buildAliasMap(definitions: ClaudeModelDefinition[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const def of definitions) {
    for (const alias of def.aliases) {
      const key = alias.trim().toLowerCase().replace(/[\s_]+/g, '-');
      map[key] = def.id;
    }
    map[def.id.toLowerCase()] = def.id;
  }
  return map;
}

/**
 * Get the default Claude model
 * Uses env var ANTHROPIC_DEFAULT_MODEL if set, otherwise first Opus model
 */
export function getDefaultClaudeModel(definitions?: ClaudeModelDefinition[]): string {
  const defs = definitions ?? getModelDefinitionsSync();

  // Check for env override
  const envDefault = process.env.ANTHROPIC_DEFAULT_MODEL;
  if (envDefault && defs.some(m => m.id === envDefault)) {
    return envDefault;
  }

  // Default to first Opus model (API returns newest first)
  const opus = defs.find(m => m.name.toLowerCase().includes('opus'));
  if (opus) return opus.id;

  // Fallback to first available model
  return defs[0]?.id ?? 'claude-opus-4-5-20251101';
}

/** @deprecated Use getDefaultClaudeModel() instead */
export const CLAUDE_DEFAULT_MODEL: string = getDefaultClaudeModel();

/**
 * Normalize a model string to a valid Claude model ID
 */
export function normalizeClaudeModelId(model?: string | null): string {
  const definitions = getModelDefinitionsSync();
  const defaultModel = getDefaultClaudeModel(definitions);

  if (!model) return defaultModel;

  const aliasMap = buildAliasMap(definitions);
  const normalized = model.trim().toLowerCase().replace(/[\s_]+/g, '-');

  return aliasMap[normalized] ?? defaultModel;
}

/**
 * Normalize a model string asynchronously (uses fresh API data)
 */
export async function normalizeClaudeModelIdAsync(model?: string | null): Promise<string> {
  const definitions = await getClaudeModelDefinitionsAsync();
  const defaultModel = getDefaultClaudeModel(definitions);

  if (!model) return defaultModel;

  const aliasMap = buildAliasMap(definitions);
  const normalized = model.trim().toLowerCase().replace(/[\s_]+/g, '-');

  return aliasMap[normalized] ?? defaultModel;
}

/**
 * Get a model definition by ID or alias
 */
export function getClaudeModelDefinition(id: string): ClaudeModelDefinition | undefined {
  const definitions = getModelDefinitionsSync();
  return (
    definitions.find(def => def.id === id) ??
    definitions.find(def => def.aliases.some(alias => alias.toLowerCase() === id.toLowerCase()))
  );
}

/**
 * Get the display name for a model ID
 */
export function getClaudeModelDisplayName(id: string): string {
  return getClaudeModelDefinition(id)?.name ?? id;
}

// Re-export for convenience
export { invalidateModelsCache } from '@/lib/services/models-api';
