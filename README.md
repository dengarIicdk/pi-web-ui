# DenGarChiK Web UI для Pi

Веб-интерфейс для [Pi coding agent](https://github.com/earendil-works/pi): просмотр и управление сессией Pi из браузера в стиле DeepSeek Harness.

Пакет: `@dengarchik/pi-web-ui` (форк/редизайн `@kkkiio/pi-web-ui`, лицензия MIT — см. `LICENSE`).

## Установка в одну команду (Windows 10 / 11 / Server)

Если у вас уже установлены **Node.js 22.19+** и **Pi coding agent**, откройте **PowerShell** и выполните:

```powershell
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; u="dengarIicdk"; r="pi-web-ui"; t=Join-Path env:TEMP "pi-ui-(Get-Random)"; z="t.zip"; Invoke-WebRequest -Uri "https://github.com/dengarIicdk/pi-web-ui" -OutFile z -UseBasicParsing; Expand-Archive -Path z -DestinationPath t -Force; powershell -NoProfile -ExecutionPolicy Bypass -File "\$t\$r-main\install.ps1" -SkipBuild; Remove-Item t,z -Recurse -Force -ErrorAction SilentlyContinue
```

Эта команда сама скачает архив без Git, установит готовый собранный интерфейс за 5 секунд, пропишет его в конфиг Pi и удалит за собой временные файлы.

---

## Быстрый старт на чистой Windows (пошагово)

### 1. Установите необходимое

| Что | Зачем | Где взять |
|---|---|---|
| Node.js **22.19+** | сборка и запуск | https://nodejs.org (LTS) |
| Git | клонирование репозитория | https://git-scm.com |
| Pi coding agent | сам агент | см. документацию Pi (`pi` должен работать в терминале) |

Проверьте в новом окне PowerShell:

```powershell
node -v    # должно быть v22.19.0 или новее
npm -v
git --version
```

### 2. Клонируйте репозиторий

```powershell
git clone https://github.com
cd pi-web-ui
```

### 3. Запустите установку

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

Скрипт по шагам:

1. Проверяет `node`, `npm`, `npx` и версию Node.js.
2. Выполняет `npm install`, затем `npx tsc --noEmit` (проверка типов) и `npx vite build` (сборка интерфейса в `dist/`).
3. Копирует пакет в `%USERPROFILE%\.pi\agent\npm\node_modules\@dengarchik\pi-web-ui` и ставит его runtime-зависимости.
4. Прописывает `npm:@dengarchik/pi-web-ui` в `%USERPROFILE%\.pi\agent\settings.json` (массив `packages`). Перед изменением создаётся резервная копия `settings.json.bak-<дата-время>`.
5. Если там был `npm:@kkkiio/pi-web-ui`, запись удаляется. Файлы старого пакета не удаляются.

Если сборка уже есть и её не нужно пересобирать (готовый `dist/` в репозитории):

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1 -SkipBuild
```

### 4. Запустите

1. Откройте терминал и запустите `pi`.
2. Веб-сервер запустится автоматически при старте сессии (либо вручную командой `/webui`).
3. Pi выведет адрес вида `http://127.0.0.1:3001`. Откройте его в браузере.

По умолчанию сервер слушает только `127.0.0.1` и доступен только с этого компьютера. Подробности: `docs/configuration.md`.

## Ручная установка (без скрипта)

```powershell
npm install
npx tsc --noEmit
npx vite build
```

Затем добавьте в `%USERPROFILE%\.pi\agent\settings.json`:

```json
{
  "packages": [
    "npm:@dengarchik/pi-web-ui"
  ]
}
```

## Обновление

```powershell
git pull
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

## Что изменено относительно оригинала

- Дизайн в стиле DeepSeek Harness: тёмная графитовая палитра (`#131417`), центрированная колонка (`860px`), капсула ввода и сворачиваемые карточки `Thinking` / `Tool call`.
- Живая телеметрия в шапке: скорость генерации (`tok/s`), таймер ответа и визуальная шкала лимита контекста.
- Автозапуск веб-сервера при старте `pi`.
- Название и подпись в интерфейсе: `DenGarChiK Web UI`, подпись `by @dengarchik`.
- Пакет и импорты переименованы в `@dengarchik/pi-web-ui`.
- `dist/` включён в репозиторий, чтобы интерфейс можно было развернуть без пересборки.

## Разработка

```powershell
npm run dev:web      # Vite dev-сервер (порт 4444, прокси на 3001)
npm run check        # Biome
npm run build:web    # tsc --noEmit + vite build
```

## Устранение проблем

- **`node` не найден**: переустановите Node.js и откройте новое окно PowerShell (PATH обновляется только в новых окнах).
- **Ошибка `running scripts is disabled`**: запускайте скрипт через `powershell -ExecutionPolicy Bypass -File .\install.ps1`.
- **Pi не видит пакет**: проверьте `%USERPROFILE%\.pi\agent\settings.json` и наличие папки `%USERPROFILE%\.pi\agent\npm\node_modules\@dengarchik\pi-web-ui`.
- **`/webui` пишет, что сервер не запустился**: убедитесь, что порт не занят другим процессом.

## Лицензия

MIT. См. `LICENSE`.
