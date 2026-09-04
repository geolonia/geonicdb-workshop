import { After, AfterAll, Before, BeforeAll, Given, Then } from '@cucumber/cucumber'
import { chromium } from 'playwright'

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:4173'

let browser
let page

BeforeAll(async () => {
  browser = await chromium.launch()
})

AfterAll(async () => {
  await browser.close()
})

Before(async () => {
  page = await browser.newPage()
})

After(async () => {
  await page.close()
})

Given('トップページを開く', async () => {
  await page.goto(BASE_URL)
})

Then('地図が表示されている', async () => {
  await page.waitForSelector('.geolonia canvas', { timeout: 15000 })
})

Then('ナビゲーションコントロールが表示されている', async () => {
  await page.waitForSelector('.maplibregl-ctrl-top-right', { timeout: 5000 })
})
