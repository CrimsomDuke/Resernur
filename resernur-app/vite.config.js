import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html'],
      include: ['src/**/*'],
      exclude: ['src/**/*.test.jsx', 'src/**/*.spec.jsx', 'src/setupTests.js'],
      clean: false,
    },
  },
})
