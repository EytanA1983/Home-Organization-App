/**
 * OptimizedImage Component
 * 
 * Next.js Image-like solution for optimized image loading:
 * - Responsive srcset for different screen sizes
 * - Lazy loading with IntersectionObserver
 * - Blur placeholder while loading
 * - WebP/AVIF format support with fallbacks
 * - Automatic aspect ratio preservation
 */

import React, { useState, useRef, useEffect, memo, useCallback } from 'react';

// ==================== TYPES ====================

interface ImageSource {
  src: string;
  width: number;
  type?: 'image/webp' | 'image/avif' | 'image/jpeg' | 'image/png';
}

interface OptimizedImageProps {
  /** Primary image source */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Image width */
  width?: number;
  /** Image height */
  height?: number;
  /** CSS class name */
  className?: string;
  /** Responsive srcset array */
  srcSet?: ImageSource[];
  /** Sizes attribute for responsive images */
  sizes?: string;
  /** Loading strategy */
  loading?: 'lazy' | 'eager';
  /** Placeholder type */
  placeholder?: 'blur' | 'empty' | 'color';
  /** Blur data URL for placeholder */
  blurDataURL?: string;
  /** Background color placeholder */
  placeholderColor?: string;
  /** Priority loading (disables lazy loading) */
  priority?: boolean;
  /** Object fit style */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  /** Object position */
  objectPosition?: string;
  /** On load callback */
  onLoad?: () => void;
  /** On error callback */
  onError?: () => void;
  /** Quality (1-100) for generated srcset */
  quality?: number;
  /** Enable LQIP (Low Quality Image Placeholder) */
  useLQIP?: boolean;
  /** Aspect ratio (e.g., "16/9") */
  aspectRatio?: string;
}

// ==================== UTILITIES ====================

/**
 * Generate srcset string from sources
 */
const generateSrcSet = (sources: ImageSource[]): string => {
  return sources
    .map((source) => `${source.src} ${source.width}w`)
    .join(', ');
};

/**
 * Generate default sizes based on common breakpoints
 */
const generateDefaultSizes = (width?: number): string => {
  if (!width) {
    return '100vw';
  }
  
  return `
    (max-width: 640px) 100vw,
    (max-width: 768px) 75vw,
    (max-width: 1024px) 50vw,
    ${width}px
  `.trim().replace(/\s+/g, ' ');
};

/**
 * Create blur SVG placeholder
 */
const createBlurPlaceholder = (width: number, height: number, color: string): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <filter id="b" color-interpolation-filters="sRGB">
        <feGaussianBlur stdDeviation="20"/>
      </filter>
      <rect width="100%" height="100%" fill="${color}" filter="url(#b)"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// ==================== HOOKS ====================

/**
 * Custom hook for IntersectionObserver-based lazy loading
 */
const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLDivElement>, boolean] => {
  const ref = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px', // Load images 200px before they enter viewport
        threshold: 0,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return [ref, isIntersecting];
};

// ==================== COMPONENT ====================

