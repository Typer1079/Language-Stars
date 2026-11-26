import { expect, test } from '@playwright/test'
import { FAKE_SPEECH, learner, mockSupabase, signIn } from './mockSupabase'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(FAKE_SPEECH)
})

test('public pages open without signing in', async ({ page }) => {
  await mockSupabase(page)
  await page.goto('./#/privacy')
  await expect(page.locator('h1')).toContainText('Privacy Policy')
  await page.getByRole('link', { name: 'Support' }).click()
  await expect(page.locator('h1')).toHaveText('Support')
  await expect(page).toHaveTitle(/Support · Language Stars/)
  await page.getByRole('link', { name: /Language Stars/ }).click()
  await expect(page.locator('#email')).toBeVisible()
})

test('a learner reads a word, earns a star, and it is saved', async ({ page }) => {
  const state = await mockSupabase(page, { learners: [learner({ id: 'l1', display_name: 'Ethan', lifetime_stars: 41 })] })
  await signIn(page)
  await page.getByRole('button', { name: 'Play as Ethan' }).click()
  await page.locator('main button:has-text("Listen"), main button:has-text("Tap")').first().click()
  // The prompt says which word to read: Say "red"!
  const prompt = page.getByRole('status').filter({ hasText: /Say ".+"!/ }).first()
  await expect(prompt).toBeVisible()
  const word = /Say "(.+?)"!/.exec(await prompt.innerText())?.[1] ?? ''
  // Say it (again if the app wasn't listening yet) until the star is saved.
  await expect.poll(async () => {
    await page.evaluate((w) => (window as unknown as { __say: (t: string) => boolean }).__say(w), word)
    return state.learners[0].lifetime_stars
  }, { timeout: 15000, intervals: [700] }).toBeGreaterThan(41)
  expect(state.patches).toBeGreaterThan(0)
})

test('switching the subject on a learner card saves it', async ({ page }) => {
  const state = await mockSupabase(page, { learners: [learner({ id: 'l1', display_name: 'Olivia', mode: 'reading', spanish_level: 6 })] })
  await signIn(page)
  const card = page.getByRole('group', { name: 'What Olivia practices today' })
  await expect(card).toContainText('Spanish L6')
  await card.getByRole('button', { name: /Spanish/ }).click()
  await expect.poll(() => state.learners[0].mode, { timeout: 5000 }).toBe('spanish')
})

test('the microphone turns off when the app goes to the background', async ({ page }) => {
  await mockSupabase(page, { learners: [learner({ id: 'l1', display_name: 'Ethan' })] })
  await signIn(page)
  await page.getByRole('button', { name: 'Play as Ethan' }).click()
  await page.locator('main button:has-text("Listen"), main button:has-text("Tap")').first().click()
  await expect.poll(() => page.evaluate(() => (window as unknown as { __rec: { running: boolean } }).__rec?.running)).toBe(true)
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect.poll(() => page.evaluate(() => (window as unknown as { __rec: { running: boolean } }).__rec.running)).toBe(false)
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(page.getByText('Welcome back!')).toBeVisible()
  expect(await page.evaluate(() => (window as unknown as { __rec: { running: boolean } }).__rec.running)).toBe(false)
})

test('delete my account needs DELETE typed, then calls the database', async ({ page }) => {
  const state = await mockSupabase(page, { learners: [learner({ id: 'l1', display_name: 'Ethan' })] })
  await signIn(page)
  await page.getByRole('button', { name: /Account/ }).click()
  await page.getByRole('button', { name: 'Delete my account…' }).click()
  const confirm = page.locator('button.btn-danger', { hasText: 'Delete my account' })
  await expect(confirm).toBeDisabled()
  await page.fill('#confirm-close', 'DELETE')
  await confirm.click()
  await expect.poll(() => state.rpcCalls.find((c) => c.name === 'delete_my_account')?.body).toEqual({ confirm: 'DELETE' })
  await expect(page.locator('#email')).toBeVisible()
})

