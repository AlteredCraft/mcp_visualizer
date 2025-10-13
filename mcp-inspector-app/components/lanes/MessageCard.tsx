'use client';

import { useState } from 'react';
import { MessageCard as MessageCardType } from '@/types/domain';
import { MESSAGE_CARD_COLORS } from '@/lib/constants';
import { JSONPayloadView } from './JSONPayloadView';

/**
 * MessageCard Component
 *
 * Displays protocol messages in communication lanes with expand/collapse functionality.
 *
 * Visual Indicators:
 * - REQUEST: Green left border (#10B981), sequence number (#1, #2), arrow →
 * - RESPONSE: Blue right border (#3B82F6), timing info (e.g., "33ms"), arrow ←
 * - NOTIFICATION: Purple left border (#8b5cf6), no sequence number, arrow →
 *
 * Interaction:
 * - Collapsed: Shows method name, sequence, direction, expand button { }
 * - Expanded: Shows full JSON payload with syntax highlighting
 * - Click anywhere on card to toggle
 */

interface MessageCardProps {
  card: MessageCardType;
  onToggle?: (cardId: string) => void;
}

export function MessageCard({ card, onToggle }: MessageCardProps) {
  const [isExpanded, setIsExpanded] = useState(card.isExpanded);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
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
      <div className="bg-white rounded p-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {/* Badge */}
            <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded">
              {getBadgeLabel()}
            </span>

            {/* Method name */}
            <span className="text-sm font-mono font-medium text-gray-900">
              {card.method}
            </span>

            {/* Sequence number (for requests and responses) */}
            {card.sequence !== undefined && (
              <span className="text-xs text-gray-500 font-mono">
                #{card.sequence}
              </span>
            )}
          </div>

          {/* Arrow and timing */}
          <div className="flex items-center gap-2">
            {getTimingDisplay() && (
              <span className="text-xs text-gray-500 font-mono">
                {getTimingDisplay()}
              </span>
            )}
            <span className="text-lg text-gray-400">{getArrowIndicator()}</span>
          </div>
        </div>

        {/* Expand/Collapse button */}
        {!isExpanded && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="font-mono">{ }</span>
            <span>Click to expand payload</span>
          </div>
        )}

        {/* Expanded JSON payload */}
        {isExpanded && (
          <div className="mt-3">
            <JSONPayloadView payload={card.payload} />
          </div>
        )}
      </div>
    </div>
  );
}
