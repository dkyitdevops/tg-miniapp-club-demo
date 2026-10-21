import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  base: '/tg-miniapp-club-demo/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    restoreMocks: true,
    // Vitest подменяет любой CSS пустой строкой, даже с ?raw, а тест стилей
    // читает эти файлы как текст.
    css: { include: [/\.css\?raw$/] },
  },
})
