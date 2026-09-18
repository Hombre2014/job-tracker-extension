import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), crx({ manifest })],
  server: {
    // This machine's default binding (host omitted) resolved to the IPv6
    // loopback only (::1), which some code paths couldn't reach. `::` (the
    // IPv6 *unspecified* address, not the loopback ::1) would fix that, but
    // it - and the IPv4 0.0.0.0 that Windows implicitly binds alongside it
    // in dual-stack mode - exposes the dev server to the whole local
    // network, not just this machine; CORS doesn't help here since it's a
    // browser-only restriction, not a network-level one. Explicit IPv4
    // loopback is both loopback-only and already verified sufficient: even
    // @crxjs/vite-plugin's bundled service-worker HMR proxy (which
    // hardcodes `url.host = "localhost"` internally - see
    // node_modules/@crxjs/vite-plugin/dist/index.mjs) reaches this fine.
    host: '127.0.0.1',
    // The dev server's default CORS behavior doesn't permit a
    // chrome-extension:// origin to read its responses, which otherwise
    // breaks the service worker's own startup (it fetches its bootstrap
    // modules from this server) even once connectivity itself works.
    // Restricted to chrome-extension:// origins specifically - `cors: true`
    // reflects any Origin header, which would let any website open in the
    // same browser during dev read this server's responses (source code,
    // unbundled modules), per Vite's own docs on server.cors.
    cors: {
      origin: /^chrome-extension:\/\//,
    },
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
