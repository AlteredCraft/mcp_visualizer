'use client';

import { useState } from 'react';
import { MessageCard as MessageCardType } from '@/types/domain';
import { MESSAGE_CARD_COLORS } from '@/lib/constants';
import { PayloadModal } from '../ui/PayloadModal';

/**
 * MessageCard Component
 *
 * Displays protocol messages in communication lanes with expand/collapse functionality.
 *
 * Layout Structure (Vertical Stack):
 * 1. Badge Row: Type badge (REQUEST/RESPONSE/NOTIFICATION) with direction arrow
 * 2. Content Row: Method name (primary content, break-words for long names)
 * 3. Metadata Row: Sequence number and timing info (if applicable)
 * 4. Footer Row: Click to expand hint (separated by border)
 *
 * Visual Indicators:
 * - REQUEST: Purple left border, sequence number, arrow →
 * - RESPONSE: Gray right border, timing info (e.g., "33ms"), arrow ←
 * - NOTIFICATION: Purple left border, no sequence number, arrow →
 * - ERROR: Red border on all sides
 *
 * Interaction:
 * - Click anywhere on card to open payload modal
 * - Hover: Subtle elevation and shadow
 */

interface MessageCardProps {
  card: MessageCardType;
  onToggle?: (cardId: string) => void;
}

export function MessageCard({ card, onToggle }: MessageCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleToggle = () => {
    setIsModalOpen(true);
    onToggle?.(card.id);
  };

  // Get border styling based on card type
  const getBorderStyle = () => {
    const colors = MESSAGE_CARD_COLORS[card.type];
    const borderWidth = '4px';

    if (colors.borderSide === 'left') {
      return {
        borderLeft: `${borderWidth} solid ${colors.borderColor}`,
      };
    } else if (colors.borderSide === 'right') {
      return {
        borderRight: `${borderWidth} solid ${colors.borderColor}`,
      };
    } else {
      return {
        border: `${borderWidth} solid ${colors.borderColor}`,
      };
    }
  };

  // Get arrow indicator based on direction
  const getArrowIndicator = () => {
    return card.direction === 'sent' ? '→' : '←';
  };

  // Get badge label based on type
  const getBadgeLabel = () => {
    return card.type.toUpperCase();
  };

  // Format timing display for responses
  const getTimingDisplay = () => {
    if (card.type === 'response' && card.timing !== undefined) {
      return `${card.timing}ms`;
    }
    return null;
  };

  return (
    <div
      onClick={handleToggle}
      className="cursor-pointer transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5"
      style={getBorderStyle()}
    >
      <div className="bg-white rounded p-3 space-y-2">
        {/* Badge Row with Arrow */}
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded uppercase">
            {getBadgeLabel()}
          </span>
          <span className="text-base text-gray-400 font-bold">{getArrowIndicator()}</span>
        </div>

        {/* Method Name - Primary Content */}
        <div className="text-sm font-mono font-medium text-gray-900 break-words">
          {card.method}
        </div>

        {/* Metadata Row - Sequence and Timing */}
        {(card.sequence !== undefined || getTimingDisplay()) && (
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {card.sequence !== undefined && (
              <span className="font-mono">
                <span className="text-gray-400">seq:</span> #{card.sequence}
              </span>
            )}
            {getTimingDisplay() && (
              <span className="font-mono">
                <span className="text-gray-400">⏱</span> {getTimingDisplay()}
              </span>
            )}
          </div>
        )}

        {/* Click to expand hint */}
        <div className="flex items-center gap-2 text-xs text-gray-400 border-t border-gray-100 pt-2">
          <span className="font-mono text-gray-300">{ }</span>
          <span>Click to expand payload</span>
        </div>
      </div>

      {/* Payload Modal */}
      <PayloadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        payload={card.payload}
        title={`${card.type.toUpperCase()}: ${card.method}`}
      />
    </div>
  );
}
