/**
 * ChatBubble Component
 *
 * Displays user and assistant chat messages in the Host App column.
 * User messages are right-aligned with blue background.
 * Assistant messages are left-aligned with gray background.
 */

import { CHAT_BUBBLE_COLORS } from '@/lib/constants';

export interface ChatBubbleProps {
  role: 'user' | 'assistant';
  text: string;
}

export function ChatBubble({ role, text }: ChatBubbleProps) {
  const colors = CHAT_BUBBLE_COLORS[role];

  return (
    <div
      className={`w-full flex ${
        colors.align === 'right' ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className="max-w-[85%] rounded-lg px-4 py-2 text-sm break-words"
        style={{
          backgroundColor: colors.background,
          color: colors.textColor,
        }}
      >
        {text}
      </div>
    </div>
  );
}
