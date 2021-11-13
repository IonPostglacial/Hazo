import { defineConfig } from 'vite';
import { createVuePlugin } from 'vite-plugin-vue2';
import path from 'path';

export default defineConfig({
  plugins: [ createVuePlugin({ vueTemplateOptions: {
    compilerOptions: {
      whitespace: "condense",
    }
  } }) ],
  server: {
    port: 8080
  },
  base: "./",
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src')
      }
    ]
  },
  build: {
    chunkSizeWarningLimit: 600,
    cssCodeSplit: false
  }
});