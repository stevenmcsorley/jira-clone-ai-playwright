/* Temp verification script for OSS-30 / OSS-31 — deleted after run. */
const { chromium } = require('playwright')

const BASE = 'http://localhost:5173'
const SHOT = 'C:/Users/smcso/AppData/Local/Temp/claude/D--website/d1dabca4-8005-471d-8b6a-2c71236d1225/scratchpad/sprint-history.png'

async function login(page) {
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
  await page.fill('input[type="email"]', 'admin@ossicone.local')
  await page.fill('input[type="password"]', 'ossicone')
  await page.click('button[type="submit"]')
  await page.waitForURL(u => !u.href.includes('/login'), { timeout: 15000 })
}

;(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  const pageErrors = []
  page.on('pageerror', e => pageErrors.push('ISSUES pageerror: ' + e.message))

  await login(page)

  // ---------- Issues list ----------
  await page.goto(BASE + '/projects/1/issues', { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-testid="pagination-bar"]', { timeout: 15000 })

  const countText = await page.textContent('[data-testid="pagination-bar"] span')
  console.log('PAGINATION TEXT:', countText.trim())

  const firstTitle = () => page.locator('.divide-y > .grid').first().locator('a').first().textContent()

  const titleHeader = page.getByRole('button', { name: /^Title/ })
  await titleHeader.click()
  await page.waitForTimeout(300)
  const afterAsc = (await firstTitle()).trim()
  const indAsc = (await titleHeader.textContent()).trim()
  await titleHeader.click()
  await page.waitForTimeout(300)
  const afterDesc = (await firstTitle()).trim()
  const indDesc = (await titleHeader.textContent()).trim()
  console.log('SORT ASC first row title:', JSON.stringify(afterAsc), 'header:', JSON.stringify(indAsc))
  console.log('SORT DESC first row title:', JSON.stringify(afterDesc), 'header:', JSON.stringify(indDesc))
  console.log('ORDER FLIPPED:', afterAsc !== afterDesc)
  console.log('INDICATOR CHANGED:', indAsc.includes('▲') && indDesc.includes('▼'))

  // Third click -> none
  await titleHeader.click()
  await page.waitForTimeout(300)
  const indNone = (await titleHeader.textContent()).trim()
  console.log('THIRD CLICK clears indicator:', !indNone.includes('▲') && !indNone.includes('▼'))

  // ---------- Sprint history ----------
  page.removeAllListeners('pageerror')
  const histErrors = []
  page.on('pageerror', e => histErrors.push(e.message))

  await page.goto(BASE + '/projects/1/history', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  const cards = page.locator('[data-testid="sprint-card"]')
  const cardCount = await cards.count()
  console.log('SPRINT CARDS:', cardCount)

  if (cardCount > 0) {
    const firstCard = cards.first()
    console.log('FIRST CARD STATS PRESENT:',
      await firstCard.getByText('Issues completed').count() > 0,
      await firstCard.getByText('Points delivered', { exact: false }).count() > 0,
      await firstCard.getByText('Points committed').count() > 0)

    // Collapsible open/close
    const toggle = firstCard.getByRole('button', { name: /^Issues \(/ })
    await toggle.click()
    await page.waitForTimeout(200)
    const openVisible = await firstCard.locator('[data-testid="sprint-issue-list"]').isVisible().catch(() => false)
    console.log('ISSUE LIST OPENS:', openVisible)
    if (openVisible) {
      const rows = await firstCard.locator('[data-testid="sprint-issue-list"] li').count()
      console.log('ISSUE LIST ROWS:', rows)
    }
    // screenshot while open (desktop)
    await page.screenshot({ path: SHOT, fullPage: true })
    await toggle.click()
    await page.waitForTimeout(200)
    const closedGone = await firstCard.locator('[data-testid="sprint-issue-list"]').count() === 0
    console.log('ISSUE LIST CLOSES:', closedGone)
  } else {
    const emptyState = await page.getByText('No completed sprints yet').count()
    console.log('EMPTY STATE SHOWN:', emptyState > 0)
    await page.screenshot({ path: SHOT, fullPage: true })
  }

  // 390x844 overflow check
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(500)
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    return { scrollW: doc.scrollWidth, clientW: doc.clientWidth }
  })
  console.log('MOBILE 390 overflow:', JSON.stringify(overflow), 'NO H-OVERFLOW:', overflow.scrollW <= overflow.clientW)

  console.log('PAGE ERRORS issues:', pageErrors.length, 'history:', histErrors.length)
  if (pageErrors.length) console.log(pageErrors.join('\n'))
  if (histErrors.length) console.log(histErrors.join('\n'))

  await browser.close()
})().catch(e => { console.error('SCRIPT FAILED:', e); process.exit(1) })
