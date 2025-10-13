'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * JSONPayloadView Component
 *
 * Displays JSON payloads with syntax highlighting.
 * Used within MessageCard components when expanded.
 *
 * Features:
 * - Syntax highlighting using react-syntax-highlighter
 * - Pretty-printed JSON with 2-space indentation
 * - Dark theme for readability
 * - Monospace font
 */

interface JSONPayloadViewProps {
  payload: object;
  className?: string;
}

export function JSONPayloadView({ payload, className = '' }: JSONPayloadViewProps) {
  const jsonString = JSON.stringify(payload, null, 2);

  return (
    <div className={`rounded overflow-hidden ${className}`}>
      <SyntaxHighlighter
        language="json"
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '12px',
          fontSize: '12px',
          lineHeight: '1.5',
          borderRadius: '4px',
        }}
        showLineNumbers={false}
      >
        {jsonString}
      </SyntaxHighlighter>
    </div>
  );
}
