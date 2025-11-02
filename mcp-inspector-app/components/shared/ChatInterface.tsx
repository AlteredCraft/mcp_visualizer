/**
 * Shared ChatInterface Component
 *
 * Unified chat interface with two variants:
 * - 'minimal': Simple input row (for root timeline view)
 * - 'full': Chat history + input (for demo page)
 *
 * Uses Zustand store for chat history and workflow execution.
 */

'use client';

import { useState } from 'react';
import { useTimelineStore } from '@/store/timeline-store';

interface ChatInterfaceProps {
  variant: 'minimal' | 'full';
  onSubmit?: (query: string) => Promise<void>;
  placeholder?: string;
}

export function ChatInterface({
  variant,
  onSubmit,
  placeholder = 'Type a message to see MCP in action...',
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const chatHistory = useTimelineStore((state) => state.chatHistory);
  const isExecuting = useTimelineStore((state) => state.isExecuting);
  const setExecuting = useTimelineStore((state) => state.setExecuting);
  const addChatMessage = useTimelineStore((state) => state.addChatMessage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isExecuting) return;

    const query = input.trim();
    setInput('');
    setExecuting(true);

    try {
      // Add user message to chat history
      addChatMessage({ role: 'user', content: query });

      // Call custom onSubmit if provided, otherwise use default workflow API
      if (onSubmit) {
        await onSubmit(query);
      } else {
        const response = await fetch('/api/workflow/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userMessage: query }),
        });

        if (!response.ok) {
          throw new Error('Workflow execution failed');
        }

        const result = await response.json();
        if (result.success) {
          addChatMessage({ role: 'assistant', content: result.finalResponse });
        } else {
          addChatMessage({ role: 'assistant', content: `Error: ${result.error}` });
        }
      }
    } catch (error: any) {
      console.error('Error executing workflow:', error);
      addChatMessage({ role: 'assistant', content: `Error: ${error.message}` });
    } finally {
      setExecuting(false);
    }
  };

  if (variant === 'minimal') {
    // Minimal variant: Simple input row spanning 5 columns (for timeline view)
    return (
      <div className="grid grid-cols-[20%_15%_15%_15%_35%] border-t-2 border-gray-300 bg-white flex-shrink-0">
        {/* Host App column - chat input */}
        <div className="p-3 border-r-2 border-gray-300 flex gap-2">
          <form onSubmit={handleSubmit} className="flex gap-2 w-full">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              disabled={isExecuting}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-full outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isExecuting || !input.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExecuting ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>

        {/* Other 4 columns - empty */}
        <div className="border-r-2 border-gray-300" />
        <div className="border-r-2 border-gray-300" />
        <div className="border-r-2 border-gray-300" />
        <div />
      </div>
    );
  }

  // Full variant: Chat history + input (for demo page)
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
        <h3 className="text-sm font-semibold text-gray-700">Chat Interface</h3>
      </div>

      {/* Chat History */}
      <div className="p-4 space-y-4 min-h-[200px] max-h-[400px] overflow-y-auto">
        {chatHistory.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            Ask a question or select a suggested query to begin
          </div>
        ) : (
          chatHistory.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="text-sm">{message.content}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Form */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isExecuting}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
          />
          <button
            type="submit"
            disabled={isExecuting || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isExecuting ? 'Running...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
