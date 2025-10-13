/**
 * Suggested Queries Component
 *
 * Displays pre-configured query buttons to demonstrate different workflow patterns:
 * - Single tool call
 * - Multiple tool calls
 * - Model-driven tool selection
 */

'use client';

import React from 'react';

export interface SuggestedQuery {
  id: string;
  label: string;
  query: string;
  description: string;
}

export const SUGGESTED_QUERIES: SuggestedQuery[] = [
  {
    id: 'q1',
    label: 'Single Tool Example',
    query: 'Search AWS documentation for S3 bucket naming rules',
    description: 'Demonstrates single tool call workflow'
  },
  {
    id: 'q2',
    label: 'Multiple Tools Example',
    query: 'Look up S3 bucket naming rules and show me related topics',
    description: 'Demonstrates multiple tool calls with complex alignment'
  },
  {
    id: 'q3',
    label: 'Model-Driven Selection',
    query: 'What are the security best practices for Lambda functions?',
    description: 'Demonstrates LLM autonomously selecting appropriate tools'
  }
];

interface SuggestedQueriesProps {
  onSelectQuery: (query: string) => void;
  disabled?: boolean;
}

export function SuggestedQueries({ onSelectQuery, disabled = false }: SuggestedQueriesProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Suggested Queries
      </h3>
      <div className="space-y-2">
        {SUGGESTED_QUERIES.map((suggestedQuery) => (
          <button
            key={suggestedQuery.id}
            onClick={() => onSelectQuery(suggestedQuery.query)}
            disabled={disabled}
            className={`
              w-full text-left p-3 rounded-md border transition-all
              ${disabled
                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border-gray-300 text-gray-700 hover:border-blue-500 hover:bg-blue-50 hover:shadow-md cursor-pointer'
              }
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium text-sm mb-1">
                  {suggestedQuery.label}
                </div>
                <div className="text-xs text-gray-500 mb-1">
                  {suggestedQuery.description}
                </div>
                <div className="text-xs font-mono text-gray-600 italic">
                  "{suggestedQuery.query}"
                </div>
              </div>
              <div className="ml-2 text-blue-500">
                →
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-3 text-xs text-gray-500 italic">
        Click a query to see the complete 5-phase MCP workflow in action
      </div>
    </div>
  );
}
