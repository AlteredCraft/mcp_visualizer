'use client';

/**
 * ChatInputRow Component
 *
 * Bottom chat input row spanning all 5 columns.
 * Input field in Host App column (first 20%), other 4 columns empty.
 *
 * Matches HTML mockup (docs/mcp-inspector-actor-based.html lines 1190-1201)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ChatInputRow() {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/workflow/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: input }),
      });

      if (!response.ok) {
        throw new Error('Workflow execution failed');
      }

      setInput('');
    } catch (error) {
      console.error('Error executing workflow:', error);
      alert('Failed to execute workflow. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-[20%_15%_15%_15%_35%] border-t-2 border-gray-300 bg-white flex-shrink-0">
      {/* Host App column - chat input */}
      <div className="p-3 border-r-2 border-gray-300 flex gap-2">
        <form onSubmit={handleSubmit} className="flex gap-2 w-full">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message to see MCP in action..."
            disabled={isSubmitting}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-full outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isSubmitting || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Sending...' : 'Send'}
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