test('admin sees problem reports and can copy them', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const state = await mockSupabase(page, { admin: true, learners: [learner({ id: 'l1', display_name: 'Ethan' })] })
  state.problems.push({ id: 'p1', kind: 'stuck', mode: 'reading', level: 79, item: 'The hurricane damaged the city’s infrastructure.', heard: ['the hurricane damage the cities'], seconds: 96, detail: null, log: '[00:00] HEARD', device: 'iPhone · iOS 18.1 · Safari', app_version: '1.2.0', created_at: new Date().toISOString(), resolved_at: null, learner: 'l1', learner_kind: 'child', reporter: 'abc' })
  await signIn(page, 'admin@example.com')
  await page.getByRole('button', { name: /Admin/ }).click()
  await page.getByRole('navigation', { name: 'Admin sections' }).getByRole('button', { name: /Problems/ }).click()
  const problems = page.locator('#problems')
  await expect(problems).toContainText('infrastructure')
  await problems.getByRole('button', { name: /Copy all/ }).click()
  const text = await page.evaluate(() => navigator.clipboard.readText())
  expect(text).toContain('Target: The hurricane damaged')
  expect(text).toContain('Heard: "the hurricane damage the cities"')
  await expect(page.getByText(/Per-subject table: 3 rows, in sync/)).toBeVisible()
})

test('Spanish: reveal the answer, say it, earn a star', async ({ page }) => {
  const state = await mockSupabase(page, { learners: [learner({ id: 'l1', display_name: 'Olivia', mode: 'spanish', age_group: 'adult', lifetime_stars: 20 })] })
  await signIn(page)
  await page.getByRole('button', { name: 'Play as Olivia' }).click()
  await page.getByRole('button', { name: '👀 Reveal the Spanish' }).click()
  const answer = /Spanish: "(.+?)"/.exec(await page.getByText(/Spanish: "/).innerText())?.[1] ?? ''
  expect(answer).not.toBe('')
  await page.locator('main button:has-text("Listen"), main button:has-text("Tap")').first().click()
  await expect.poll(async () => {
    await page.evaluate((w) => (window as unknown as { __say: (t: string) => boolean }).__say(w), answer)
    return state.learners[0].lifetime_stars
  }, { timeout: 15000, intervals: [700] }).toBeGreaterThan(20)
})

test('Spelling Bee: letters appear as they are said', async ({ page }) => {
  const state = await mockSupabase(page, { learners: [learner({ id: 'l1', display_name: 'Ethan', mode: 'spelling', lifetime_stars: 30 })] })
  await signIn(page)
  await page.getByRole('button', { name: 'Play as Ethan' }).click()
  await expect(page.getByRole('button', { name: '🔊 Hear the word' })).toBeVisible()
  await page.getByRole('button', { name: '📖 Definition' }).click()
  await expect(page.locator('dl')).toContainText('Definition')
  await page.locator('main button:has-text("Listen"), main button:has-text("Tap")').first().click()
  // Say letters (again if the app wasn't listening yet) until they show up as tiles.
  // ("cat" is wrong unless the word is cat, so the card then shows what was spelled.)
  const card = page.getByText('🐝 Spelling Bee • listen, then spell it').locator('..')
  await expect.poll(async () => {
    await page.evaluate(() => (window as unknown as { __say: (t: string) => boolean }).__say('c a t'))
    return card.innerText()
  }, { timeout: 15000, intervals: [700] }).toMatch(/You spelled: CAT|Correct|⭐/i)
  expect(state.learners[0].mode).toBe('spelling')
})

test('Reading from level 31: a meaning question follows some items', async ({ page }) => {
  await mockSupabase(page, { learners: [learner({ id: 'l1', display_name: 'Ethan', reading_level: 40, reading_best: 40 })] })
  await signIn(page)
  await page.getByRole('button', { name: 'Play as Ethan' }).click()
  await page.locator('main button:has-text("Listen"), main button:has-text("Tap")').first().click()
  const question = page.getByRole('group', { name: 'Question' })
  // Read items until a question appears (every other item at this level).
  await expect.poll(async () => {
    if (await question.isVisible()) return true
    const prompt = await page.getByRole('status').filter({ hasText: /Say ".+"!/ }).first().innerText().catch(() => '')
    const target = /Say "(.+?)"!/.exec(prompt)?.[1]
    if (target) await page.evaluate((w) => (window as unknown as { __say: (t: string) => boolean }).__say(w), target)
    return question.isVisible()
  }, { timeout: 25000, intervals: [800] }).toBe(true)
  await question.getByRole('button').first().click()
  await expect(question).toContainText(/Yes! \+1 ⭐|Good try/)
})
