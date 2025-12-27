'use client';

/**
 * AI Assistant Settings Component
 * Display current Claude model selection (read-only)
 */
import React from 'react';
import { useClaudeModelPreference } from '@/hooks/useClaudeModelPreference';

interface AIAssistantSettingsProps {
  projectId: string;
}

export function AIAssistantSettings({ projectId }: AIAssistantSettingsProps) {
  const { preference, isLoading } = useClaudeModelPreference({ projectId });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Claude Code Agent
        </h3>

        <div className="space-y-4">
          {/* AI Agent Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Code Generation Agent
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Claudable uses Claude Code as the primary AI agent for generating and managing your projects.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-gray-900">
                    Claude Code
                  </span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    Configured
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Model */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Model
            </h4>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-6 bg-gray-300 rounded w-32"></div>
              </div>
            ) : (
              <>
                <span className="text-lg font-semibold text-gray-900">
                  {preference?.displayName || 'Unknown'}
                </span>
                <p className="text-xs text-gray-500 mt-2">
                  ID: {preference?.selectedModelId}
                </p>
              </>
            )}
          </div>

          {/* Note */}
          <div className="text-center pt-2">
            <p className="text-sm text-gray-500">
              To change the model, use Global Settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
