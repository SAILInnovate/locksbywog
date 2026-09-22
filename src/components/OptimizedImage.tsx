import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { srcSetFor, type ImageAsset } from '@/lib/images';

interface OptimizedImageProps {
  /** Entry from the shared image manifest. */
  asset: ImageAsset;
  alt: string;
  /** CSS `sizes` attribute describing how wide this renders at each breakpoint. */
  sizes: string;
  className?: string;
  style?: CSSProperties;
  /**
   * Above-the-fold art: skips lazy loading and raises fetch priority so the
   * browser starts on it immediately rather than after layout.
   */
  priority?: boolean;
  /** Resting opacity once loaded. Defaults to fully opaque. */
  opacity?: number;
}

/**
 * Renders a right-sized WebP from the generated set, falling back to the
 * original file for browsers without WebP support.
 *
 * Three deliberate details:
 *  - `display: contents` on <picture> keeps the <img> as the real layout child
 *    so existing w-full / h-full / object-cover classes behave unchanged.
 *  - width/height plus the manifest aspect ratio reserve space before the bytes
 *    arrive, which is what stops the page jumping around while images load.
 *  - it fades in on load, so a slow connection gets a soft reveal instead of a
 *    hard pop. If loading fails we reveal anyway, so a broken image still shows
 *    its alt text rather than staying invisible.
 */
export function OptimizedImage({
  asset,
  alt,
  sizes,
  className = '',
  style,
  priority = false,
  opacity,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // A cached image can finish before React attaches its handler, in which case
  // onLoad never fires - check `complete` once on mount to catch that.
  useEffect(() => {
    if (imgRef.current?.complete) {
      setIsLoaded(true);
    }
  }, []);

  const [aspectW, aspectH] = asset.aspect;

  // Custom properties are not part of CSSProperties, hence the cast.
  const mergedStyle = {
    ...style,
    ...(opacity !== undefined ? { '--img-opacity': opacity } : {}),
  } as CSSProperties;

  return (
    <picture className="contents">
      <source type="image/webp" srcSet={srcSetFor(asset)} sizes={sizes} />
      <img
        ref={imgRef}
        src={asset.fallback}
        alt={alt}
        width={aspectW}
        height={aspectH}
        className={`img-fade ${isLoaded ? 'is-loaded' : ''} ${className}`}
        style={mergedStyle}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsLoaded(true)}
      />
    </picture>
  );
}
