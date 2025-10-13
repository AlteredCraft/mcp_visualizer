/**
 * Application constants for styling and configuration
 */

import type { ConsoleBadgeType } from '@/types/domain';

// ============================================================================
// Console Badge Colors
// ============================================================================

export interface BadgeStyle {
  background: string;
  textColor: string;
  label: string;
}

export const CONSOLE_BADGE_STYLES: Record<ConsoleBadgeType, BadgeStyle> = {
  USER_INPUT: {
    background: '#f3f4f6',
    textColor: '#6b7280',
    label: 'USER INPUT',
  },
  SYSTEM: {
    background: '#dbeafe',
    textColor: '#1e40af',
    label: 'SYSTEM',
  },
  INTERNAL: {
    background: '#f3f4f6',
    textColor: '#6b7280',
    label: 'INTERNAL',
  },
  LLM: {
    background: '#e0e7ff',
    textColor: '#3730a3',
    label: 'LLM',
  },
  SERVER: {
    background: '#d1fae5',
    textColor: '#065f46',
    label: 'SERVER',
  },
  LOG: {
    background: '#fef3c7',
    textColor: '#92400e',
    label: 'LOG',
  },
  COMPLETE: {
    background: '#f3f4f6',
    textColor: '#6b7280',
    label: 'COMPLETE',
  },
};

// ============================================================================
// Message Card Colors
// ============================================================================

export const MESSAGE_CARD_COLORS = {
  request: {
    borderColor: '#10B981', // Green
    borderSide: 'left',
  },
  response: {
    borderColor: '#3B82F6', // Blue
    borderSide: 'right',
  },
  notification: {
    borderColor: '#8b5cf6', // Purple
    borderSide: 'left',
  },
  error: {
    borderColor: '#EF4444', // Red
    borderSide: 'all',
  },
} as const;

// ============================================================================
// Chat Bubble Colors
// ============================================================================

export const CHAT_BUBBLE_COLORS = {
  user: {
    background: '#2563eb', // Blue
    textColor: '#ffffff',
    align: 'right',
  },
  assistant: {
    background: '#f0f0f0', // Gray
    textColor: '#000000',
    align: 'left',
  },
} as const;

// ============================================================================
// Typography
// ============================================================================

export const FONT_FAMILIES = {
  mono: ['Monaco', 'Menlo', 'Courier New', 'monospace'],
  sans: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica',
    'Arial',
    'sans-serif',
  ],
} as const;

// ============================================================================
// Animation Timings
// ============================================================================

export const ANIMATION_TIMINGS = {
  thinkingDots: {
    duration: 1400, // ms for full cycle
    stagger: 200, // ms delay between dots
  },
  cardExpand: {
    duration: 200, // ms
  },
  cardHover: {
    duration: 150, // ms
  },
} as const;
