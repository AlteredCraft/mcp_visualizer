/**
 * Timeline View Component
 *
 * Displays timeline events received via SSE in real-time.
 * Shows events grouped by phase with proper formatting.
 */

'use client';

import React, { useEffect, useRef } from 'react';
import type { TimelineEvent } from '@/types/mcp';

interface TimelineViewProps {
  events: TimelineEvent[];
  autoScroll?: boolean;
}

export function TimelineView({ events, autoScroll = true }: TimelineViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events.length, autoScroll]);

  if (events.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-gray-400 text-sm">
          No events yet. Run a workflow to see the timeline in action.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
        <h3 className="text-sm font-semibold text-gray-700">
          Timeline ({events.length} events)
        </h3>
      </div>

      {/* Events */}
      <div className="max-h-[600px] overflow-y-auto">
        <div className="divide-y divide-gray-100">
          {events.map((event, index) => (
            <TimelineEventItem key={`${event.sequence}-${index}`} event={event} />
          ))}
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function TimelineEventItem({ event }: { event: TimelineEvent }) {
  const timestamp = new Date(event.timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });

  // Determine badge color based on event type and actor
  const getBadgeStyle = () => {
    if (event.eventType === 'console_log') {
      const badgeType = (event as any).badgeType;
      switch (badgeType) {
        case 'USER_INPUT':
          return 'bg-gray-100 text-gray-600';
        case 'SYSTEM':
          return 'bg-blue-100 text-blue-700';
        case 'INTERNAL':
          return 'bg-gray-100 text-gray-600';
        case 'LLM':
          return 'bg-indigo-100 text-indigo-700';
        case 'SERVER':
          return 'bg-green-100 text-green-700';
        case 'LOG':
          return 'bg-yellow-100 text-yellow-700';
        case 'COMPLETE':
          return 'bg-gray-100 text-gray-600';
        default:
          return 'bg-gray-100 text-gray-600';
      }
    } else if (event.eventType === 'protocol_message') {
      return 'bg-purple-100 text-purple-700';
    } else {
      return 'bg-orange-100 text-orange-700';
    }
  };

  const getActorLabel = () => {
    switch (event.actor) {
      case 'host_app':
        return 'Host App';
      case 'llm':
        return 'LLM';
      case 'mcp_server':
        return 'MCP Server';
      case 'external_api':
        return 'External API';
      default:
        return event.actor;
    }
  };

  const getEventContent = () => {
    if (event.eventType === 'console_log') {
      return (event as any).logMessage;
    } else if (event.eventType === 'protocol_message') {
      const msg = (event as any).message;
      return `${(event as any).direction === 'sent' ? '→' : '←'} ${msg.method || 'response'}`;
    } else if (event.eventType === 'internal_operation') {
      return (event as any).description;
    }
    return 'Unknown event';
  };

  return (
    <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3">
        {/* Sequence */}
        <div className="text-xs font-mono text-gray-400 w-8 flex-shrink-0 mt-0.5">
          #{event.sequence}
        </div>

        {/* Timestamp */}
        <div className="text-xs font-mono text-gray-500 w-24 flex-shrink-0 mt-0.5">
          {timestamp}
        </div>

        {/* Actor Badge */}
        <div className={`text-xs font-medium px-2 py-0.5 rounded ${getBadgeStyle()} flex-shrink-0`}>
          {getActorLabel()}
        </div>

        {/* Event Content */}
        <div className="text-sm text-gray-700 flex-1 break-words">
          {getEventContent()}
        </div>

        {/* Phase (if available) */}
        {event.metadata?.phase && (
          <div className="text-xs text-gray-400 italic flex-shrink-0">
            {event.metadata.phase}
          </div>
        )}
      </div>
    </div>
  );
}
