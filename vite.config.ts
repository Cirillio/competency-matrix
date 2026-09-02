/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('reka-ui') || id.includes('@floating-ui')) return 'vendor-reka';
            if (id.includes('lucide-vue-next')) return 'vendor-icons';
            if (id.includes('vue') || id.includes('pinia')) return 'vendor-vue';
            if (id.includes('zod')) return 'vendor-zod';
            return 'vendor';
          }
        },
      },
    },
  },
  test: {
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
