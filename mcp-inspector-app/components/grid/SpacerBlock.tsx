/**
 * SpacerBlock Component
 *
 * Empty cell used to maintain vertical alignment when an actor/lane
 * has no activity during a particular sequence.
 *
 * Critical for the actor-based visualization - ensures all columns
 * maintain strict vertical alignment regardless of activity.
 */
export function SpacerBlock() {
  return (
    <div
      className="min-h-[60px] bg-transparent"
      data-cell-type="spacer"
    >
      {/* Intentionally empty - maintains alignment */}
    </div>
  );
}
