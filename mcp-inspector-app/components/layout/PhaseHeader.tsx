/**
 * PhaseHeader Component
 *
 * Displays phase boundary headers that span all columns.
 * Shows phase name, description, and timing information.
 *
 * Phase headers are sticky during scroll and visually separate the five phases
 * of the MCP workflow (initialization, discovery, selection, execution, synthesis).
 */

import type { Phase } from '@/types/domain';
import { getPhaseName, getPhaseDescription } from '@/lib/phase-detector';

export interface PhaseHeaderProps {
  phase: Phase;
  timing: number; // Duration in milliseconds
}

export function PhaseHeader({ phase, timing }: PhaseHeaderProps) {
  const phaseName = getPhaseName(phase);
  const description = getPhaseDescription(phase);

  // Format timing as seconds with 2 decimal places
  const timingSeconds = (timing / 1000).toFixed(2);

  // Phase color coding for visual distinction
  const phaseColors: Record<Phase, { bg: string; text: string; border: string }> = {
    initialization: {
      bg: 'bg-blue-50',
      text: 'text-blue-900',
      border: 'border-blue-200',
    },
    discovery: {
      bg: 'bg-green-50',
      text: 'text-green-900',
      border: 'border-green-200',
    },
    selection: {
      bg: 'bg-purple-50',
      text: 'text-purple-900',
      border: 'border-purple-200',
    },
    execution: {
      bg: 'bg-orange-50',
      text: 'text-orange-900',
      border: 'border-orange-200',
    },
    synthesis: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-900',
      border: 'border-indigo-200',
    },
  };

  const colors = phaseColors[phase];

  return (
    <div
      className={`
        ${colors.bg} ${colors.text} ${colors.border}
        border-y-2 py-3 px-4
        sticky top-0 z-10
        shadow-sm
      `}
      data-phase={phase}
      data-timing={timing}
    >
      <div className="flex items-center justify-between">
        {/* Phase name and description */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold tracking-wide uppercase">
            {phaseName}
          </h3>
          <p className="text-xs mt-1 opacity-80">
            {description}
          </p>
        </div>

        {/* Timing badge */}
        {timing > 0 && (
          <div className="ml-4 flex items-center gap-2">
            <span className="text-xs font-mono opacity-70">Duration:</span>
            <span className="text-xs font-mono font-semibold bg-white bg-opacity-50 px-2 py-1 rounded">
              {timingSeconds}s
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
