/**
 * useOptimizedImage Hook
 * 
 * Provides utilities for optimized image loading:
 * - Lazy loading with IntersectionObserver
 * - Progressive loading (LQIP → full image)
 * - Preloading for priority images
 * - srcset generation
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ==================== TYPES ====================

interface ImageSource {
  src: string;
  width: number;
  type?: string;
}

interface UseOptimizedImageOptions {
  /** Enable lazy loading */
  lazy?: boolean;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Threshold for intersection */
  threshold?: number;
  /** Low quality placeholder URL */
  lqip?: string;
  /** Enable preloading */
  preload?: boolean;
}

interface UseOptimizedImageReturn {
  /** Is the image currently loading */
  isLoading: boolean;
  /** Is the image fully loaded */
  isLoaded: boolean;
  /** Has loading error occurred */
  hasError: boolean;
  /** Should the image be loaded (based on intersection) */
  shouldLoad: boolean;
  /** Ref to attach to container element */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Preload the image programmatically */
  preload: () => Promise<void>;
  /** Current image src (LQIP or full) */
  currentSrc: string | undefined;
}

// ==================== HOOK ====================

export function useOptimizedImage(
  src: string,
  options: UseOptimizedImageOptions = {}
): UseOptimizedImageReturn {
  const {
    lazy = true,
    rootMargin = '200px',
    threshold = 0,
    lqip,
    preload: shouldPreload = false,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(!lazy);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy) {
      setIsIntersecting(true);
      return;
    }

    const element = containerRef.current;
    if (!element) return;

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
      { rootMargin, threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [lazy, rootMargin, threshold]);

  // Load image when intersecting
  useEffect(() => {
    if (!isIntersecting || isLoaded) return;

    setIsLoading(true);

    const img = new Image();
    
    img.onload = () => {
      setIsLoaded(true);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
    };
    
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [isIntersecting, src, isLoaded]);

  // Preload on mount if requested
  useEffect(() => {
    if (shouldPreload && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [shouldPreload, src]);

  // Manual preload function
  const preload = useCallback(async () => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to preload image'));
      img.src = src;
    });
  }, [src]);

  // Current src (LQIP or full)
  const currentSrc = isLoaded ? src : lqip;

  return {
    isLoading,
    isLoaded,
    hasError,
    shouldLoad: isIntersecting,
    containerRef,
    preload,
    currentSrc,
  };
}

// ==================== SRCSET UTILITIES ====================

/**
 * Generate srcset string from sources
 */
export function generateSrcSet(sources: ImageSource[]): string {
  return sources
    .map((source) => `${source.src} ${source.width}w`)
    .join(', ');
}

/**
 * Generate sizes attribute
 */
export function generateSizes(options: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
  default?: string;
} = {}): string {
  const {
    mobile = '100vw',
    tablet = '75vw',
    desktop = '50vw',
    default: defaultSize = '100vw',
  } = options;

  return [
    `(max-width: 640px) ${mobile}`,
    `(max-width: 1024px) ${tablet}`,
    `(max-width: 1280px) ${desktop}`,
    defaultSize,
  ].join(', ');
}

/**
 * Generate responsive srcset from base path
 * 
 * @example
 * generateResponsiveSrcSet('/images/room', [400, 800, 1200])
 * // Returns: '/images/room-400.webp 400w, /images/room-800.webp 800w, ...'
 */
export function generateResponsiveSrcSet(
  basePath: string,
  widths: number[] = [400, 800, 1200, 1600],
  format: 'webp' | 'jpg' | 'png' = 'webp'
): ImageSource[] {
  return widths.map((width) => ({
    src: `${basePath}-${width}.${format}`,
    width,
    type: `image/${format}`,
  }));
}

/**
 * Get optimal image size based on container width
 */
export function getOptimalImageWidth(
  containerWidth: number,
  devicePixelRatio: number = window.devicePixelRatio || 1,
  availableSizes: number[] = [400, 800, 1200, 1600, 2400]
): number {
  const targetWidth = containerWidth * devicePixelRatio;
  
  // Find the smallest size that's larger than target
  const optimalSize = availableSizes.find(size => size >= targetWidth);
  
  // Return optimal or largest available
  return optimalSize || availableSizes[availableSizes.length - 1];
}

// ==================== PRELOAD UTILITIES ====================

/**
 * Preload an image
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Preload multiple images
 */
export function preloadImages(sources: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(sources.map(preloadImage));
}

/**
 * Add preload link to document head
 */
export function addPreloadLink(
  src: string,
  as: 'image' | 'style' | 'script' | 'font' = 'image',
  type?: string
): () => void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = src;
  if (type) link.type = type;
  
  document.head.appendChild(link);
  
  return () => {
    document.head.removeChild(link);
  };
}

// ==================== BLUR PLACEHOLDER ====================

/**
 * Generate blur placeholder SVG
 */
export function generateBlurPlaceholder(
  width: number,
  height: number,
  color: string = '#e5e7eb'
): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <filter id="b" color-interpolation-filters="sRGB">
        <feGaussianBlur stdDeviation="20"/>
      </filter>
      <rect width="100%" height="100%" fill="${color}" filter="url(#b)"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg.trim())}`;
}

/**
 * Generate shimmer placeholder
 */
export function generateShimmerPlaceholder(
  width: number,
  height: number
): string {
  const shimmer = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#f3f4f6"/>
          <stop offset="50%" style="stop-color:#e5e7eb"/>
          <stop offset="100%" style="stop-color:#f3f4f6"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)">
        <animate 
          attributeName="x" 
          from="-${width}" 
          to="${width}" 
          dur="1.5s" 
          repeatCount="indefinite"
        />
      </rect>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(shimmer.trim())}`;
}

export default useOptimizedImage;
