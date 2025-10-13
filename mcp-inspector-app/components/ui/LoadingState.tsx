/**
 * Loading State Component
 *
 * Displays loading indicators during workflow execution.
 * Shows different states: initializing, planning, executing, synthesizing.
 */

'use client';

import React from 'react';

export type WorkflowPhase =
  | 'idle'
  | 'initializing'
  | 'discovering'
  | 'planning'
  | 'executing'
  | 'synthesizing'
  | 'complete'
  | 'error';

interface LoadingStateProps {
  phase: WorkflowPhase;
  message?: string;
}

export function LoadingState({ phase, message }: LoadingStateProps) {
  if (phase === 'idle') {
    return null;
  }

  const getPhaseConfig = () => {
    switch (phase) {
      case 'initializing':
        return {
          label: 'Initializing',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          message: message || 'Connecting to MCP server...'
        };
      case 'discovering':
        return {
          label: 'Discovering',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          message: message || 'Discovering available tools...'
        };
      case 'planning':
        return {
          label: 'Planning',
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
          message: message || 'LLM is selecting tools...'
        };
      case 'executing':
        return {
          label: 'Executing',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          message: message || 'Executing tools via MCP...'
        };
      case 'synthesizing':
        return {
          label: 'Synthesizing',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          message: message || 'LLM is generating final response...'
        };
      case 'complete':
        return {
          label: 'Complete',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          message: message || 'Workflow complete!'
        };
      case 'error':
        return {
          label: 'Error',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          message: message || 'An error occurred'
        };
      default:
        return {
          label: 'Processing',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          message: message || 'Processing...'
        };
    }
  };

  const config = getPhaseConfig();
  const showSpinner = !['complete', 'error'].includes(phase);

  return (
    <div className={`border rounded-lg p-4 ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-center gap-3">
        {/* Spinner */}
        {showSpinner && (
          <div className="relative w-6 h-6 flex-shrink-0">
            <div className={`absolute inset-0 border-2 border-transparent border-t-current rounded-full animate-spin ${config.color}`} />
          </div>
        )}

        {/* Status Icon */}
        {phase === 'complete' && (
          <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
            <svg className={`w-5 h-5 ${config.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {phase === 'error' && (
          <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
            <svg className={`w-5 h-5 ${config.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}

        {/* Message */}
        <div className="flex-1">
          <div className={`font-semibold text-sm ${config.color}`}>
            {config.label}
          </div>
          <div className="text-sm text-gray-600 mt-0.5">
            {config.message}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline loading spinner for use in buttons
 */
export function InlineSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-block w-4 h-4 border-2 border-transparent border-t-current rounded-full animate-spin ${className}`} />
  );
}
