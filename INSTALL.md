# Установка плагина «Провайдеры OpenRouter» в DeepSeek Harness

Это постоянная версия плагина: он загружается вместе с профилем DSH и не требует
повторного `cordis_define` при каждом запуске (в отличие от динамической версии).

## Требования

- DeepSeek Harness с интерфейсом — профиль `web` (`dsh web`) **или** Desktop-версия
  (профиль `desktop`): обоим нужен бандл `@deepseek-ai/dsh-web-app`, который и даёт
  страницу настроек. Плагин ставится одинаково в Web и Desktop, включая Windows.
- Больше ничего: внешних зависимостей у пакета нет, сборка не нужна, внешние команды
  (curl и т.п.) не используются.

Пути ниже даны для macOS/Linux; на Windows замените `~/.dsh` на `%USERPROFILE%\.dsh`
(или на значение переменной `DSH_HOME`, если она задана), а `profiles/web` — на
`profiles/desktop`, если ставите в Desktop-версию.

## Способ А. Штатный установщик DSH (рекомендуется)

Пакет объявляет бандл профиля (`dsh.bundle` + свой `cordis.patch.yml`), поэтому его
принимает установщик интерфейса: **Настройки → Плагины → «Add plugin»** →
вставить `https://github.com/Leygun/OpenRouter-Providers-Panel` → **Install** →
перезапустить harness. Строка композиции добавляется самим пакетом, вручную ничего
править не нужно.

Если интерфейс отвечает `This package declares no bundle` — вы ставите старую копию
пакета (до версии 1.1.0) или архив без `cordis.patch.yml`; обновитесь из репозитория.

## Способ Б. Ручная установка

### Шаг 1. Скопировать пакет в профиль

```sh
mkdir -p ~/.dsh/profiles/web/node_modules
cp -R dsh-openrouter-providers ~/.dsh/profiles/web/node_modules/
```

В результате должен получиться путь
`~/.dsh/profiles/web/node_modules/dsh-openrouter-providers/package.json`.

### Шаг 2. Добавить строку в пользовательский слой композиции

Файл `~/.dsh/profiles/web/cordis.patch.yml`. Если он содержит пустой массив `[]` —
замените его на:

```yaml
- insert:
    - id: openrouter-providers
      name: dsh-openrouter-providers
```

Перед правкой полезно сохранить копию файла (`cp cordis.patch.yml cordis.patch.yml.orig`).
Если в файле уже есть другие строки — просто допишите этот элемент в конец списка.

### Шаг 3. Перезапустить DSH

```sh
dsh web
```

Затем обновите страницу в браузере. Раздел настроек подхватывается вместе с профилем;
в уже запущенном процессе правка `cordis.patch.yml` может не примениться, поэтому
перезапуск — надёжный путь.

## Проверка

1. Быстрая проверка композиции (никуда не подключается, только печатает дерево):

   ```sh
   dsh --profile web --dump-config | grep -A2 openrouter-providers
   ```

   Ожидаемый вывод — ваша строка:
   ```
   - id: openrouter-providers
     name: dsh-openrouter-providers
   ```

2. В браузере: **Настройки → «Провайдеры OpenRouter»** (раздел будет последним в списке).
3. Нажмите **«Проверить цены»** — появится таблица провайдеров
   `deepseek/deepseek-v4.1-flash` с ценами, uptime и tps.

Если раздела нет:

- проверьте, что `node_modules/dsh-openrouter-providers/lib/client.js` существует
  (сканер клиентских плагинов завершается явной ошибкой, если бандла нет);
- убедитесь, что открыт именно профиль `web` и что после правки патча был перезапуск;
- посмотрите вывод `dsh web` в терминале — строка, которая не смогла загрузиться,
  сообщает о себе текстом `Cannot find package …` или `row(s) did not activate`.

## Настройка после установки

- **Management API key** для записи в guardrail вводится прямо в панели
  (ссылка «создать Management API key» ведёт на `openrouter.ai/settings/management-keys`).
  Он сохраняется локально в хранилище ключей DSH под ref `OPENROUTER_MANAGEMENT_KEY`.
  На каждой машине ключ вводится заново — вместе с пакетом он не переносится.
- Ключ инференса OpenRouter (в `~/.dsh/settings.yaml` он указан как `apiKeyEnv`,
  например `OPENRT_API_KEY`) панель не трогает: он нужен самому DSH для запросов к модели.

## Удаление

```sh
# 1. вернуть пустой слой композиции
printf '%s\n' '[]' > ~/.dsh/profiles/web/cordis.patch.yml

# 2. убрать пакет
rm -rf ~/.dsh/profiles/web/node_modules/dsh-openrouter-providers

# 3. перезапустить dsh web
```

Если сохраняли `cordis.patch.yml.orig` и других правок в нём не было — просто
восстановите этот файл вместо шага 1.

## Перенос на другой компьютер

Ровно те же три шага: скопировать каталог `dsh-openrouter-providers` в
`node_modules` профиля и добавить строку в `cordis.patch.yml`, затем перезапустить
`dsh web`. Management API key на новой машине введите заново в панели.

## Что делает плагин

- **«Проверить цены»** — цены и uptime из `GET /api/v1/models/deepseek/deepseek-v4.1-flash/endpoints`
  плюс p50-`throughput`/`latency` со страницы модели (в публичном API эти поля приходят `null`).
- **«Применить 2 лучших»** — топ-2 по `(0.75·вход + 0.25·выход) / надёжность`;
  фильтр «поддержка tools и uptime ≥ 90 %».
- **«Лучшие + быстрые (tps)»** — топ-2 по `0.6·цена + 0.4·скорость` (нормировка внутри
  отфильтрованного пула, при равенстве — меньшая задержка).
- **«Применить выбранные (2)»** — ручной выбор кликом по двум строкам.
- **«Записать выбранных в OpenRouter»** — `PATCH /api/v1/guardrails/{id}` с
  `allowed_providers = [...]` либо `POST` нового guardrail.
- Фрагмент `llm-pi-ai.providers` для `~/.dsh/settings.yaml`.

## Ограничения

- Аккаунтная страница **Privacy → Allowed Providers** не имеет публичного API
  (`/api/v1/settings` и `/api/v1/preferences` отвечают 404). Ближайшая программируемая
  ручка — guardrails, в них плагин и пишет; кнопка «Открыть Privacy (вручную)» открывает
  страницу для ручной правки.
- Guardrail действует только на привязанные к нему ключи/участников: привяжите свой
  API-ключ в OpenRouter (Workspaces → Default → Guardrails → API Keys).
- Скорость берётся разбором HTML страницы модели; если OpenRouter сменит разметку,
  режим «Лучшие + быстрые» отключится с пояснением, остальное продолжит работать.
