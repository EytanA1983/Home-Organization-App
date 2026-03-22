/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// PWA virtual module declarations
declare module 'virtual:pwa-register/react' {
  import type { Dispatch, SetStateAction } from 'react';
  
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: Error) => void;
  }
  
  export function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: [boolean, Dispatch<SetStateAction<boolean>>];
    offlineReady: [boolean, Dispatch<SetStateAction<boolean>>];
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };
}

// Allow JSON imports
declare module '*.json' {
  const value: any;
  export default value;
}

// CSS Modules type declaration
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// SVG imports
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.svg?url' {
  const url: string;
  export default url;
}

declare module '*.svg?react' {
  import React from 'react';
  const SVGComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default SVGComponent;
}

// Vite Imagetools declarations
declare module '*&imagetools' {
  const src: string;
  export default src;
}

declare module '*?w=*' {
  const src: string;
  export default src;
}

declare module '*?format=webp' {
  const src: string;
  export default src;
}

declare module '*?as=srcset' {
  const srcset: string;
  export default srcset;
}

declare module '*?as=picture' {
  interface PictureSource {
    srcset: string;
    type: string;
  }
  interface Picture {
    sources: Record<string, PictureSource[]>;
    img: {
      src: string;
      w: number;
      h: number;
    };
  }
  const picture: Picture;
  export default picture;
  export const sources: Record<string, PictureSource[]>;
  export const img: { src: string; w: number; h: number };
}

// Image imports with width
declare module '*?w=400' {
  const src: string;
  export default src;
}

declare module '*?w=800' {
  const src: string;
  export default src;
}

declare module '*?w=1200' {
  const src: string;
  export default src;
}

// Image imports with background directive
declare module '*?background' {
  interface Picture {
    sources: Record<string, { srcset: string; type: string }[]>;
    img: { src: string; w: number; h: number };
  }
  const picture: Picture;
  export default picture;
}
