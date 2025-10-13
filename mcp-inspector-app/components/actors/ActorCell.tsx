/**
 * ActorCell Component
 *
 * Wrapper component that routes cell content to the appropriate actor component.
 * Handles rendering of chat bubbles, console blocks, and thinking indicators.
 */

import type { CellContent } from '@/types/domain';
import { ChatBubble } from './ChatBubble';
import { ConsoleBlock } from './ConsoleBlock';
import { ThinkingIndicator } from './ThinkingIndicator';

export interface ActorCellProps {
  content: CellContent;
}

export function ActorCell({ content }: ActorCellProps) {
  switch (content.type) {
    case 'chat_bubble':
      return <ChatBubble role={content.role} text={content.text} />;

    case 'console_log':
      return <ConsoleBlock event={content.event} />;

    case 'thinking_indicator':
      return <ThinkingIndicator message={content.message} />;

    case 'phase_header':
      // Phase headers span all columns and are handled separately
      // This case should not occur in ActorCell
      return null;

    case 'message_card':
      // Message cards appear in lane columns, not actor columns
      // This case should not occur in ActorCell
      return null;

    default:
      // Exhaustive type checking
      const _exhaustive: never = content;
      return null;
  }
}
