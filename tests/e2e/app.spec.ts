import { expect, test } from '@playwright/test'
import { FAKE_SPEECH, learner, mockSupabase, signIn } from './mockSupabase'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { version: string }

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
  await card.getByRole('button', { name: /Languages: Spanish/ }).click()
  await page.getByRole('group', { name: 'Choose a language' }).getByRole('button', { name: /Spanish/ }).click()
  await expect(card.getByRole('button', { name: /Languages: Spanish \(practicing now\)/ })).toBeVisible()
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

test('a level change is saved per subject and is still there after reloading', async ({ page }) => {
  const state = await mockSupabase(page, { learners: [learner({ id: 'l1', display_name: 'Olivia', reading_level: 4, reading_best: 9 })] })
  await signIn(page)
  await page.getByRole('button', { name: 'Edit Olivia' }).click()
  await page.getByRole('button', { name: '📖 Reading level up' }).click()
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect.poll(() => state.learners[0].reading_level).toBe(5)
  expect(state.levelUpserts).toBeGreaterThan(0)
  expect(state.learners[0].reading_best).toBe(9)
  await page.reload()
  await expect(page.getByRole('group', { name: 'What Olivia practices today' })).toContainText('Reading L5')
})

test('an older database (before update 015) still saves levels', async ({ page }) => {
  const state = await mockSupabase(page, { levelRowsTable: false, learners: [learner({ id: 'l1', display_name: 'Olivia', spanish_level: 2 })] })
  await signIn(page)
  await page.getByRole('button', { name: 'Edit Olivia' }).click()
  await page.getByRole('button', { name: '🇪🇸 Spanish level up' }).click()
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect.poll(() => state.learners[0].spanish_level).toBe(3)
  expect(state.levelUpserts).toBe(0)
})

test('Spelling Bee: the word can be typed instead of spoken', async ({ page }) => {
  await mockSupabase(page, { learners: [learner({ id: 'l1', display_name: 'Ethan', mode: 'spelling' })] })
  await signIn(page)
  await page.getByRole('button', { name: 'Play as Ethan' }).click()
  await expect(page.getByText(/Say the letters out loud/)).toBeVisible()
  // Just start typing: no need to click the box first.
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await page.keyboard.type('zzzz')
  const box = page.getByLabel('⌨️ Or type it here')
  await expect(box).toBeFocused()
  await expect(box).toHaveValue('zzzz')
  await page.keyboard.press('Enter')
  await expect(page.getByText('You spelled: ZZZZ')).toBeVisible()
})

test('sign-up lists the password requirements and checks them before sending', async ({ page }) => {
  const state = await mockSupabase(page)
  await page.goto('./')
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.fill('#email', 'new@example.com')
  const rules = page.getByRole('list', { name: 'Password requirements' })
  await expect(rules).toContainText('At least 12 characters')
  await page.fill('#password', 'bluekite')
  await expect(rules.getByText('A lowercase letter (a–z)')).toHaveClass(/emerald/)
  await expect(rules.getByText('An uppercase letter (A–Z)')).toHaveClass(/rose/)
  await page.getByRole('button', { name: 'Show' }).click()
  await expect(page.locator('#password')).toHaveAttribute('type', 'text')
  for (const box of await page.getByRole('checkbox').all()) await box.check()
  await page.getByRole('button', { name: 'Create account' }).last().click()
  await expect(page.getByRole('alert')).toContainText('Your password still needs')
  await page.fill('#password', 'Blue-Kite-2026')
  await page.fill('#password-again', 'Blue-Kite-2025')
  await expect(page.getByText('The two passwords don’t match yet.')).toBeVisible()
  await page.fill('#password-again', 'Blue-Kite-2026')
  await page.getByRole('button', { name: 'Create account' }).last().click()
  await expect.poll(() => state.signups).toBe(1)
})

