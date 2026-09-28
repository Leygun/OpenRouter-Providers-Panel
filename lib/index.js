/**
 * Host half of the OpenRouter providers panel.
 *
 * Publishes one buffered POST route on the shared /api channel
 * (`/api/openrouter-providers`) that the browser half calls. The channel applies
 * the Host/Origin fence and browser-session authentication before dispatch, so
 * this plugin owns no authentication of its own.
 *
 * @module dsh-openrouter-providers
 */

/** Stable Cordis plugin name. */
export const name = 'openrouter-providers'

/** Route path inside the shared /api channel. */
const ROUTE_PATH = '/openrouter-providers'

/**
 * Register the panel's Host half.
 * @param ctx - owning Cordis context.
 */
export function apply(ctx) {

    const table = {}
    const harness = { handle: function (method, handler) { table[method] = handler } }

    const MODEL = 'deepseek/deepseek-v4.1-flash'
    const OR_BASE = 'https://openrouter.ai'
    const SOURCE = OR_BASE + '/api/v1/models/' + MODEL + '/endpoints'
    const PAGE_URL = OR_BASE + '/' + MODEL
    const GUARDRAILS_PATH = '/api/v1/guardrails'
    const PRIVACY_URL = OR_BASE + '/settings/privacy'
    const KEYS_URL = OR_BASE + '/settings/management-keys'
    const KEY_REF = 'OPENROUTER_MANAGEMENT_KEY'
    const DEFAULT_GUARDRAIL_NAME = 'DSH · DeepSeek V4.1 Flash'
    const W_COST = 0.6
    const W_SPEED = 0.4

    const state = {
      model: MODEL,
      source: SOURCE,
      pageUrl: PAGE_URL,
      scannedAt: null,
      scannedAtLabel: null,
      providers: [],
      top: [],
      topBalanced: [],
      applied: [],
      appliedMode: null,
      speed: {
        available: false,
        matched: 0,
        source: PAGE_URL,
        note: 'Скорость ещё не проверена',
        weights: { cost: W_COST, speed: W_SPEED },
      },
      error: null,
      speedError: null,
    }

    function num(value) {
      if (value === null || value === undefined || value === '') return null
      const n = typeof value === 'number' ? value : Number(value)
      return Number.isFinite(n) ? n : null
    }

    function perMillion(value) {
      const n = num(value)
      return n === null ? null : Math.round(n * 1e6 * 1e6) / 1e6
    }

    function slugOf(entry) {
      const tag = typeof entry.tag === 'string' ? entry.tag : ''
      const base = tag.split('/')[0].trim().toLowerCase()
      if (base) return base
      const name = typeof entry.provider_name === 'string' ? entry.provider_name : ''
      return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
    }

    function buildRow(entry) {
      if (!entry || typeof entry !== 'object') return null
      const pricing = entry.pricing
      if (!pricing || typeof pricing !== 'object') return null
      const prompt = perMillion(pricing.prompt)
      const completion = perMillion(pricing.completion)
      if (prompt === null || completion === null) return null
      const cacheRead = perMillion(pricing.input_cache_read)
      const blend = Math.round((prompt * 0.75 + completion * 0.25) * 1e6) / 1e6
      const u30 = num(entry.uptime_last_30m)
      const u1d = num(entry.uptime_last_1d)
      const uptime = u30 === null ? u1d : u30
      const params = Array.isArray(entry.supported_parameters) ? entry.supported_parameters : []
      const tools = params.indexOf('tools') >= 0
      const reliability = uptime === null ? 0.97 : Math.min(Math.max(uptime, 1), 100) / 100
      const score = Math.round((blend / reliability) * 1e6) / 1e6
      return {
        slug: slugOf(entry),
        name: typeof entry.provider_name === 'string' ? entry.provider_name : slugOf(entry),
        tag: typeof entry.tag === 'string' ? entry.tag : '',
        prompt: prompt,
        completion: completion,
        cacheRead: cacheRead,
        blend: blend,
        uptime30: u30,
        uptime1d: u1d,
        tps: null,
        latencyMs: null,
        tpsRequests: null,
        balanced: null,
        tools: tools,
        contextLength: num(entry.context_length),
        maxCompletionTokens: num(entry.max_completion_tokens),
        quantization: typeof entry.quantization === 'string' ? entry.quantization : 'unknown',
        status: num(entry.status),
        throughput: num(entry.throughput_last_30m),
        latency: num(entry.latency_last_30m),
        endpoints: 1,
        eligible: tools && (uptime === null || uptime >= 90),
        score: score,
      }
    }

    function dedupe(rows) {
      const bySlug = {}
      const out = []
      rows.forEach(function (row) {
        const seen = bySlug[row.slug]
        if (seen === undefined) {
          bySlug[row.slug] = row
          out.push(row)
          return
        }
        seen.endpoints = seen.endpoints + 1
        if (row.score < seen.score) {
          const count = seen.endpoints
          Object.keys(row).forEach(function (key) { seen[key] = row[key] })
          seen.endpoints = count
        }
      })
      return out
    }

    function ranked(rows) {
      const list = rows.slice().sort(function (a, b) { return a.score - b.score })
      list.forEach(function (row, index) { row.rank = index + 1 })
      return list
    }

    function pickTop(rows) {
      const strict = rows.filter(function (row) { return row.eligible })
      const pool = strict.length >= 2 ? strict : rows.filter(function (row) { return row.tools })
      const chosen = []
      pool.forEach(function (row) {
        if (chosen.length >= 2) return
        if (chosen.indexOf(row.slug) >= 0) return
        chosen.push(row.slug)
      })
      return chosen
    }

    function computeBalanced() {
      state.topBalanced = []
      const pool = state.providers.filter(function (row) {
        return row.eligible && typeof row.tps === 'number' && row.tps > 0
      })
      if (pool.length < 2) return
      let minCost = null
      let maxCost = null
      let minTps = null
      let maxTps = null
      pool.forEach(function (row) {
        if (minCost === null || row.score < minCost) minCost = row.score
        if (maxCost === null || row.score > maxCost) maxCost = row.score
        if (minTps === null || row.tps < minTps) minTps = row.tps
        if (maxTps === null || row.tps > maxTps) maxTps = row.tps
      })
      pool.forEach(function (row) {
        const normCost = maxCost > minCost ? (row.score - minCost) / (maxCost - minCost) : 0
        const normSpeed = maxTps > minTps ? (maxTps - row.tps) / (maxTps - minTps) : 0
        row.balanced = Math.round((W_COST * normCost + W_SPEED * normSpeed) * 1000) / 1000
      })
      const ordered = pool.slice().sort(function (a, b) {
        if (a.balanced !== b.balanced) return a.balanced - b.balanced
        const al = a.latencyMs === null ? 1e9 : a.latencyMs
        const bl = b.latencyMs === null ? 1e9 : b.latencyMs
        return al - bl
      })
      state.topBalanced = ordered.slice(0, 2).map(function (row) { return row.slug })
    }

    function buildSnippet() {
      if (state.applied.length === 0) return ''
      const lines = ['llm-pi-ai:', '  providers:']
      state.applied.forEach(function (item) {
        lines.push('    openrt-' + item.slug + ':')
        lines.push('      apiKeyEnv: OPENRT_API_KEY')
        lines.push('      api: openai-completions')
        lines.push('      baseURL: https://openrouter.ai/api/v1')
        lines.push('      models:')
        lines.push('        - id: ' + MODEL)
        lines.push('          name: DeepSeek V4.1 Flash (' + item.name + ')')
        lines.push('          contextWindow: 1048576')
        lines.push('          maxTokens: 393216')
        lines.push('          input: [text, image]')
      })
      return lines.join('\n')
    }

    function snapshot() {
      return {
        ok: state.error === null,
        error: state.error,
        model: state.model,
        source: state.source,
        pageUrl: state.pageUrl,
        scannedAt: state.scannedAt,
        scannedAtLabel: state.scannedAtLabel,
        providers: state.providers,
        top: state.top,
        topBalanced: state.topBalanced,
        applied: state.applied,
        appliedMode: state.appliedMode,
        speed: state.speed,
        snippet: buildSnippet(),
        rules: {
          weightInput: 0.75,
          weightOutput: 0.25,
          minUptime: 90,
          toolsRequired: true,
          balancedCost: W_COST,
          balancedSpeed: W_SPEED,
        },
      }
    }

    function appliedEntry(row, role, mode) {
      return {
        slug: row.slug,
        name: row.name,
        role: role,
        mode: mode,
        prompt: row.prompt,
        completion: row.completion,
        blend: row.blend,
        score: row.score,
        balanced: typeof row.balanced === 'number' ? row.balanced : null,
        tps: typeof row.tps === 'number' ? row.tps : null,
        latencyMs: typeof row.latencyMs === 'number' ? row.latencyMs : null,
        uptime30: row.uptime30,
        uptime1d: row.uptime1d,
        at: state.scannedAtLabel,
      }
    }

    function refreshApplied() {
      if (state.applied.length === 0) return
      const bySlug = {}
      state.providers.forEach(function (row) { bySlug[row.slug] = row })
      const next = []
      state.applied.forEach(function (item, index) {
        const row = bySlug[item.slug]
        if (row === undefined) return
        next.push(appliedEntry(row, item.role || (index === 0 ? 'Основной' : 'Резервный'), item.mode || 'cost'))
      })
      state.applied = next
    }

    async function scan() {
      state.error = null
      state.speedError = null
      const fetched = await httpText(SOURCE)
      if (fetched.ok !== true) {
        state.error = 'Запрос к OpenRouter не удался: ' + fetched.error
        return snapshot()
      }
      const text = fetched.text
      let parsed = null
      try {
        parsed = JSON.parse(text)
      } catch (err) {
        state.error = 'Ответ OpenRouter не разобран как JSON'
        return snapshot()
      }
      const data = parsed && parsed.data
      const endpoints = data && Array.isArray(data.endpoints) ? data.endpoints : []
      if (endpoints.length === 0) {
        state.error = 'OpenRouter не вернул ни одного провайдера для ' + MODEL
        return snapshot()
      }
      const rows = []
      endpoints.forEach(function (entry) {
        const row = buildRow(entry)
        if (row !== null) rows.push(row)
      })
      if (rows.length === 0) {
        state.error = 'Ни у одного провайдера нет полной пары цен'
        return snapshot()
      }
      state.providers = ranked(dedupe(rows))
      state.top = pickTop(state.providers)
      state.scannedAt = new Date().toISOString()
      state.scannedAtLabel = state.scannedAt.slice(11, 19) + ' UTC'

      const page = await fetchPage()
      let statsMap = {}
      if (page.ok === true) {
        statsMap = parseStats(page.text)
        state.speedError = null
      } else {
        state.speedError = page.error
      }
      let matched = 0
      state.providers.forEach(function (row) {
        const stat = statsMap[row.name]
        if (stat === undefined) {
          row.tps = null
          row.latencyMs = null
          row.tpsRequests = null
          return
        }
        matched = matched + 1
        row.tps = stat.tps
        row.latencyMs = stat.latencyMs
        row.tpsRequests = stat.requests
      })
      computeBalanced()
      state.speed = {
        available: state.topBalanced.length >= 2,
        matched: matched,
        source: PAGE_URL,
        note: state.speedError !== null
          ? 'Скорость недоступна: ' + state.speedError
          : (state.topBalanced.length >= 2
              ? 'p50 throughput / p50 latency за 30 мин со страницы модели'
              : 'Со страницы модели не пришло достаточно данных о скорости'),
        weights: { cost: W_COST, speed: W_SPEED },
      }
      refreshApplied()
      return snapshot()
    }

    function parseStats(html) {
      const map = {}
      if (typeof html !== 'string' || html.length === 0) return map
      const normalized = html.split('\\"').join('"')
      const statsRe = /"stats":\{[^{}]*\}/g
      const provRe = /"provider_name":"([^"]+)"/g
      let match
      while ((match = statsRe.exec(normalized)) !== null) {
        let parsed = null
        try {
          parsed = JSON.parse(match[0].slice(8))
        } catch (err) {
          continue
        }
        const head = normalized.slice(Math.max(0, match.index - 60000), match.index)
        let name = null
        let found
        provRe.lastIndex = 0
        while ((found = provRe.exec(head)) !== null) name = found[1]
        if (name === null) continue
        const tps = num(parsed.p50_throughput)
        const latencyMs = num(parsed.p50_latency)
        const requests = num(parsed.request_count)
        const previous = map[name]
        if (previous === undefined || (requests === null ? 0 : requests) > (previous.requests === null ? 0 : previous.requests)) {
          map[name] = { tps: tps, latencyMs: latencyMs, requests: requests, windowMinutes: num(parsed.window_minutes) }
        }
      }
      return map
    }

    /**
     * Fetch one URL as text.
     *
     * The global fetch is the primary transport: it carries request headers
     * (which the guardrail API needs) and behaves identically on macOS, Linux
     * and Windows Desktop profiles. The harness `web` service is the fallback,
     * so a profile that reaches the network through its configured HTTP proxy
     * still works; that service cannot send headers, which is why it is only a
     * fallback.
     *
     * @param url - absolute URL to retrieve.
     * @returns owned JSON-safe text plus a human-readable error on failure.
     */
    async function httpText(url) {
      let directError = null
      try {
        const response = await fetch(url, {
          headers: { 'user-agent': 'dsh-openrouter-providers' },
          signal: AbortSignal.timeout(60000),
        })
        if (response.status < 200 || response.status >= 300) {
          return { ok: false, error: 'HTTP ' + String(response.status), text: '' }
        }
        return { ok: true, error: null, text: await response.text() }
      } catch (err) {
        directError = String((err && err.message) || err)
      }
      const web = ctx.get('web')
      if (web !== undefined) {
        try {
          const result = await web.fetch({ url: url })
          const status = result && typeof result.statusCode === 'number' ? result.statusCode : 0
          if (status < 200 || status >= 300) {
            return { ok: false, error: 'HTTP ' + String(status), text: '' }
          }
          const body = result.body
          if (result.truncated === true) {
            return { ok: false, error: 'транспорт web.fetch обрезал ответ', text: '' }
          }
          const content = body && typeof body.content === 'string' ? body.content : ''
          if (content === '') return { ok: false, error: 'пустой ответ web.fetch', text: '' }
          return { ok: true, error: null, text: content }
        } catch (err) {
          return {
            ok: false,
            error: directError + '; web.fetch: ' + String((err && err.message) || err),
            text: '',
          }
        }
      }
      return { ok: false, error: directError === null ? 'нет транспорта' : directError, text: '' }
    }

    /**
     * Retrieve the OpenRouter model page that carries per-endpoint p50 stats.
     * @returns the page HTML, or a diagnostic explaining why it is unavailable.
     */
    async function fetchPage() {
      const result = await httpText(PAGE_URL)
      if (result.ok !== true) return { ok: false, error: result.error }
      return { ok: true, error: null, text: result.text }
    }

    function applySelection(args) {
      state.error = null
      const slugs = args && Array.isArray(args.slugs) ? args.slugs : []
      const mode = args && args.mode === 'balanced' ? 'balanced' : 'cost'
      const bySlug = {}
      state.providers.forEach(function (row) { bySlug[row.slug] = row })
      const picked = []
      slugs.forEach(function (slug) {
        if (typeof slug !== 'string') return
        if (picked.length >= 2) return
        const row = bySlug[slug]
        if (row === undefined) return
        if (picked.indexOf(row) >= 0) return
        picked.push(row)
      })
      if (picked.length === 0) {
        state.error = 'Сначала выполните проверку цен и выберите провайдеров'
        return snapshot()
      }
      state.appliedMode = mode
      state.applied = picked.map(function (row, index) {
        return appliedEntry(row, index === 0 ? 'Основной' : 'Резервный', mode)
      })
      return snapshot()
    }

    function apiError(payload) {
      const err = payload && payload.error
      if (err && typeof err.message === 'string') return err.message
      return ''
    }

    async function orRequest(method, path, body) {
      const credentials = ctx.get('credentials')
      if (credentials === undefined) return { ok: false, error: 'Сервис credentials недоступен' }
      let resolved
      try {
        resolved = await credentials.resolve(KEY_REF)
      } catch (err) {
        return { ok: false, error: 'Не удалось прочитать ключ: ' + String((err && err.message) || err) }
      }
      if (resolved === undefined || !resolved.value) {
        return { ok: false, error: 'Management API key не задан' }
      }
      const payload = body === null || body === undefined ? null : JSON.stringify(body)
      let response
      try {
        response = await fetch(OR_BASE + path, {
          method: method,
          headers: {
            authorization: 'Bearer ' + resolved.value,
            'content-type': 'application/json',
            'user-agent': 'dsh-openrouter-providers',
          },
          body: payload,
          signal: AbortSignal.timeout(30000),
        })
      } catch (err) {
        return { ok: false, error: 'Запрос к OpenRouter не удался: ' + String((err && err.message) || err) }
      }
      const text = await response.text()
      let json = null
      try {
        json = JSON.parse(text)
      } catch (err) {
        json = null
      }
      return { ok: true, status: response.status, json: json, text: text }
    }

    function normalizeGuardrail(raw) {
      if (!raw || typeof raw !== 'object') return null
      const allowed = Array.isArray(raw.allowed_providers)
        ? raw.allowed_providers.filter(function (item) { return typeof item === 'string' })
        : []
      const ignored = Array.isArray(raw.ignored_providers)
        ? raw.ignored_providers.filter(function (item) { return typeof item === 'string' })
        : []
      return {
        id: typeof raw.id === 'string' ? raw.id : '',
        name: typeof raw.name === 'string' ? raw.name : '',
        allowedProviders: allowed,
        ignoredProviders: ignored,
        limitUsd: num(raw.limit_usd),
        updatedAt: typeof raw.updated_at === 'string' ? raw.updated_at : null,
      }
    }

    async function loadGuardrails() {
      const response = await orRequest('GET', GUARDRAILS_PATH, null)
      if (response.ok !== true) {
        return { ok: false, error: response.error, guardrails: [], status: null }
      }
      if (response.status < 200 || response.status >= 300) {
        const detail = apiError(response.json)
        return {
          ok: false,
          error: 'OpenRouter HTTP ' + response.status + (detail ? ': ' + detail : ''),
          guardrails: [],
          status: response.status,
        }
      }
      const data = response.json && response.json.data
      const raw = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : [])
      const guardrails = []
      raw.forEach(function (item) {
        const guardrail = normalizeGuardrail(item)
        if (guardrail !== null) guardrails.push(guardrail)
      })
      return { ok: true, error: null, guardrails: guardrails, status: response.status }
    }

    async function pushAllowed(args) {
      const slugs = []
      const rawSlugs = args && Array.isArray(args.slugs) ? args.slugs : []
      rawSlugs.forEach(function (slug) {
        if (typeof slug !== 'string') return
        const clean = slug.trim().toLowerCase()
        if (!/^[a-z0-9][a-z0-9\/._-]*$/.test(clean)) return
        if (slugs.indexOf(clean) >= 0) return
        slugs.push(clean)
      })
      if (slugs.length === 0) {
        return { ok: false, error: 'Нет валидных slug провайдеров для записи', guardrails: [] }
      }
      const targetId = args && typeof args.guardrailId === 'string' ? args.guardrailId.trim() : ''
      const requestedName = args && typeof args.name === 'string' && args.name.trim()
        ? args.name.trim().slice(0, 80)
        : DEFAULT_GUARDRAIL_NAME
      let response
      let message
      if (targetId) {
        if (!/^[a-zA-Z0-9._-]{1,80}$/.test(targetId)) {
          return { ok: false, error: 'Некорректный id guardrail', guardrails: [] }
        }
        response = await orRequest('PATCH', GUARDRAILS_PATH + '/' + targetId, { allowed_providers: slugs })
        message = 'guardrail ' + targetId + ' → allowed_providers = [' + slugs.join(', ') + ']'
      } else {
        response = await orRequest('POST', GUARDRAILS_PATH, {
          name: requestedName,
          allowed_providers: slugs,
        })
        message = 'создан guardrail «' + requestedName + '» → allowed_providers = [' + slugs.join(', ') + ']'
      }
      if (response.ok !== true) {
        return { ok: false, error: response.error, guardrails: [] }
      }
      if (response.status < 200 || response.status >= 300) {
        const detail = apiError(response.json)
        return {
          ok: false,
          error: 'OpenRouter HTTP ' + response.status + (detail ? ': ' + detail : ''),
          guardrails: [],
        }
      }
      const list = await loadGuardrails()
      return { ok: true, error: null, message: message, guardrails: list.guardrails, status: response.status }
    }

    async function keyStatus() {
      const credentials = ctx.get('credentials')
      if (credentials === undefined) {
        return { ok: false, error: 'Сервис credentials недоступен', ref: KEY_REF, configured: false, writable: false }
      }
      try {
        const info = await credentials.describe(KEY_REF)
        return {
          ok: true,
          error: null,
          ref: KEY_REF,
          configured: info.configured === true,
          writable: info.writable === true,
          source: typeof info.source === 'string' ? info.source : null,
        }
      } catch (err) {
        return {
          ok: false,
          error: String((err && err.message) || err),
          ref: KEY_REF,
          configured: false,
          writable: false,
        }
      }
    }

    async function setKey(args) {
      const credentials = ctx.get('credentials')
      if (credentials === undefined) return { ok: false, error: 'Сервис credentials недоступен' }
      const value = args && typeof args.key === 'string' ? args.key.trim() : ''
      if (!value) return { ok: false, error: 'Пустой ключ' }
      try {
        await credentials.set(KEY_REF, value)
      } catch (err) {
        return { ok: false, error: 'Не удалось сохранить ключ: ' + String((err && err.message) || err) }
      }
      const status = await keyStatus()
      const list = await loadGuardrails()
      return { ok: list.ok, error: list.error, key: status, guardrails: list.guardrails }
    }

    async function clearKey() {
      const credentials = ctx.get('credentials')
      if (credentials === undefined) return { ok: false, error: 'Сервис credentials недоступен' }
      try {
        await credentials.unset(KEY_REF)
      } catch (err) {
        return { ok: false, error: String((err && err.message) || err) }
      }
      return { ok: true, error: null, key: await keyStatus(), guardrails: [] }
    }

    harness.handle('state', function () { return snapshot() })
    harness.handle('scan', function () { return scan() })
    harness.handle('apply', function (args) { return applySelection(args) })
    harness.handle('or/status', function () { return keyStatus() })
    harness.handle('or/setKey', function (args) { return setKey(args) })
    harness.handle('or/clearKey', function () { return clearKey() })
    harness.handle('or/guardrails', function () { return loadGuardrails() })
    harness.handle('or/push', function (args) { return pushAllowed(args) })
    harness.handle('or/meta', function () {
      return {
        privacyUrl: PRIVACY_URL,
        keysUrl: KEYS_URL,
        guardrailsUrl: OR_BASE + GUARDRAILS_PATH,
        keyRef: KEY_REF,
      }
    })

    const connection = ctx.get('connection')
    if (connection === undefined) return

    function json(payload, status) {
      return new Response(JSON.stringify(payload), {
        status: status === undefined ? 200 : status,
        headers: { 'content-type': 'application/json' },
      })
    }

    async function dispatch(method, args) {
      const handler = table[method]
      if (handler === undefined) throw new Error('openrouter-providers: unknown method ' + String(method))
      return await handler(args === undefined ? null : args)
    }

    const dispose = connection.fetch.register({
      path: ROUTE_PATH,
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: async function (request) {
        let payload = null
        try {
          payload = await request.json()
        } catch (error) {
          payload = null
        }
        const method = payload && typeof payload.method === 'string' ? payload.method : ''
        const args = payload ? payload.args : null
        try {
          return json({ ok: true, value: await dispatch(method, args) })
        } catch (error) {
          return json({ ok: false, error: String((error && error.message) || error) })
        }
      },
    })

    ctx.effect(function () {
      return function () {
        void dispose()
      }
    })
}
