/**
 * Application constants for styling and configuration
 */

import type { ConsoleBadgeType } from '@/types/domain';

// ============================================================================
// Color Palette
// ============================================================================

export const COLOR_PALETTE = {
  background: '#fdfdfa',    // Light cream
  foreground: '#2f3235',    // Dark charcoal
  primary: '#7671d4',       // Purple accent
  secondary: '#a2a1a4',     // Medium gray
  // Derived colors for UI elements
  surfaceLight: '#f5f5f3',  // Slightly darker than background
  surfaceMedium: '#e8e8e6', // Medium surface
  error: '#d97171',         // Muted red for errors
} as const;

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
    background: COLOR_PALETTE.surfaceLight,
    textColor: COLOR_PALETTE.secondary,
    label: 'USER INPUT',
  },
  SYSTEM: {
    background: COLOR_PALETTE.surfaceMedium,
    textColor: COLOR_PALETTE.foreground,
    label: 'SYSTEM',
  },
  INTERNAL: {
    background: COLOR_PALETTE.surfaceLight,
    textColor: COLOR_PALETTE.secondary,
    label: 'INTERNAL',
  },
  LLM: {
    background: '#e8e7f5', // Light purple tint
    textColor: COLOR_PALETTE.primary,
    label: 'LLM',
  },
  SERVER: {
    background: COLOR_PALETTE.surfaceMedium,
    textColor: COLOR_PALETTE.foreground,
    label: 'SERVER',
  },
  LOG: {
    background: COLOR_PALETTE.surfaceLight,
    textColor: COLOR_PALETTE.secondary,
    label: 'LOG',
  },
  COMPLETE: {
    background: COLOR_PALETTE.surfaceLight,
    textColor: COLOR_PALETTE.secondary,
    label: 'COMPLETE',
  },
};

// ============================================================================
// Message Card Colors
// ============================================================================

export const MESSAGE_CARD_COLORS = {
  request: {
    borderColor: COLOR_PALETTE.primary, // Purple
    borderSide: 'left',
  },
  response: {
    borderColor: COLOR_PALETTE.secondary, // Gray
    borderSide: 'right',
  },
  notification: {
    borderColor: COLOR_PALETTE.primary, // Purple
    borderSide: 'left',
  },
  error: {
    borderColor: COLOR_PALETTE.error, // Muted red
    borderSide: 'all',
  },
} as const;

// ============================================================================
// Chat Bubble Colors
// ============================================================================

export const CHAT_BUBBLE_COLORS = {
  user: {
    background: COLOR_PALETTE.primary, // Purple
    textColor: '#ffffff',
    align: 'right',
  },
  assistant: {
    background: COLOR_PALETTE.background, // Light cream
    textColor: COLOR_PALETTE.foreground,  // Dark charcoal
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