test('admin can give a free account a plan, so it is never paused for inactivity', async ({ page }) => {
  const state = await mockSupabase(page, { admin: true })
  state.users.push({ id: 'u2', email: 'family@example.com', created_at: '2026-01-01T00:00:00Z', last_sign_in_at: null, archived_at: null, archive_reason: null, is_admin: false, terms_version: null, last_active: null, paying: false, plan_status: null, last_notice: 'free_60', devices: 0, learners: [] })
  await signIn(page, 'admin@example.com')
  await page.getByRole('button', { name: /Admin/ }).click()
  await page.getByRole('navigation', { name: 'Admin sections' }).getByRole('button', { name: /Accounts/ }).click()
  const row = page.getByRole('listitem').filter({ hasText: 'family@example.com' })
  await expect(row).toContainText('FREE')
  await expect(row).toContainText('60-day reminder sent')
  await row.getByRole('button', { name: '🎁 Give plan' }).click()
  await expect(row).toContainText('PAID')
  expect(state.rpcCalls.find((c) => c.name === 'admin_set_plan')?.body).toMatchObject({ target: 'u2', new_status: 'active' })
})

test('stickers can be seen and arranged from the learner card, outside practice', async ({ page }) => {
  const stickers = [0, 4, 8].map((g, i) => ({ id: `s${i}`, emoji: '🦄', label: 'Unicorn', x: 90, y: 88, rot: 0, growCount: g }))
  const state = await mockSupabase(page, { learners: [learner({ id: 'l1', display_name: 'Ethan', stickers })] })
  await signIn(page)
  await page.getByRole('button', { name: "Ethan's stickers" }).click()
  const wall = page.getByRole('dialog', { name: /Ethan's stickers/ })
  await expect(wall).toContainText('3 stickers')
  await wall.getByRole('button', { name: '🧹 Tidy up' }).click()
  await expect.poll(() => (state.learners[0].stickers as { x: number }[]).map((s) => s.x).sort((a, b) => a - b)[0]).toBeLessThan(10)
  await wall.getByRole('button', { name: 'Bring Unicorn to the middle' }).first().click()
  await expect.poll(() => (state.learners[0].stickers as { id: string; x: number }[]).at(-1)).toMatchObject({ id: 's0', x: 40 })
  await wall.getByRole('button', { name: 'Done' }).click()
  await expect(wall).toBeHidden()
})


test('Spelling Bee: while typing, asking out loud for a sentence still works', async ({ page }) => {
  await mockSupabase(page, { learners: [learner({ id: 'l1', display_name: 'Ethan', mode: 'spelling' })] })
  await signIn(page)
  await page.getByRole('button', { name: 'Play as Ethan' }).click()
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await page.keyboard.type('ab')
  await expect(page.getByLabel('⌨️ Or type it here')).toHaveValue('ab')
  await expect(page.getByText(/You can still ask out loud/)).toBeVisible()
  // Spoken letters are ignored while typing, but a spoken request is answered.
  await expect.poll(async () => {
    await page.evaluate(() => (window as unknown as { __say: (t: string) => boolean }).__say('use it in a sentence'))
    return (await page.locator('dl').count()) ? page.locator('dl').innerText() : ''
  }, { timeout: 15000, intervals: [900] }).toMatch(/Sentence/i)
  await page.evaluate(() => (window as unknown as { __say: (t: string) => boolean }).__say('c a t'))
  await expect(page.getByText('You spelled: CAT')).toHaveCount(0)
  await expect(page.getByLabel('⌨️ Or type it here')).toHaveValue('ab')
})

test('finishing a round shows a full-screen celebration with the level and the shop', async ({ page }) => {
  const state = await mockSupabase(page, { learners: [learner({ id: 'l1', display_name: 'Ethan', lifetime_stars: 41, spendable_stars: 3 })] })
  await signIn(page)
  await page.getByRole('button', { name: 'Play as Ethan' }).click()
  await page.locator('main button:has-text("Listen"), main button:has-text("Tap")').first().click()
  const party = page.getByRole('dialog', { name: /Great round, Ethan!|Ethan graduated!/ })
  await expect.poll(async () => {
    if (await party.isVisible()) return true
    const keep = page.getByRole('button', { name: /Keep Reading/ })
    if (await keep.isVisible()) await keep.click()
    const prompt = await page.getByRole('status').filter({ hasText: /Say ".+"!/ }).first().innerText().catch(() => '')
    const target = /Say "(.+?)"!/.exec(prompt)?.[1]
    if (target) await page.evaluate((w) => (window as unknown as { __say: (t: string) => boolean }).__say(w), target)
    return party.isVisible()
  }, { timeout: 60000, intervals: [700] }).toBe(true)
  await expect(party).toContainText(/Level \d+/)
  await expect(party).toContainText(/this round/)
  await expect.poll(() => state.learners[0].lifetime_stars).toBeGreaterThan(41)
  await party.getByRole('button', { name: /Sticker Shop/ }).click()
  await page.getByRole('button', { name: /Keep Reading/ }).click()
  // Back to the celebration, then on to the next round.
  await expect(party).toBeVisible()
  await party.getByRole('button', { name: /Next Round|Start Level/ }).click()
  await expect(party).toHaveCount(0)
})

test('a new language: pick French on the card, say a word, earn a star, and its level is saved', async ({ page }) => {
  const state = await mockSupabase(page, { learners: [learner({ id: 'l1', display_name: 'Olivia', lifetime_stars: 20 })] })
  await signIn(page)
  const card = page.getByRole('group', { name: 'What Olivia practices today' })
  await card.getByRole('button', { name: /Languages:/ }).click()
  await page.getByRole('group', { name: 'Choose a language' }).getByRole('button', { name: /French/ }).click()
  await expect(card.getByRole('button', { name: /Languages: French/ })).toBeVisible()
  await expect.poll(() => state.learners[0].mode).toBe('french')
  await page.getByRole('button', { name: 'Play as Olivia' }).click()
  await expect(page.getByText('Say this English word in French')).toBeVisible()
  await page.getByRole('button', { name: '👀 Reveal the French' }).click()
  const answer = /French: "(.+?)"/.exec(await page.getByText(/French: "/).innerText())?.[1] ?? ''
  expect(answer).not.toBe('')
  await expect.poll(async () => {
    await page.evaluate((w) => (window as unknown as { __say: (t: string) => boolean }).__say(w), answer)
    return state.learners[0].lifetime_stars
  }, { timeout: 15000, intervals: [700] }).toBeGreaterThan(20)
  await expect.poll(() => state.extraLevels.l1?.french?.level).toBe(1)
})

test('Japanese is shown in English letters and heard in Japanese script', async ({ page }) => {
  const state = await mockSupabase(page, { learners: [learner({ id: 'l1', display_name: 'Ethan', mode: 'japanese', lifetime_stars: 20 })] })
  await signIn(page)
  await page.getByRole('button', { name: 'Play as Ethan' }).click()
  await page.getByRole('button', { name: '👀 Reveal the Japanese' }).click()
  const shown = /Japanese: "(.+?)"/.exec(await page.getByText(/Japanese: "/).innerText())?.[1] ?? ''
  expect(shown).toMatch(/^[a-z' ]+$/)
  const native: Record<string, string> = { konnichiwa: 'こんにちは', arigatou: 'ありがとう', onegaishimasu: 'お願いします', hai: 'はい', iie: 'いいえ',
    sayounara: 'さようなら', 'ohayou gozaimasu': 'おはようございます', oyasuminasai: 'おやすみなさい', sumimasen: 'すみません', gomennasai: 'ごめんなさい' }
  await expect.poll(async () => {
    await page.evaluate((w) => (window as unknown as { __say: (t: string) => boolean }).__say(w), native[shown] ?? shown)
    return state.learners[0].lifetime_stars
  }, { timeout: 15000, intervals: [700] }).toBeGreaterThan(20)
})

test('an older database (before update 017) only offers the first three subjects', async ({ page }) => {
  await mockSupabase(page, { subjects: ['reading', 'spanish', 'spelling'], learners: [learner({ id: 'l1', display_name: 'Olivia' })] })
  await signIn(page)
  const card = page.getByRole('group', { name: 'What Olivia practices today' })
  await expect(card).toContainText('Spanish')
  await card.getByRole('button', { name: /Languages:/ }).click()
  await expect(page.getByRole('group', { name: 'Choose a language' }).getByRole('button', { name: /Level/ })).toHaveText([/Spanish/])
})

test('Help has release notes and the version history', async ({ page }) => {
  await mockSupabase(page, { learners: [learner({ id: 'l1', display_name: 'Olivia' })] })
  await signIn(page)
  await page.getByRole('button', { name: /Help/ }).click()
  await page.getByRole('tab', { name: /What’s new/ }).click()
  await expect(page.getByRole('region', { name: `Version ${pkg.version}` })).toContainText('Latest')
  await expect(page.getByRole('region', { name: 'Version 1.0.0' })).toContainText('First release')
})

test('admin counts learners on every language and shows only the subjects in use', async ({ page }) => {
  const state = await mockSupabase(page, { admin: true, learners: [learner({ id: 'l1', display_name: 'Ethan' }), learner({ id: 'l2', display_name: 'Maius', mode: 'portuguese' })] })
  state.extraLevels.l2 = { portuguese: { level: 4, best: 4 } }
  await signIn(page, 'admin@example.com')
  await page.getByRole('button', { name: /Admin/ }).click()
  await expect(page.getByText('Reading / Spelling / Languages')).toBeVisible()
  await expect(page.getByText('🇵🇹 1')).toBeVisible()
  const table = page.locator('table').filter({ hasText: 'Levels' })
  await expect(table.locator('th')).toContainText(['Levels', '📖 Reading', '🇪🇸 Spanish', '🐝 Spelling', '🇵🇹 Portuguese'])
  await expect(table.locator('th', { hasText: 'Korean' })).toHaveCount(0)
})

test('the language list: open it, pick Tagalog, and the tile shows Tagalog right away (card and practice)', async ({ page }) => {
  const state = await mockSupabase(page, { learners: [learner({ id: 'l1', display_name: 'Ethan', spanish_level: 11 })] })
  await signIn(page)
  const card = page.getByRole('group', { name: 'What Ethan practices today' })
  await expect(card.getByRole('button', { name: /Languages: Spanish/ })).toContainText('8 languages')
  await card.getByRole('button', { name: /Languages:/ }).click()
  const list = page.getByRole('group', { name: 'Choose a language' })
  await expect(list.getByRole('button', { name: /Level/ })).toHaveCount(8)
  await list.getByRole('button', { name: /Tagalog/ }).click()
  await expect(list).toHaveCount(0)
  await expect(card.getByRole('button', { name: /Languages: Tagalog \(practicing now\)/ })).toBeVisible()
  await expect.poll(() => state.learners[0].mode, { timeout: 8000 }).toBe('tagalog')
  await page.getByRole('button', { name: 'Play as Ethan' }).click()
  const tabs = page.getByRole('group', { name: 'What to practice today' })
  await tabs.getByRole('button', { name: /Languages:/ }).click()
  await page.getByRole('group', { name: 'Choose a language' }).getByRole('button', { name: /Japanese/ }).click()
  await expect(tabs.getByRole('button', { name: /Languages: Japanese \(practicing now\)/ })).toBeVisible()
  await expect(page.getByText('Say this English word in Japanese')).toBeVisible()
  // Escape closes the list without choosing.
  await tabs.getByRole('button', { name: /Languages:/ }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('group', { name: 'Choose a language' })).toHaveCount(0)
})

test('asking Iris again and again gives more pronunciation help', async ({ page }) => {
  await mockSupabase(page, { learners: [learner({ id: 'l1', display_name: 'Ethan', mode: 'japanese' })] })
  await page.addInitScript(() => {
    const said: string[] = []
    ;(window as unknown as { __said: string[] }).__said = said
    const synth = window.speechSynthesis
    synth.speak = (u: SpeechSynthesisUtterance) => { said.push(`${u.lang}|${u.rate.toFixed(2)}|${u.text}`); setTimeout(() => u.onend?.(new Event('end') as SpeechSynthesisEvent), 5) }
    synth.getVoices = () => []
  })
  await signIn(page)
  await page.getByRole('button', { name: 'Play as Ethan' }).click()
  const ask = page.getByRole('button', { name: /Ask Iris|Slower|Piece by piece/ })
  await ask.click()
  await expect(ask).toContainText('Slower, please')
  await page.waitForTimeout(800) // presses closer than 0.7 s apart count as one
  await ask.click()
  await expect(page.getByText(/🐢 Sounds like:/)).toBeVisible()
  await expect(ask).toContainText('Piece by piece')
  await page.waitForTimeout(800)
  await ask.click()
  await expect(page.getByRole('status').filter({ hasText: 'Piece by piece' })).toBeVisible()
  const said = await page.evaluate(() => (window as unknown as { __said: string[] }).__said)
  // Slow Japanese, and single pieces (kana beats) said on their own.
  expect(said.some((x) => x.startsWith('ja-JP|0.6'))).toBe(true)
  expect(said.filter((x) => x.startsWith('ja-JP|0.60|')).some((x) => [...x.split('|')[2]].length <= 2)).toBe(true)
})

test('progress handles every language: subject filter, level charts per scale, and a table by subject', async ({ page }) => {
  const state = await mockSupabase(page, { learners: [learner({ id: 'l1', display_name: 'Olivia', mode: 'korean', reading_level: 12, reading_best: 12 })] })
  state.extraLevels.l1 = { korean: { level: 3, best: 3 }, french: { level: 2, best: 2 } }
  const at = (d: number) => new Date(Date.now() - d * 86400000).toISOString()
  const round = (mode: string, d: number, level: number) => ({ learner_id: 'l1', mode, level, level_after: level, items: 10, clean: 8, coached: 1, skipped: 1, questions: 0, questions_right: 0, stars: 8, seconds: 240, created_at: at(d) })
  state.rounds.push(round('reading', 5, 12), round('korean', 3, 2), round('korean', 1, 3), round('french', 2, 2))
  await signIn(page)
  await page.getByRole('button', { name: "Olivia's progress" }).click()
  const dialog = page.getByRole('dialog', { name: /Olivia’s progress/ })
  const filter = dialog.getByRole('group', { name: 'Show subject' })
  await expect(filter.getByRole('button')).toHaveText(['🌈 All subjects', '📖 Reading', '🇫🇷 French', '🇰🇷 Korean'])
  await expect(dialog.getByText('Language level', { exact: true })).toBeVisible()
  const table = dialog.locator('table').filter({ hasText: 'By subject' })
  await expect(table).toContainText('Korean')
  await expect(table.locator('tr', { hasText: 'Korean' })).toContainText('3 / 30')
  await filter.getByRole('button', { name: '🇰🇷 Korean' }).click()
  await expect(dialog.locator('table').filter({ hasText: 'Recent rounds' }).locator('tbody tr')).toHaveCount(2)
  await expect(table).toHaveCount(0)
})

test('admin shows practice by subject', async ({ page }) => {
  const state = await mockSupabase(page, { admin: true, learners: [learner({ id: 'l1', display_name: 'Ethan', mode: 'tagalog' })] })
  state.rounds.push({ learner_id: 'l1', mode: 'tagalog', level: 1, level_after: 1, items: 10, clean: 6, stars: 6, seconds: 300, created_at: new Date().toISOString() })
  await signIn(page, 'admin@example.com')
  await page.getByRole('button', { name: /Admin/ }).click()
  const t = page.locator('table').filter({ hasText: 'Practice by subject' })
  await expect(t.locator('tr', { hasText: 'Tagalog' })).toContainText('60%')
})

test('language levels still save on a database that refuses "insert or update" (before update 019)', async ({ page }) => {
  const state = await mockSupabase(page, { upsertDenied: true, learners: [learner({ id: 'l1', display_name: 'Daniel', mode: 'tagalog' })] })
  await signIn(page)
  await page.getByRole('button', { name: 'Edit Daniel' }).click()
  await page.getByRole('button', { name: '🇵🇭 Tagalog level up' }).click()
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect.poll(() => state.extraLevels.l1?.tagalog?.level).toBe(2)
  // The language is still offered afterwards.
  await page.getByRole('group', { name: 'What Daniel practices today' }).getByRole('button', { name: /Languages: Tagalog/ }).click()
  await expect(page.getByRole('group', { name: 'Choose a language' }).getByRole('button', { name: /Level/ })).toHaveCount(8)
})
