import { CLI_OPTIONS, type CLIOption } from '@/types/cli';
import { getModelDefinitionsForCli, normalizeModelId } from '@/lib/constants/cliModels';

// Claude Code is the only supported CLI
export const ACTIVE_CLI_ID = 'claude' as const;

export type ActiveCliId = typeof ACTIVE_CLI_ID;

export const DEFAULT_ACTIVE_CLI: ActiveCliId = ACTIVE_CLI_ID;

type ClaudeCliOption = CLIOption & { id: 'claude' };

const claudeOption = CLI_OPTIONS.find((option): option is ClaudeCliOption => option.id === 'claude');

if (!claudeOption) {
  throw new Error('Claude CLI configuration not found in CLI_OPTIONS');
}

export const ACTIVE_CLI_OPTION = claudeOption;

export const ACTIVE_CLI_BRAND_COLOR = ACTIVE_CLI_OPTION.brandColor ?? '#DE7356';

export const ACTIVE_CLI_NAME = ACTIVE_CLI_OPTION.name;

export const ACTIVE_CLI_ICON = ACTIVE_CLI_OPTION.icon;

export const ACTIVE_CLI_MODEL_OPTIONS = getModelDefinitionsForCli('claude').map(({ id, name }) => ({
  id: normalizeModelId('claude', id),
  name,
}));

export const sanitizeActiveCli = (cli: string | null | undefined, fallback: ActiveCliId = DEFAULT_ACTIVE_CLI): ActiveCliId => {
  // Always return 'claude' as it's the only supported CLI
  return fallback;
};

export const normalizeModelForCli = (
  _cli: string | null | undefined,
  model?: string | null,
  _fallback: ActiveCliId = DEFAULT_ACTIVE_CLI
): string => {
  // Always use Claude's model normalization
  return normalizeModelId('claude', model);
};

export interface ModelAvailabilityEntry {
  available?: boolean;
  configured?: boolean;
  models?: string[];
}

export interface ActiveModelOption {
  id: string;
  name: string;
  cli: 'claude';
  cliName: string;
  available: boolean;
}

export const buildActiveModelOptions = (statuses: Record<string, ModelAvailabilityEntry>): ActiveModelOption[] => {
  const options: ActiveModelOption[] = [];
  const status = statuses?.['claude'];
  const availableModels = new Set((status?.models ?? []).map(modelId => normalizeModelId('claude', modelId)));
  const baseAvailability = Boolean(status?.available ?? status?.configured ?? true);

  getModelDefinitionsForCli('claude').forEach(definition => {
    const normalizedId = normalizeModelId('claude', definition.id);
    const isAvailable = baseAvailability && (availableModels.size === 0 || availableModels.has(normalizedId));

    options.push({
      id: normalizedId,
      name: definition.name,
      cli: 'claude',
      cliName: ACTIVE_CLI_NAME,
      available: isAvailable,
    });
  });

  return options;
};
