import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), crx({ manifest })],
  server: {
    // '::' binds dual-stack (both IPv6 ::1 and IPv4 127.0.0.1). This
    // machine's resolution of the literal string "localhost" is
    // inconsistent across different code paths (raw browser navigation vs.
    // @crxjs/vite-plugin's bundled service-worker HMR proxy, which
    // hardcodes `url.host = "localhost"` internally - see
    // node_modules/@crxjs/vite-plugin/dist/index.mjs) - binding to only
    // one address family left some of those paths unable to connect.
    host: '::',
    // The dev server's default CORS behavior doesn't permit a
    // chrome-extension:// origin to read its responses, which otherwise
    // breaks the service worker's own startup (it fetches its bootstrap
    // modules from this server) even once connectivity itself works.
    cors: true,
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js',
      },
    },
  },
});
