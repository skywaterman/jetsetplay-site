const pointStarts = [
  120, 243, 366, 489, 612, 735, 1136, 1259, 1382, 1505, 1628, 1751,
];

function pointColor(index: number) {
  return index % 2 === 0 ? "var(--board-light)" : "var(--board-dark)";
}

export function StaticBoard({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`static-board ${className}`}
      focusable="false"
      viewBox="0 0 2000 1406"
    >
      <rect fill="var(--board-field)" height="1406" width="2000" />
      <rect
        fill="none"
        height="1350"
        stroke="var(--board-dark)"
        strokeWidth="28"
        width="1944"
        x="28"
        y="28"
      />
      <rect fill="var(--board-dark)" height="1350" width="92" x="28" y="28" />
      <rect
        fill="var(--board-dark)"
        height="1350"
        width="92"
        x="1880"
        y="28"
      />
      {pointStarts.map((x, index) => (
        <polygon
          fill={pointColor(index)}
          key={`top-${x}`}
          points={`${x},${index % 2 === 0 ? 42 : 28} ${x + 123},${
            index % 2 === 0 ? 42 : 28
          } ${x + 61.5},606`}
        />
      ))}
      {pointStarts.map((x, index) => (
        <polygon
          fill={pointColor(index)}
          key={`bottom-${x}`}
          points={`${x},${index % 2 === 0 ? 1364 : 1378} ${x + 123},${
            index % 2 === 0 ? 1364 : 1378
          } ${x + 61.5},800`}
        />
      ))}
      <rect fill="var(--jsp-cream)" height="78" width="390" x="805" y="664" />
      <image
        height="54"
        href="/brand/jetsetplay-wordmark.svg"
        preserveAspectRatio="xMidYMid meet"
        width="342"
        x="829"
        y="676"
      />
    </svg>
  );
}
