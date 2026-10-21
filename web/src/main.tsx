import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/app.css'
import App from './App.tsx'
import { createTelegramPlatform } from './telegram.ts'

const background = getComputedStyle(document.documentElement).getPropertyValue(
  '--color-bg',
)
const platform = createTelegramPlatform(window, background)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App platform={platform} />
  </StrictMode>,
)