const OptimizedImageComponent: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  srcSet,
  sizes,
  loading = 'lazy',
  placeholder = 'blur',
  blurDataURL,
  placeholderColor = '#f3f4f6',
  priority = false,
  objectFit = 'cover',
  objectPosition = 'center',
  onLoad,
  onError,
  aspectRatio,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [containerRef, isVisible] = useIntersectionObserver();
  
  // Determine if image should load
  const shouldLoad = priority || isVisible || loading === 'eager';

  // Handle image load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  // Handle image error
  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  // Generate placeholder
  const placeholderSrc = blurDataURL || (
    placeholder === 'blur' && width && height
      ? createBlurPlaceholder(width, height, placeholderColor)
      : undefined
  );

  // Compute sizes
  const computedSizes = sizes || generateDefaultSizes(width);

  // Compute srcset
  const computedSrcSet = srcSet ? generateSrcSet(srcSet) : undefined;

  // Container styles
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
    aspectRatio: aspectRatio || (width && height ? `${width}/${height}` : undefined),
    backgroundColor: placeholder === 'color' ? placeholderColor : undefined,
  };

  // Image styles
  const imageStyle: React.CSSProperties = {
    objectFit,
    objectPosition,
    width: '100%',
    height: '100%',
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 1 : 0,
  };

  // Placeholder styles
  const placeholderStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    objectFit,
    objectPosition,
    width: '100%',
    height: '100%',
    filter: 'blur(20px)',
    transform: 'scale(1.1)',
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 0 : 1,
  };

  return (
    <div
      ref={containerRef}
      className={`optimized-image ${className}`}
      style={containerStyle}
      data-loaded={isLoaded}
    >
      {/* Blur placeholder */}
      {placeholder === 'blur' && placeholderSrc && !hasError && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          style={placeholderStyle}
          className="pointer-events-none select-none"
        />
      )}

      {/* Color placeholder */}
      {placeholder === 'color' && !isLoaded && !hasError && (
        <div
          style={{
            ...placeholderStyle,
            backgroundColor: placeholderColor,
            filter: 'none',
          }}
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      {shouldLoad && !hasError && (
        <picture>
          {/* WebP source */}
          {srcSet?.filter(s => s.type === 'image/webp').length > 0 && (
            <source
              type="image/webp"
              srcSet={generateSrcSet(srcSet.filter(s => s.type === 'image/webp'))}
              sizes={computedSizes}
            />
          )}
          
          {/* AVIF source */}
          {srcSet?.filter(s => s.type === 'image/avif').length > 0 && (
            <source
              type="image/avif"
              srcSet={generateSrcSet(srcSet.filter(s => s.type === 'image/avif'))}
              sizes={computedSizes}
            />
          )}

          {/* Default image */}
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            srcSet={computedSrcSet}
            sizes={computedSizes}
            loading={priority ? 'eager' : loading}
            decoding={priority ? 'sync' : 'async'}
            onLoad={handleLoad}
            onError={handleError}
            style={imageStyle}
            className="w-full h-full"
          />
        </picture>
      )}

      {/* Error fallback */}
      {hasError && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-dark-surface"
          role="img"
          aria-label={alt}
        >
          <span className="text-4xl">🖼️</span>
        </div>
      )}

      {/* Loading skeleton */}
      {!shouldLoad && !hasError && (
        <div
          className="absolute inset-0 bg-gray-200 dark:bg-dark-surface animate-pulse"
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export const OptimizedImage = memo(OptimizedImageComponent);
OptimizedImage.displayName = 'OptimizedImage';

// ==================== BACKGROUND IMAGE COMPONENT ====================

interface BackgroundImageProps {
  /** Image source */
  src: string;
  /** Responsive srcset */
  srcSet?: ImageSource[];
  /** Alt text for accessibility (used in aria-label) */
  alt?: string;
  /** Children to render over the background */
  children?: React.ReactNode;
  /** CSS class name */
  className?: string;
  /** Overlay color (with opacity) */
  overlay?: string;
  /** Loading strategy */
  loading?: 'lazy' | 'eager';
  /** Blur placeholder URL */
  blurDataURL?: string;
  /** Placeholder color */
  placeholderColor?: string;
  /** Object fit */
  objectFit?: 'contain' | 'cover' | 'fill';
  /** Object position */
  objectPosition?: string;
  /** Parallax effect (scroll speed 0-1) */
  parallax?: number;
}

const BackgroundImageComponent: React.FC<BackgroundImageProps> = ({
  src,
  srcSet,
  alt = '',
  children,
  className = '',
  overlay,
  loading = 'lazy',
  blurDataURL,
  placeholderColor = '#e5e7eb',
  objectFit = 'cover',
  objectPosition = 'center',
  parallax,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [containerRef, isVisible] = useIntersectionObserver();
  const parallaxRef = useRef<HTMLDivElement>(null);

  const shouldLoad = isVisible || loading === 'eager';

  // Parallax effect
  useEffect(() => {
    if (!parallax || !parallaxRef.current) return;

    const handleScroll = () => {
      if (!parallaxRef.current) return;
      const rect = parallaxRef.current.getBoundingClientRect();
      const scrolled = window.scrollY;
      const rate = parallax * 0.5;
      parallaxRef.current.style.transform = `translateY(${scrolled * rate}px)`;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [parallax]);

  // Generate srcset string
  const srcSetString = srcSet ? generateSrcSet(srcSet) : undefined;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      role="img"
      aria-label={alt}
    >
      {/* Background container */}
      <div
        ref={parallaxRef}
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundColor: placeholderColor,
        }}
      >
        {/* Blur placeholder */}
        {blurDataURL && !isLoaded && (
          <img
            src={blurDataURL}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full filter blur-lg scale-110"
            style={{ objectFit, objectPosition }}
          />
        )}

        {/* Main background image */}
        {shouldLoad && (
          <picture>
            {/* WebP source */}
            {srcSet?.filter(s => s.type === 'image/webp').length > 0 && (
              <source
                type="image/webp"
                srcSet={generateSrcSet(srcSet.filter(s => s.type === 'image/webp'))}
                sizes="100vw"
              />
            )}

            <img
              src={src}
              srcSet={srcSetString}
              sizes="100vw"
              alt=""
              aria-hidden="true"
              loading={loading}
              decoding="async"
              onLoad={() => setIsLoaded(true)}
              className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ objectFit, objectPosition }}
            />
          </picture>
        )}
      </div>

      {/* Overlay */}
      {overlay && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: overlay }}
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export const BackgroundImage = memo(BackgroundImageComponent);
BackgroundImage.displayName = 'BackgroundImage';

// ==================== ROOM BACKGROUND COMPONENT ====================

interface RoomBackgroundProps {
  /** Room type for automatic background selection */
  roomType?: string;
  /** Custom image source */
  src?: string;
  /** Custom srcset */
  srcSet?: ImageSource[];
  /** Children content */
  children?: React.ReactNode;
  /** CSS class */
  className?: string;
  /** Overlay opacity (0-1) */
  overlayOpacity?: number;
}

// Default room backgrounds (placeholder paths - replace with actual images)
const ROOM_BACKGROUNDS: Record<string, { src: string; srcSet?: ImageSource[] }> = {
  living: {
    src: '/images/rooms/living-1200.jpg',
    srcSet: [
      { src: '/images/rooms/living-400.webp', width: 400, type: 'image/webp' },
      { src: '/images/rooms/living-800.webp', width: 800, type: 'image/webp' },
      { src: '/images/rooms/living-1200.webp', width: 1200, type: 'image/webp' },
      { src: '/images/rooms/living-400.jpg', width: 400 },
      { src: '/images/rooms/living-800.jpg', width: 800 },
      { src: '/images/rooms/living-1200.jpg', width: 1200 },
    ],
  },
  kitchen: {
    src: '/images/rooms/kitchen-1200.jpg',
    srcSet: [
      { src: '/images/rooms/kitchen-400.webp', width: 400, type: 'image/webp' },
      { src: '/images/rooms/kitchen-800.webp', width: 800, type: 'image/webp' },
      { src: '/images/rooms/kitchen-1200.webp', width: 1200, type: 'image/webp' },
      { src: '/images/rooms/kitchen-400.jpg', width: 400 },
      { src: '/images/rooms/kitchen-800.jpg', width: 800 },
      { src: '/images/rooms/kitchen-1200.jpg', width: 1200 },
    ],
  },
  bedroom: {
    src: '/images/rooms/bedroom-1200.jpg',
    srcSet: [
      { src: '/images/rooms/bedroom-400.webp', width: 400, type: 'image/webp' },
      { src: '/images/rooms/bedroom-800.webp', width: 800, type: 'image/webp' },
      { src: '/images/rooms/bedroom-1200.webp', width: 1200, type: 'image/webp' },
      { src: '/images/rooms/bedroom-400.jpg', width: 400 },
      { src: '/images/rooms/bedroom-800.jpg', width: 800 },
      { src: '/images/rooms/bedroom-1200.jpg', width: 1200 },
    ],
  },
  bathroom: {
    src: '/images/rooms/bathroom-1200.jpg',
    srcSet: [
      { src: '/images/rooms/bathroom-400.webp', width: 400, type: 'image/webp' },
      { src: '/images/rooms/bathroom-800.webp', width: 800, type: 'image/webp' },
      { src: '/images/rooms/bathroom-1200.webp', width: 1200, type: 'image/webp' },
    ],
  },
  office: {
    src: '/images/rooms/office-1200.jpg',
    srcSet: [
      { src: '/images/rooms/office-400.webp', width: 400, type: 'image/webp' },
      { src: '/images/rooms/office-800.webp', width: 800, type: 'image/webp' },
      { src: '/images/rooms/office-1200.webp', width: 1200, type: 'image/webp' },
    ],
  },
  default: {
    src: '/images/rooms/default-1200.jpg',
    srcSet: [
      { src: '/images/rooms/default-400.webp', width: 400, type: 'image/webp' },
      { src: '/images/rooms/default-800.webp', width: 800, type: 'image/webp' },
      { src: '/images/rooms/default-1200.webp', width: 1200, type: 'image/webp' },
    ],
  },
};

const RoomBackgroundComponent: React.FC<RoomBackgroundProps> = ({
  roomType = 'default',
  src,
  srcSet,
  children,
  className = '',
  overlayOpacity = 0.3,
}) => {
  // Get background config
  const backgroundConfig = ROOM_BACKGROUNDS[roomType] || ROOM_BACKGROUNDS.default;
  const imageSrc = src || backgroundConfig.src;
  const imageSrcSet = srcSet || backgroundConfig.srcSet;

  return (
    <BackgroundImage
      src={imageSrc}
      srcSet={imageSrcSet}
      className={`min-h-[200px] ${className}`}
      overlay={`rgba(0, 0, 0, ${overlayOpacity})`}
      loading="lazy"
      objectFit="cover"
    >
      {children}
    </BackgroundImage>
  );
};

export const RoomBackground = memo(RoomBackgroundComponent);
RoomBackground.displayName = 'RoomBackground';

// ==================== EXPORTS ====================

export default OptimizedImage;
export type { OptimizedImageProps, BackgroundImageProps, RoomBackgroundProps, ImageSource };
