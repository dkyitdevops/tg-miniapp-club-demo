import { expect, test } from 'vitest'
import indexHtml from '../../index.html?raw'
import appCss from './app.css?raw'
import tokensCss from './tokens.css?raw'

test('стили компонентов берут цвета и шрифты только из токенов', () => {
  const families = [...appCss.matchAll(/font-family\s*:\s*([^;}]+)/g)].map(
    ([, value]) => value.trim(),
  )

  expect(families.length).toBeGreaterThan(0)
  expect(families.filter((family) => !family.startsWith('var(--'))).toEqual(
    [],
  )
  expect(appCss).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  expect(appCss).not.toMatch(/rgba?\(/)
})

test('фон первой отрисовки в index.html совпадает с токеном --color-bg', () => {
  const token = tokensCss.match(/--color-bg:\s*([^;]+);/)?.[1]
  const firstPaint = indexHtml.match(/<style>[^<]*\bbackground:([^;}]+)/)?.[1]
  const themeColor = indexHtml.match(
    /<meta name="theme-color" content="([^"]+)"/,
  )?.[1]

  expect(token).toBeDefined()
  expect(firstPaint).toBe(token)
  expect(themeColor).toBe(token)
})
