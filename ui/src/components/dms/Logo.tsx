/**
 * ArcKin logo.
 *
 * An open arc (continuity, the "Arc" network) cradling a heartbeat pulse
 * (the periodic check-in that proves you're alive). The gap in the ring
 * signifies the moment of silence that triggers the release.
 */
export function Logo({
  size = 36,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      role="img"
      aria-label="ArcKin logo"
    >
      {/* Outer open arc, leaves a gap at the top-right */}
      <path
        d="M38 11.5 A18 18 0 1 0 41.5 24"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        opacity="0.35"
      />
      {/* Inner arc */}
      <path
        d="M33.5 14 A12.5 12.5 0 1 0 36 24"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* Heartbeat pulse through the center */}
      <path
        d="M13 24 H19 L21.5 18 L25 30 L27.5 24 H35"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
