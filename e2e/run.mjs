import { execSync, spawn, spawnSync } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const PORT = 4173
const BASE_URL = `http://localhost:${PORT}`

execSync('npm run build', { stdio: 'inherit' })

const preview = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  stdio: 'inherit',
})

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(BASE_URL)
      if (res.ok) return
    } catch {
      // まだ起動していない
    }
    await sleep(500)
  }
  throw new Error(`${BASE_URL} が起動しませんでした`)
}

let exitCode = 1
try {
  await waitForServer()
  const result = spawnSync(
    'npx',
    ['cucumber-js', 'e2e/features/**/*.feature', '--import', 'e2e/steps/**/*.mjs'],
    { stdio: 'inherit', env: { ...process.env, E2E_BASE_URL: BASE_URL } },
  )
  exitCode = result.status ?? 1
} finally {
  preview.kill()
}

process.exit(exitCode)
