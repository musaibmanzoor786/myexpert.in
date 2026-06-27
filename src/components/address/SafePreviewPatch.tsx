'use client';

import { useEffect } from 'react';

export default function SafePreviewPatch() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sanitizeLogArguments = (originalConsoleMethod: Function) => {
      return (...args: any[]) => {
        const sanitizedArgs = args.map(arg => {
          // 1. If it's a DOM element, convert it to a safe text representation
          if (arg instanceof HTMLElement || (arg && arg.nodeType)) {
            return `<${arg.tagName?.toLowerCase()} id="${arg.id || ''}" class="${arg.className || ''}">`;
          }
          
          // 2. If it's an explicit Error object, flatten out its parameters
          if (arg instanceof Error) {
            return { name: arg.name, message: arg.message, stack: arg.stack };
          }

          // 3. If it's a generic object, break any circular references safely
          if (arg && typeof arg === 'object') {
            try {
              const seen = new Set();
              const serialized = JSON.stringify(arg, (key, value) => {
                if (typeof value === 'object' && value !== null) {
                  if (seen.has(value)) return '[Circular Ref]';
                  seen.add(value);
                }
                return value;
              });
              return JSON.parse(serialized);
            } catch (e) {
              return `[Safe-Filtered Circular ${arg.constructor?.name || 'Object'}]`;
            }
          }
          return arg;
        });
        
        originalConsoleMethod(...sanitizedArgs);
      };
    };

    // Intercept standard logs before the preview iframe can read them
    console.log = sanitizeLogArguments(console.log);
    console.error = sanitizeLogArguments(console.error);
    console.warn = sanitizeLogArguments(console.warn);
    console.info = sanitizeLogArguments(console.info);
    console.debug = sanitizeLogArguments(console.debug);
  }, []);

  return null;
}