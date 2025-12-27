/**
 * CLI Hook
 * Manages Claude CLI configuration and model selection
 */
import { useState, useCallback, useEffect } from 'react';
import { CLAUDE_MODEL_DEFINITIONS } from '@/lib/constants/claudeModels';

interface UseCLIOptions {
  projectId: string;
}

interface CLIPreference {
  selectedModel: string;
}

export function useCLI({ projectId }: UseCLIOptions) {
  const [preference, setPreference] = useState<CLIPreference | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load Claude model preference
  const loadPreference = useCallback(async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';
      const response = await fetch(`${API_BASE}/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to load project preferences');
      }

      const payload = await response.json();
      const project = payload?.data ?? payload ?? {};

      const rawModel =
        typeof project?.selectedModel === 'string'
          ? project.selectedModel
          : typeof project?.selected_model === 'string'
          ? project.selected_model
          : undefined;

      setPreference({
        selectedModel: rawModel || CLAUDE_MODEL_DEFINITIONS[0]?.id || 'claude-opus-4-1',
      });
    } catch (error) {
      console.error('Failed to load Claude model preference:', error);
      setPreference({
        selectedModel: CLAUDE_MODEL_DEFINITIONS[0]?.id || 'claude-opus-4-1',
      });
    }
  }, [projectId]);

  // Update Claude model preference
  const updateModelPreference = useCallback(
    async (modelId: string) => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';
        const response = await fetch(`${API_BASE}/api/projects/${projectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selectedModel: modelId }),
        });

        if (!response.ok) throw new Error('Failed to update model preference');

        const payload = await response.json();
        const project = payload?.data ?? payload ?? {};

        const selectedModel = project.selectedModel ?? project.selected_model ?? modelId;
        setPreference({ selectedModel });

        return project;
      } catch (error) {
        console.error('Failed to update Claude model preference:', error);
        throw error;
      }
    },
    [projectId]
  );

  // Load on mount
  useEffect(() => {
    loadPreference();
  }, [loadPreference]);

  return {
    claudeModels: CLAUDE_MODEL_DEFINITIONS,
    preference,
    isLoading,
    updateModelPreference,
    reload: () => {
      loadPreference();
    },
  };
}
