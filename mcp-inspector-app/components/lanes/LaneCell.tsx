import { MessageCard } from '@/types/domain';
import { MessageCard as MessageCardComponent } from './MessageCard';

/**
 * LaneCell Component
 *
 * Wrapper component for communication lane cells.
 * Routes message cards to the appropriate MessageCard component.
 *
 * Used in communication lanes (Columns 2 and 4) to display:
 * - JSON-RPC protocol messages (initialize, tools/list, tools/call)
 * - LLM API messages (planning and synthesis inferences)
 */

interface LaneCellProps {
  card: MessageCard;
}

export function LaneCell({ card }: LaneCellProps) {
  return (
    <div className="h-full p-2">
      <MessageCardComponent card={card} />
    </div>
  );
}
