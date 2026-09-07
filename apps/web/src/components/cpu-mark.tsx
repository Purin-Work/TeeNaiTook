export function CpuMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 3v4m7-4v4m7-4v4M9 25v4m7-4v4m7-4v4M3 9h4m-4 7h4m-4 7h4M25 9h4m-4 7h4m-4 7h4"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <rect
        x="6.5"
        y="6.5"
        width="19"
        height="19"
        rx="3.5"
        stroke="currentColor"
        strokeWidth="2.4"
      />
      <rect x="10" y="10" width="12" height="12" rx="2" fill="currentColor" />
      <text
        x="16"
        y="18.1"
        textAnchor="middle"
        fill="var(--cpu-mark-label, #67e8f9)"
        fontFamily="Arial, sans-serif"
        fontSize="5.4"
        fontWeight="800"
        letterSpacing=".2"
      >
        CPU
      </text>
    </svg>
  );
}
