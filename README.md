# OpenRouter Providers Panel

[Русский](#русский) · [English](#english)

Панель для **DeepSeek Harness Web**, которая по кнопке проверяет цены, надёжность и скорость
апстримов модели `deepseek/deepseek-v4.1-flash` на OpenRouter, выбирает двух лучших и умеет
записывать их в `allowed_providers` guardrail OpenRouter.

Это обычный пакет-плагин профиля DSH: он поднимается вместе с harness и не требует
повторной установки при каждом запуске.

---

## Русский

### Возможности

| Кнопка | Что делает |
| --- | --- |
| **Проверить цены** | Тянет `GET /api/v1/models/deepseek/deepseek-v4.1-flash/endpoints` (цены, uptime, поддержка tools) и p50-`throughput`/`latency` за 30 минут со страницы модели. |
| **Применить 2 лучших** | Топ-2 по `(0.75·вход + 0.25·выход) / надёжность`; в пул попадают только провайдеры с поддержкой `tools` и uptime ≥ 90 %. |
| **Лучшие + быстрые (tps)** | Топ-2 по `0.6·цена + 0.4·скорость` (обе оси нормируются внутри пула, при равенстве выигрывает меньшая задержка). |
| **Применить выбранные (2)** | Ручной выбор: клик по двум строкам таблицы. |
| **Записать выбранных в OpenRouter** | `PATCH /api/v1/guardrails/{id}` с `allowed_providers = [...]` — или `POST` нового guardrail. |

Дополнительно панель показывает таблицу всех провайдеров модели (вход/выход $ за 1M токенов,
blend, uptime 30 мин и 1 день, tps p50, задержка, tools, контекст, квантизация, оценки)
и готовый фрагмент `llm-pi-ai.providers` для `~/.dsh/settings.yaml`.

### Требования

- DeepSeek Harness с профилем `web` (запуск `dsh web`) или другим профилем, в который
  подключён бандл `@deepseek-ai/dsh-web-app`.
- Сборка не нужна: у пакета нет внешних зависимостей, клиентская половина — готовый бандл.
- Для записи в OpenRouter — Management API key (создаётся на
  [openrouter.ai/settings/management-keys](https://openrouter.ai/settings/management-keys)).
  Обычный inference-ключ не подойдёт: OpenRouter ответит `401 Invalid management key`.

### Установка

Самый быстрый путь — клонировать репозиторий и запустить установщик:

```sh
git clone https://github.com/Leygun/OpenRouter-Providers-Panel.git
cd OpenRouter-Providers-Panel
./install.sh            # профиль web по умолчанию
# ./install.sh my-profile   # или указать профиль
```

Установщик копирует пакет в `<DSH_HOME>/profiles/<профиль>/node_modules/dsh-openrouter-providers`
и добавляет строку в пользовательский слой композиции `cordis.patch.yml` (с бэкапом
`cordis.patch.yml.orig`). Затем перезапустите harness:

```sh
dsh web
```

Раздел появится в **Настройки → «Провайдеры OpenRouter»**.

Ручная установка, проверка и удаление описаны в [INSTALL.md](INSTALL.md).
Если предпочитаете, чтобы установку выполнил агент DSH — отдайте ему
[INSTALL-PROMPT.md](INSTALL-PROMPT.md).

### После установки

1. Откройте раздел и вставьте **Management API key** — он сохранится локально в хранилище
   ключей DSH под ref `OPENROUTER_MANAGEMENT_KEY` и обратно в интерфейс не возвращается.
2. Нажмите **«Проверить цены»**, затем **«Применить 2 лучших»** или
   **«Лучшие + быстрые (tps)»**.
3. При необходимости нажмите **«Записать выбранных в OpenRouter»**.
4. В OpenRouter привяжите свой API-ключ к этому guardrail:
   Workspaces → Default → Guardrails → API Keys. Guardrail действует только на
   привязанные ключи и участников.

### Ограничения

- **У страницы Privacy нет API.** Аккаунтные «Allowed Providers» (`/settings/privacy`)
  нельзя изменить программно: `/api/v1/settings` и `/api/v1/preferences` отвечают 404.
  Ближайшая программируемая ручка — guardrails, в них плагин и пишет. Кнопка
  «Открыть Privacy (вручную)» открывает страницу для ручной правки.
- **Скорость берётся разбором HTML** страницы модели: в публичном API поля
  `throughput_last_30m` и `latency_last_30m` приходят `null`. Если OpenRouter сменит
  разметку, режим «Лучшие + быстрые» отключится с пояснением, остальное продолжит работать.
- Плагин ходит в OpenRouter с Host-половины через `curl` (`ctx.shell`), потому что
  `web.fetch` умеет только URL и не отправляет заголовки. Management-ключ передаётся
  через переменные окружения процесса, а не в аргументах командной строки.

### Как устроено

```
lib/index.js    Host-половина: Cordis-плагин, публикует POST /api/openrouter-providers
                на общем /api-канале (Host/Origin-фенс и авторизация браузерной сессии —
                на стороне канала). Работает с ctx.web, ctx.shell, ctx.credentials, ctx.fs.
lib/client.js   Client-половина: бандл client-module-system
                (window.__ModuleLoader__.load({ id, factory })), требует только baseline
                React, регистрирует страницу в слоте settings.section.
```

Ключ инференса (`OPENRT_API_KEY` и подобные) панель не трогает — он нужен самому DSH.

### Удаление

```sh
# убрать строку из ~/.dsh/profiles/web/cordis.patch.yml (или вернуть [] )
rm -rf ~/.dsh/profiles/web/node_modules/dsh-openrouter-providers
```

### Разработка

Правки вносятся прямо в `lib/*.js` — шаг сборки отсутствует. После изменения файлов
скопируйте каталог в профиль заново (или запустите `./install.sh`) и перезапустите harness.

---

## English

A panel for **DeepSeek Harness Web** that checks OpenRouter provider pricing, reliability and
throughput for `deepseek/deepseek-v4.1-flash`, picks the two best upstreams, and can write them
into an OpenRouter guardrail's `allowed_providers`.

### Install

```sh
git clone https://github.com/Leygun/OpenRouter-Providers-Panel.git
cd OpenRouter-Providers-Panel
./install.sh          # profile "web" by default
dsh web               # restart, then open Settings → "OpenRouter Providers"
```

Requires DeepSeek Harness with the `web` profile. No build step and no external dependencies.
Writing to OpenRouter needs a Management API key, entered inside the panel and stored in the
harness credential store under `OPENROUTER_MANAGEMENT_KEY`.

### Notes

- OpenRouter's account-wide Privacy page has no public API, so the plugin writes to
  **guardrails** instead; assign your API key to that guardrail in OpenRouter for it to apply.
- Throughput is parsed from the model page HTML, because the public API returns
  `throughput_last_30m: null`.

---

Автор: [Leygun](https://github.com/Leygun)
