import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          whitespace: "condense",
          compatConfig: {
            MODE: 3
          }
        }
      },
      script: {
        defineModel: true
      }
    }) ],
  server: {
    port: 8080
  },
  base: "./",
  resolve: {
    alias: {
      "@": path.join(__dirname, "src"),
    }
  },
  build: {
    chunkSizeWarningLimit: 600,
    cssCodeSplit: false
  }
});