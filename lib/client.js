/**
 * Browser half of the OpenRouter providers panel.
 *
 * Hand-written bundle in the client module system's factory-CJS format: it
 * registers a factory under this package name, requires only the baseline React
 * module, and lets the Loader materialize it lazily. The panel talks to the Host
 * half over the shared /api channel (`POST /api/openrouter-providers`), whose
 * carrier already applies the Host/Origin fence and browser-session auth.
 */
window.__ModuleLoader__.load({
	id: "dsh-openrouter-providers",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		const React = require("react");

		/** Call one Host-half method over the authenticated /api channel. */
		async function rpc(method, args) {
			const response = await fetch("/api/openrouter-providers", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ method: method, args: args === undefined ? null : args }),
			});
			if (!response.ok) throw new Error("HTTP " + String(response.status));
			const payload = await response.json();
			if (payload && payload.ok === false) throw new Error(String((payload && payload.error) || "unknown error"));
			return payload ? payload.value : null;
		}

		/** Package-private RPC face the panel body calls. */
		const host = {
			call: function (method, args) {
				return rpc(method, args);
			},
		};

		/** Insert this package's stylesheet; the returned disposer removes it. */
		function insertStyles(css) {
			const element = document.createElement("style");
			element.setAttribute("data-dsh-openrouter-providers", "1");
			element.textContent = css;
			document.head.appendChild(element);
			return function () {
				if (element.parentNode !== null) element.parentNode.removeChild(element);
			};
		}

		/** Package-owned stylesheet insertion cleaned up with the Client run. */
		const styles = { insert: insertStyles };

		function apply(ctx) {

    const slots = ctx.get('slots')
    if (slots === undefined) return

    const CSS = [
      '.orp-root{display:flex;flex-direction:column;gap:14px;padding:6px 2px 28px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.45}',
      '.orp-card{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:14px 16px}',
      '.orp-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}',
      '.orp-title{font-size:14px;font-weight:600}',
      '.orp-sub{color:var(--dsw-alias-label-secondary);font-size:12px;margin-top:3px}',
      '.orp-sub code,.orp-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}',
      '.orp-sub a,.orp-link{color:var(--dsw-alias-link,var(--dsw-alias-brand-primary));text-decoration:none}',
      '.orp-actions{display:flex;gap:8px;flex-wrap:wrap}',
      '.orp-btn{appearance:none;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary);border-radius:8px;padding:6px 12px;font-size:12.5px;cursor:pointer}',
      '.orp-btn:not(.orp-btn-primary):hover:not(:disabled){background:var(--dsw-alias-bg-layer-2)}',
      '.orp-btn:disabled{opacity:.45;cursor:default}',
      '.orp-btn-primary{background:var(--dsw-alias-button-primary-fill);border-color:transparent;color:var(--dsw-alias-label-primary-foreground)}',
      '.orp-btn-primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover);color:var(--dsw-alias-label-primary-foreground)}',
      '.orp-btn-speed{border-color:var(--dsw-alias-link,var(--dsw-alias-brand-primary));color:var(--dsw-alias-link,var(--dsw-alias-brand-primary))}',
      '.orp-btn-sm{padding:4px 9px;font-size:12px}',
      '.orp-note{margin-top:10px;font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.orp-hint{font-size:12px;color:var(--dsw-alias-label-secondary);margin-top:8px}',
      '.orp-input{margin-top:8px;width:100%;box-sizing:border-box;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:7px 10px;color:var(--dsw-alias-label-primary);font-size:12.5px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}',
      '.orp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-top:10px}',
      '.orp-prov{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:10px 12px;background:var(--dsw-alias-bg-layer-2)}',
      '.orp-role{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--dsw-alias-label-secondary)}',
      '.orp-provname{font-weight:600;margin:2px 0 6px}',
      '.orp-metrics{display:flex;flex-wrap:wrap;gap:10px;font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.orp-metrics b{color:var(--dsw-alias-label-primary);font-weight:600}',
      '.orp-tablewrap{width:100%;overflow:auto;max-height:420px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1)}',
      '.orp-table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}',
      '.orp-table th{position:sticky;top:0;background:var(--dsw-alias-bg-layer-1);text-align:left;font-weight:600;font-size:11.5px;color:var(--dsw-alias-label-secondary);padding:8px;border-bottom:1px solid var(--dsw-alias-border-l2);white-space:nowrap}',
      '.orp-table td{padding:7px 8px;border-bottom:1px solid var(--dsw-alias-border-l1);white-space:nowrap}',
      '.orp-table tbody tr{cursor:pointer}',
      '.orp-table tbody tr:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.orp-row-top td{background:var(--dsw-alias-bg-layer-2)}',
      '.orp-row-bal td{background:var(--dsw-alias-bg-layer-2)}',
      '.orp-num{text-align:right}',
      '.orp-strong{font-weight:600}',
      '.orp-dot{display:inline-block;width:10px;height:10px;border-radius:50%;border:1.5px solid var(--dsw-alias-border-l2)}',
      '.orp-dot-on{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}',
      '.orp-badge{margin-left:6px;font-size:10.5px;padding:1px 6px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary)}',
      '.orp-badge-ok{color:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-state-success-primary)}',
      '.orp-badge-warn{color:var(--dsw-alias-state-warn-primary);border-color:var(--dsw-alias-state-warn-primary)}',
      '.orp-badge-speed{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}',
      '.orp-pre{margin-top:8px;padding:10px 12px;border-radius:8px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;white-space:pre;overflow:auto;max-height:260px;color:var(--dsw-alias-label-primary)}',
      '.orp-target{display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-2);cursor:pointer;margin-top:6px}',
      '.orp-target-on{border-color:var(--dsw-alias-brand-primary)}',
      '.orp-target-name{font-weight:500}',
      '.orp-target-meta{color:var(--dsw-alias-label-secondary);font-size:11.5px;margin-left:auto;text-align:right}',
      '.orp-warn{color:var(--dsw-alias-state-warn-primary)}',
      '.orp-ok{color:var(--dsw-alias-state-success-primary)}',
    ].join('')

    ctx.effect(function () { return styles.insert(CSS) })

    function text(err) {
      return String((err && err.message) || err)
    }

    function money(value, digits) {
      if (value === null || value === undefined) return '—'
      return '$' + Number(value).toFixed(digits === undefined ? 3 : digits)
    }

    function pct(value) {
      if (value === null || value === undefined) return '—'
      return Number(value).toFixed(1) + '%'
    }

    function ctxLabel(value) {
      if (!value) return '—'
      return Math.round(Number(value) / 1000) + 'K'
    }

    function intOrDash(value) {
      if (value === null || value === undefined) return '—'
      return String(Math.round(Number(value)))
    }

    function fixedOrDash(value, digits) {
      if (value === null || value === undefined) return '—'
      return Number(value).toFixed(digits)
    }

    function Panel() {
      const [snap, setSnap] = React.useState(null)
      const [busy, setBusy] = React.useState(false)
      const [note, setNote] = React.useState('')
      const [selected, setSelected] = React.useState([])
      const [expanded, setExpanded] = React.useState(false)

      const [meta, setMeta] = React.useState(null)
      const [keyInfo, setKeyInfo] = React.useState(null)
      const [keyDraft, setKeyDraft] = React.useState('')
      const [orBusy, setOrBusy] = React.useState(false)
      const [orNote, setOrNote] = React.useState('')
      const [guardrails, setGuardrails] = React.useState([])
      const [target, setTarget] = React.useState('')
      const [newName, setNewName] = React.useState('DSH · DeepSeek V4.1 Flash')

      const NEW = '__new__'

      React.useEffect(function () {
        let alive = true
        host.call('or/meta', null).then(function (value) {
          if (alive) setMeta(value)
        }).catch(function () {})
        host.call('or/status', null).then(function (value) {
          if (!alive) return
          setKeyInfo(value)
          if (value && value.configured) orLoad()
        }).catch(function (err) {
          if (alive) setOrNote('Нет связи с Host: ' + text(err))
        })
        host.call('state', null).then(function (value) {
          if (!alive) return
          setSnap(value)
          if (value && value.scannedAt) {
            const active = value.applied && value.applied.length ? value.applied : value.top
            setSelected((active || []).map(function (item) { return item.slug }).slice(0, 2))
            setNote('Последняя проверка: ' + value.scannedAtLabel + ' · ' + (value.providers || []).length + ' провайдеров')
          } else {
            refresh()
          }
        }).catch(function (err) {
          if (alive) setNote('Нет связи с Host-частью плагина: ' + text(err))
        })
        return function () { alive = false }
      }, [])

      async function refresh() {
        setBusy(true)
        setNote('Опрашиваем OpenRouter (цены, надёжность, скорость)…')
        try {
          const value = await host.call('scan', null)
          if (!value) {
            setNote('Host не вернул данные')
          } else {
            setSnap(value)
            setSelected((value.top || []).slice(0, 2))
            const parts = []
            parts.push(value.error
              ? 'Ошибка: ' + value.error
              : 'Проверено в ' + value.scannedAtLabel + ' · провайдеров: ' + (value.providers || []).length)
            if (value.speed && !value.speed.available) parts.push(value.speed.note || 'скорость недоступна')
            else if (value.speed) parts.push('скорость: ' + value.speed.matched + ' провайдеров')
            setNote(parts.join(' · '))
          }
        } catch (err) {
          setNote('Сбой проверки: ' + text(err))
        }
        setBusy(false)
      }

      async function apply(slugs, mode) {
        if (!slugs || slugs.length === 0) {
          setNote('Сначала отметьте провайдеров в таблице')
          return
        }
        setBusy(true)
        try {
          const value = await host.call('apply', { slugs: slugs, mode: mode || 'cost' })
          if (!value) {
            setNote('Host не вернул данные')
          } else {
            setSnap(value)
            setNote(value.error
              ? 'Ошибка: ' + value.error
              : (mode === 'balanced' ? 'Применён баланс цена/скорость: ' : 'Применён минимум цены: ') +
                (value.applied || []).map(function (item) {
                  return item.name + ' — ' + item.role
                }).join(' · '))
          }
        } catch (err) {
          setNote('Сбой применения: ' + text(err))
        }
        setBusy(false)
      }

      function toggle(slug) {
        setSelected(function (prev) {
          if (prev.indexOf(slug) >= 0) {
            return prev.filter(function (item) { return item !== slug })
          }
          if (prev.length >= 2) return [prev[1], slug]
          return prev.concat([slug])
        })
      }

      async function saveKey() {
        const value = keyDraft.trim()
        if (!value) {
          setOrNote('Вставьте Management API key')
          return
        }
        setOrBusy(true)
        setOrNote('Сохраняем ключ и читаем guardrails…')
        try {
          const result = await host.call('or/setKey', { key: value })
          if (!result) {
            setOrNote('Host не вернул данные')
          } else {
            setKeyInfo(result.key || null)
            setKeyDraft('')
            if (result.ok) {
              const list = result.guardrails || []
              setGuardrails(list)
              if (list.length > 0) setTarget(list[0].id)
              setOrNote('Ключ сохранён · guardrails: ' + list.length)
            } else {
              setOrNote('Ключ сохранён, но OpenRouter ответил: ' + (result.error || 'ошибка') + ' — проверьте, что это Management API key')
            }
          }
        } catch (err) {
          setOrNote('Сбой: ' + text(err))
        }
        setOrBusy(false)
      }

      async function clearKey() {
        setOrBusy(true)
        try {
          const result = await host.call('or/clearKey', null)
          if (result) {
            setKeyInfo(result.key || null)
            setGuardrails([])
            setOrNote('Ключ удалён')
          }
        } catch (err) {
          setOrNote('Сбой: ' + text(err))
        }
        setOrBusy(false)
      }

      async function orLoad() {
        setOrBusy(true)
        setOrNote('Читаем guardrails…')
        try {
          const result = await host.call('or/guardrails', null)
          if (!result) {
            setOrNote('Host не вернул данные')
          } else if (result.ok) {
            const list = result.guardrails || []
            setGuardrails(list)
            setOrNote('Guardrails: ' + list.length + (list.length === 0 ? ' — будет создан новый' : ''))
          } else {
            setOrNote('Ошибка: ' + result.error)
          }
        } catch (err) {
          setOrNote('Сбой: ' + text(err))
        }
        setOrBusy(false)
      }

      async function push() {
        if (selected.length === 0) {
          setOrNote('Сначала выберите провайдеров в таблице (максимум 2)')
          return
        }
        setOrBusy(true)
        setOrNote('Записываем allowed_providers в OpenRouter…')
        try {
          const result = await host.call('or/push', {
            slugs: selected,
            guardrailId: target === NEW ? '' : target,
            name: newName,
          })
          if (!result) {
            setOrNote('Host не вернул данные')
          } else if (result.ok) {
            setGuardrails(result.guardrails || guardrails)
            setOrNote('OK · ' + result.message)
          } else {
            setOrNote('Ошибка: ' + result.error)
          }
        } catch (err) {
          setOrNote('Сбой записи: ' + text(err))
        }
        setOrBusy(false)
      }

      const providers = snap && Array.isArray(snap.providers) ? snap.providers : []
      const top = snap && Array.isArray(snap.top) ? snap.top : []
      const topBalanced = snap && Array.isArray(snap.topBalanced) ? snap.topBalanced : []
      const applied = snap && Array.isArray(snap.applied) ? snap.applied : []
      const speed = snap && snap.speed ? snap.speed : null
      const visible = expanded ? providers : providers.slice(0, 12)
      const source = snap && snap.source
        ? snap.source
        : 'https://openrouter.ai/api/v1/models/deepseek/deepseek-v4.1-flash/endpoints'
      const model = snap && snap.model ? snap.model : 'deepseek/deepseek-v4.1-flash'
      const keysUrl = meta && meta.keysUrl ? meta.keysUrl : 'https://openrouter.ai/settings/management-keys'
      const privacyUrl = meta && meta.privacyUrl ? meta.privacyUrl : 'https://openrouter.ai/settings/privacy'
      const selectedNames = providers.filter(function (row) { return selected.indexOf(row.slug) >= 0 })
        .map(function (row) { return row.name + ' (' + row.slug + ')' })
      const targetGuardrail = guardrails.filter(function (item) { return item.id === target })[0]

      function providerCard(item, index) {
        return React.createElement('div', { className: 'orp-prov', key: item.slug + '-' + index },
          React.createElement('div', { className: 'orp-role' },
            item.role + ' · ' + (item.mode === 'balanced' ? 'баланс цена/скорость' : 'минимальная цена')),
          React.createElement('div', { className: 'orp-provname' }, item.name),
          React.createElement('div', { className: 'orp-metrics' },
            React.createElement('span', null, 'slug ', React.createElement('b', null, item.slug)),
            React.createElement('span', null, 'вход ', React.createElement('b', null, money(item.prompt, 4))),
            React.createElement('span', null, 'выход ', React.createElement('b', null, money(item.completion, 4))),
            React.createElement('span', null, 'blend ', React.createElement('b', null, money(item.blend, 4))),
            React.createElement('span', null, 'uptime ', React.createElement('b', null, pct(item.uptime30))),
            React.createElement('span', null, 'tps ', React.createElement('b', null, intOrDash(item.tps))),
            React.createElement('span', null, 'задержка ', React.createElement('b', null, item.latencyMs === null || item.latencyMs === undefined ? '—' : Math.round(item.latencyMs) + ' мс'))
          )
        )
      }

      function headCell(label, key) {
        return React.createElement('th', { key: key }, label)
      }

      function rowOf(row) {
        const isTop = top.indexOf(row.slug) >= 0
        const isBalanced = topBalanced.indexOf(row.slug) >= 0
        const isApplied = applied.some(function (item) { return item.slug === row.slug })
        const isSelected = selected.indexOf(row.slug) >= 0
        const className = 'orp-row' + (isTop ? ' orp-row-top' : '') + (!isTop && isBalanced ? ' orp-row-bal' : '')
        return React.createElement('tr', {
          key: row.slug,
          className: className,
          onClick: function () { toggle(row.slug) },
        },
          React.createElement('td', null, React.createElement('span', {
            className: 'orp-dot' + (isSelected ? ' orp-dot-on' : ''),
          })),
          React.createElement('td', null, row.name,
            row.eligible ? null : React.createElement('span', { className: 'orp-badge orp-badge-warn' }, 'риск'),
            isTop ? React.createElement('span', { className: 'orp-badge' }, 'дёшево') : null,
            isBalanced ? React.createElement('span', { className: 'orp-badge orp-badge-speed' }, 'быстрый') : null,
            isApplied ? React.createElement('span', { className: 'orp-badge orp-badge-ok' }, 'активен') : null),
          React.createElement('td', { className: 'orp-num' }, money(row.prompt, 4)),
          React.createElement('td', { className: 'orp-num' }, money(row.completion, 4)),
          React.createElement('td', { className: 'orp-num orp-strong' }, money(row.blend, 4)),
          React.createElement('td', { className: 'orp-num' }, pct(row.uptime30)),
          React.createElement('td', { className: 'orp-num' }, pct(row.uptime1d)),
          React.createElement('td', { className: 'orp-num' }, intOrDash(row.tps)),
          React.createElement('td', { className: 'orp-num' }, row.latencyMs === null || row.latencyMs === undefined ? '—' : String(Math.round(row.latencyMs))),
          React.createElement('td', { className: 'orp-num' }, row.tools ? 'да' : 'нет'),
          React.createElement('td', { className: 'orp-num' }, ctxLabel(row.contextLength)),
          React.createElement('td', { className: 'orp-num' }, row.quantization === 'unknown' ? '—' : row.quantization),
          React.createElement('td', { className: 'orp-num' }, fixedOrDash(row.score, 4)),
          React.createElement('td', { className: 'orp-num orp-strong' }, fixedOrDash(row.balanced, 3))
        )
      }

      function targetRow(item) {
        const on = target === item.id
        return React.createElement('div', {
          key: item.id,
          className: 'orp-target' + (on ? ' orp-target-on' : ''),
          onClick: function () { setTarget(item.id) },
        },
          React.createElement('span', { className: 'orp-dot' + (on ? ' orp-dot-on' : '') }),
          React.createElement('span', { className: 'orp-target-name' }, item.name || item.id),
          React.createElement('span', { className: 'orp-target-meta' },
            (item.allowedProviders && item.allowedProviders.length
              ? 'allowed: ' + item.allowedProviders.join(', ')
              : 'allowed: все')
          )
        )
      }

      return React.createElement('div', { className: 'orp-root' },
        React.createElement('div', { className: 'orp-card' },
          React.createElement('div', { className: 'orp-head' },
            React.createElement('div', null,
              React.createElement('div', { className: 'orp-title' }, 'Провайдеры OpenRouter · DeepSeek V4.1 Flash'),
              React.createElement('div', { className: 'orp-sub' },
                'модель ', React.createElement('code', null, model),
                ' · цены — ',
                React.createElement('a', { href: source, target: '_blank', rel: 'noreferrer' }, 'endpoints API'),
                ' · скорость — ',
                React.createElement('a', { href: snap && snap.pageUrl ? snap.pageUrl : 'https://openrouter.ai/deepseek/deepseek-v4.1-flash', target: '_blank', rel: 'noreferrer' }, 'страница модели')
              )
            ),
            React.createElement('div', { className: 'orp-actions' },
              React.createElement('button', { className: 'orp-btn', disabled: busy, onClick: refresh },
                busy ? 'Проверка…' : 'Проверить цены'),
              React.createElement('button', {
                className: 'orp-btn orp-btn-primary',
                disabled: busy || top.length === 0,
                onClick: function () { apply(top, 'cost') },
              }, 'Применить 2 лучших'),
              React.createElement('button', {
                className: 'orp-btn orp-btn-speed',
                disabled: busy || topBalanced.length < 2,
                onClick: function () { apply(topBalanced, 'balanced') },
              }, 'Лучшие + быстрые (tps)'),
              React.createElement('button', {
                className: 'orp-btn',
                disabled: busy || selected.length === 0,
                onClick: function () { apply(selected, 'cost') },
              }, 'Применить выбранные (2)'),
              React.createElement('button', {
                className: 'orp-btn',
                disabled: busy || applied.length === 0,
                onClick: function () { setSelected(applied.map(function (item) { return item.slug })) },
              }, 'Вернуть активных в выбор')
            )
          ),
          note ? React.createElement('div', { className: 'orp-note' }, note) : null,
          React.createElement('div', { className: 'orp-hint' },
            'Минимум цены: (0.75·вход + 0.25·выход) ÷ надёжность. Баланс: ' +
            (speed && speed.weights ? speed.weights.cost : 0.6) + '·цена + ' +
            (speed && speed.weights ? speed.weights.speed : 0.4) +
            '·скорость (нормировано). Скорость — p50 throughput за 30 мин.'
          ),
          speed && !speed.available
            ? React.createElement('div', { className: 'orp-hint orp-warn' }, speed.note || 'Данные о скорости недоступны')
            : null
        ),
        applied.length > 0
          ? React.createElement('div', { className: 'orp-card' },
              React.createElement('div', { className: 'orp-title' },
                'Активные провайдеры · ' + (applied[0] && applied[0].mode === 'balanced' ? 'баланс цена/скорость' : 'минимум цены')),
              React.createElement('div', { className: 'orp-grid' }, applied.map(providerCard))
            )
          : null,
        React.createElement('div', { className: 'orp-card' },
          React.createElement('div', { className: 'orp-title' }, 'Запись в OpenRouter (Guardrails)'),
          React.createElement('div', { className: 'orp-sub' },
            'У страницы Privacy нет API, поэтому записываем Allowed Providers через guardrail: ',
            React.createElement('code', null, 'PATCH /api/v1/guardrails/{id}'), ' → ', React.createElement('code', null, 'allowed_providers'),
            '. Нужен Management API key.'
          ),
          React.createElement('div', { className: 'orp-hint' },
            'Ключ: ',
            keyInfo && keyInfo.configured
              ? React.createElement('b', { className: 'orp-ok' }, 'задан')
              : React.createElement('b', { className: 'orp-warn' }, 'не задан'),
            keyInfo && keyInfo.source ? ' · источник: ' + keyInfo.source : '',
            keyInfo && keyInfo.configured && keyInfo.writable === false ? ' · только чтение (ключ из окружения)' : '',
            ' · ', React.createElement('a', { className: 'orp-link', href: keysUrl, target: '_blank', rel: 'noreferrer' }, 'создать Management API key')
          ),
          React.createElement('input', {
            className: 'orp-input',
            type: 'password',
            placeholder: 'sk-or-v1-… (Management API key)',
            value: keyDraft,
            onChange: function (event) { setKeyDraft(event.target.value) },
          }),
          React.createElement('div', { className: 'orp-actions', style: { marginTop: '8px' } },
            React.createElement('button', {
              className: 'orp-btn',
              disabled: orBusy,
              onClick: saveKey,
            }, orBusy ? '…' : 'Сохранить ключ'),
            React.createElement('button', {
              className: 'orp-btn orp-btn-sm',
              disabled: orBusy || !(keyInfo && keyInfo.configured),
              onClick: orLoad,
            }, 'Обновить guardrails'),
            React.createElement('button', {
              className: 'orp-btn orp-btn-sm',
              disabled: orBusy || !(keyInfo && keyInfo.configured),
              onClick: clearKey,
            }, 'Удалить ключ')
          ),
          guardrails.length > 0
            ? React.createElement('div', { style: { marginTop: '12px' } },
                React.createElement('div', { className: 'orp-sub' }, 'Целевой guardrail:'),
                guardrails.map(targetRow)
              )
            : null,
          React.createElement('div', {
            className: 'orp-target' + (target === NEW ? ' orp-target-on' : ''),
            style: { marginTop: '8px' },
            onClick: function () { setTarget(NEW) },
          },
            React.createElement('span', { className: 'orp-dot' + (target === NEW ? ' orp-dot-on' : '') }),
            React.createElement('span', { className: 'orp-target-name' }, 'Создать новый guardrail'),
          ),
          target === NEW
            ? React.createElement('input', {
                className: 'orp-input',
                type: 'text',
                value: newName,
                onChange: function (event) { setNewName(event.target.value) },
              })
            : null,
          React.createElement('div', { className: 'orp-hint' },
            'Будет записано ',
            target === NEW
              ? 'в новый guardrail «' + newName + '»'
              : (targetGuardrail ? 'в «' + (targetGuardrail.name || targetGuardrail.id) + '»' : 'в выбранный guardrail'),
            ': allowed_providers = [' + selected.join(', ') + ']',
            selectedNames.length > 0 ? ' — ' + selectedNames.join(', ') : ''
          ),
          React.createElement('div', { className: 'orp-actions', style: { marginTop: '8px' } },
            React.createElement('button', {
              className: 'orp-btn orp-btn-primary',
              disabled: orBusy || selected.length === 0 || !(keyInfo && keyInfo.configured),
              onClick: push,
            }, orBusy ? 'Запись…' : 'Записать выбранных в OpenRouter'),
            React.createElement('a', {
              className: 'orp-btn',
              href: privacyUrl,
              target: '_blank',
              rel: 'noreferrer',
              style: { textDecoration: 'none' },
            }, 'Открыть Privacy (вручную)')
          ),
          orNote ? React.createElement('div', { className: 'orp-note' }, orNote) : null
        ),
        React.createElement('div', { className: 'orp-card' },
          React.createElement('div', { className: 'orp-title' }, 'Все провайдеры модели'),
          React.createElement('div', { className: 'orp-sub' }),
          React.createElement('div', { className: 'orp-sub' }, 'Клик по строке — включить в выбор (максимум 2).'),
          React.createElement('div', { className: 'orp-tablewrap' },
            React.createElement('table', { className: 'orp-table' },
              React.createElement('thead', null,
                React.createElement('tr', null,
                  headCell('', 'pick'),
                  headCell('Провайдер', 'name'),
                  headCell('Вход $/M', 'prompt'),
                  headCell('Выход $/M', 'completion'),
                  headCell('Blend $/M', 'blend'),
                  headCell('Uptime 30м', 'u30'),
                  headCell('Uptime 1д', 'u1d'),
                  headCell('tps p50', 'tps'),
                  headCell('Задержка, мс', 'lat'),
                  headCell('Tools', 'tools'),
                  headCell('Контекст', 'ctx'),
                  headCell('Квант', 'quant'),
                  headCell('Цена-оценка', 'score'),
                  headCell('Баланс', 'bal')
                )
              ),
              React.createElement('tbody', null, visible.map(rowOf))
            )
          ),
          providers.length > 12
            ? React.createElement('button', {
                className: 'orp-btn',
                style: { marginTop: '10px' },
                onClick: function () { setExpanded(!expanded) },
              }, expanded ? 'Свернуть список' : 'Показать все ' + providers.length + ' провайдеров')
            : null
        ),
        applied.length > 0 && snap && snap.snippet
          ? React.createElement('div', { className: 'orp-card' },
              React.createElement('div', { className: 'orp-title' }, 'Готовый фрагмент для settings.yaml'),
              React.createElement('pre', { className: 'orp-pre' }, snap.snippet)
            )
          : null
      )
    }

    slots.inject('settings.section', function () {
      return slots.register(
        { name: 'settings.section', id: 'openrouter-providers', order: 30, label: 'Провайдеры OpenRouter' },
        function () { return React.createElement(Panel, null) }
      )
    })
		}

		const inject = ["slots"];

		exports.apply = apply;
		exports.inject = inject;
		exports.name = "openrouter-providers";
		return module.exports;
	},
});
