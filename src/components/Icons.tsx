import { forwardRef } from 'react';
import type { CSSProperties } from 'react';

interface IconProps {
  className?: string;
  size?: number;
  style?: CSSProperties;
}

export const StarIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ className = '', size = 48, style }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="currentColor"
      className={className}
      style={style}
    >
      <path d="M24 0L29.5 18.5L48 24L29.5 29.5L24 48L18.5 29.5L0 24L18.5 18.5L24 0Z" />
    </svg>
  )
);
StarIcon.displayName = 'StarIcon';

export const SparkleIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ className = '', size = 48, style }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="currentColor"
      className={className}
      style={style}
    >
      <path d="M24 4L27 17L40 20L27 23L24 36L21 23L8 20L21 17L24 4Z" />
      <path d="M12 28L13.5 33.5L19 35L13.5 36.5L12 42L10.5 36.5L5 35L10.5 33.5L12 28Z" />
      <path d="M36 28L37.5 33.5L43 35L37.5 36.5L36 42L34.5 36.5L29 35L34.5 33.5L36 28Z" />
    </svg>
  )
);
SparkleIcon.displayName = 'SparkleIcon';

export const InstagramIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ className = '', size = 24, style }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
);
InstagramIcon.displayName = 'InstagramIcon';

export const MapPinIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ className = '', size = 24, style }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
);
MapPinIcon.displayName = 'MapPinIcon';

export const PhoneIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ className = '', size = 24, style }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
);
PhoneIcon.displayName = 'PhoneIcon';

export const ClockIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ className = '', size = 24, style }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
);
ClockIcon.displayName = 'ClockIcon';

export const CheckIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ className = '', size = 24, style }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
);
CheckIcon.displayName = 'CheckIcon';
