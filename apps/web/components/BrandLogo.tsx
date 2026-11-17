import type { CSSProperties } from 'react';

interface BrandLogoProps {
  size?: number | string;
  theme?: 'dark' | 'light' | 'auto';
  className?: string;
  style?: CSSProperties;
}

/**
 * Fremwork Official Brand Logo
 * Geometric C-box frame with neon volt accent block.
 * - theme="dark": white frame (for dark backgrounds like Admin Portal login)
 * - theme="light": black frame (for light backgrounds like landing pages)
 * - theme="auto": uses currentColor for frame
 */
export function BrandLogo({
  size = 22,
  theme = 'light',
  className,
  style,
}: BrandLogoProps) {
  const frameColor = theme === 'dark' ? '#FFFFFF' : theme === 'auto' ? 'currentColor' : '#0A0A0A';
  const accentColor = '#C6F432';

  return (
    <svg
      width={size}
      height={size}
      viewBox="199 199 624 624"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block', flexShrink: 0, ...style }}
      role="img"
      aria-label="Fremwork logo"
    >
      {/* Outer frame */}
      <path
        d="M 225,259 H 550 V 359 H 326 V 697 H 664 V 473 H 764 V 797 H 225 Z"
        fill={frameColor}
      />
      {/* Signature Volt neon square */}
      <rect
        x="596"
        y="225"
        width="202"
        height="202"
        fill={accentColor}
      />
    </svg>
  );
}
