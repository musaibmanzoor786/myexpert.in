import { Providers } from './providers';
import './globals.css';

export const metadata = {
  title: 'MyExpert',
  description: 'Find and book trusted local experts for any service you need.',
};

// This script safely intercepts framework logs before the AI Studio environment can crash on them
const crashShieldScript = `
  (function() {
    if (typeof window === 'undefined') return;
    const interceptLog = (method) => {
      const original = console[method];
      console[method] = function(...args) {
        const safeArgs = args.map(arg => {
          try {
            if (arg && typeof arg === 'object') {
              if (
                arg instanceof Element || 
                'nodeType' in arg || 
                Object.keys(arg).some(k => k.startsWith('__react') || k.startsWith('$$typeof'))
              ) {
                return '[Protected DOM/React Node]';
              }
              JSON.stringify(arg);
            }
            return arg;
          } catch (e) {
            return '[Circular Object Saved From Crash]';
          }
        });
        original.apply(console, safeArgs);
      };
    };
    interceptLog('log');
    interceptLog('warn');
    interceptLog('error');
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <script dangerouslySetInnerHTML={{ __html: crashShieldScript }} />
      </head>
      <body className="w-full h-full m-0 p-0 font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
