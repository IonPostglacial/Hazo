import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue'
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      //vue: '@vue/compat',
      "@": path.resolve(__dirname, 'src')
    }
  },
  plugins: [
    vue({
      server: {
        port: 8080
      },
      build: {
        chunkSizeWarningLimit: 600,
        cssCodeSplit: false
      },
      template: {
        compilerOptions: {
          compatConfig: {
            whitespace: "condense",
            MODE: 2
          }
        }
      }
    })
  ]
});