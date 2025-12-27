/**
 * Claude Model Preference Hook
 * Manages Claude model selection for a project (Claude Code only)
 */
import { useState, useCallback, useEffect } from 'react';
import { CLAUDE_MODEL_DEFINITIONS, CLAUDE_DEFAULT_MODEL, getClaudeModelDisplayName } from '@/lib/constants/claudeModels';

interface UseClaudeModelPreferenceOptions {
  projectId: string;
}

interface ClaudeModelPreference {
  selectedModelId: string;
  displayName: string;
}

export function useClaudeModelPreference({ projectId }: UseClaudeModelPreferenceOptions) {
  const [preference, setPreference] = useState<ClaudeModelPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load Claude model preference from project
  const loadPreference = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';
      const response = await fetch(`${API_BASE}/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to load project');
      }

      const payload = await response.json();
      const project = payload?.data ?? payload ?? {};

      // Support both snake_case and camelCase field names
      const rawModel =
        typeof project?.selectedModel === 'string'
          ? project.selectedModel
          : typeof project?.selected_model === 'string'
          ? project.selected_model
          : undefined;

      const selectedModelId = rawModel || CLAUDE_DEFAULT_MODEL;
      const displayName = getClaudeModelDisplayName(selectedModelId);

      setPreference({
        selectedModelId,
        displayName,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load Claude model preference';
      console.error(message, err);
      setError(message);
      // Set default preference on error
      setPreference({
        selectedModelId: CLAUDE_DEFAULT_MODEL,
        displayName: getClaudeModelDisplayName(CLAUDE_DEFAULT_MODEL),
      });
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Update Claude model preference
  const updatePreference = useCallback(
    async (modelId: string) => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';
        const response = await fetch(`${API_BASE}/api/projects/${projectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selectedModel: modelId }),
        });

        if (!response.ok) {
          throw new Error('Failed to update model preference');
        }

        const payload = await response.json();
        const project = payload?.data ?? payload ?? {};

        const selectedModel = project.selectedModel ?? project.selected_model ?? modelId;
        const displayName = getClaudeModelDisplayName(selectedModel);

        setPreference({
          selectedModelId: selectedModel,
          displayName,
        });

        return project;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update model preference';
        console.error(message, err);
        setError(message);
        throw err;
      }
    },
    [projectId]
  );

  // Load preference on mount
  useEffect(() => {
    loadPreference();
  }, [loadPreference]);

  return {
    preference,
    isLoading,
    error,
    models: CLAUDE_MODEL_DEFINITIONS,
    updatePreference,
    reload: loadPreference,
  };
}
