<img width="1672" height="941" alt="8cb20671-5c44-4282-81a4-4a85b1b2841a" src="https://github.com/user-attachments/assets/1a274582-7dcb-40bb-8473-99b77b84b713" />
# VisionEdge v5.0

**Скрытый браузер + AI-ассистент + прокси-менеджер + расширения**
---

## 📖 Описание (Russian)

VisionEdge — это анонимный браузер с возможностью полной кастомизации интерфейса (прозрачность, RGB-полоса, темы), встроенным AI-чат-ботом (онлайн через OpenRouter или офлайн через Ollama), менеджером прокси, поддержкой пользовательских расширений (JS-скрипты), защитой от захвата экрана (Windows Display Affinity), вкладками, закладками, историей, менеджером паролей и автообновлением с GitHub. Работает полностью без консоли, сворачивается в трей.

**Главные особенности:**
- 🎨 Полупрозрачное окно, акриловый блюр, RGB-подсветка
- 🔒 Защита от записи экрана (OBS, скриншоты)
- 🌐 Встроенный AI-чат (OpenRouter / Ollama)
- 🔄 Автообновление через GitHub (скачивание и замена .exe)
- 🧩 Расширения (userscripts .js или .zip)
- 📡 Прокси-менеджер (HTTP/SOCKS5, тест скорости)
- 📚 Закладки, история, менеджер паролей (Base64)
- 📥 Менеджер загрузок с выбором папки
- 📖 Режим чтения, переводчик Google, скриншоты
- ⌨️ Глобальные хоткеи (даже когда окно не в фокусе)
- 🧹 Автоочистка истории/куки/кэша при выходе

**Требования:** Windows 10/11, Python 3.12 (или готовый .exe)

---

## 📖 Description (English)

VisionEdge is a stealth browser with full UI customization (transparency, RGB bar, themes), built‑in AI chatbot (online via OpenRouter or offline via Ollama), proxy manager, custom extensions (JS scripts), screen‑capture protection (Windows Display Affinity), tabs, bookmarks, history, password manager and auto‑update from GitHub. It runs without a console and minimizes to system tray.

**Key features:**
- 🎨 Translucent window, acrylic blur, RGB glow
- 🔒 Screen capture protection (OBS, screenshots)
- 🌐 Integrated AI chat (OpenRouter / Ollama)
- 🔄 Auto‑update from GitHub (download & replace .exe)
- 🧩 Extensions (userscripts .js or .zip)
- 📡 Proxy manager (HTTP/SOCKS5, speed test)
- 📚 Bookmarks, history, password manager (Base64)
- 📥 Download manager with custom folder
- 📖 Reader mode, Google Translate, screenshots
- ⌨️ Global hotkeys (even when window is not focused)
- 🧹 Auto‑clear history/cookies/cache on exit

**Requirements:** Windows 10/11, Python 3.12 (or prebuilt .exe)

---

## 🚀 Установка и запуск / Installation

### Из исходников / From source
```bash
git clone https://github.com/qelrix/visionedge.git
cd visionedge
pip install -r requirements.txt
python hidden_browser.py
```

**Зависимости / Dependencies:**
```
PySide6
pyside6-addons
pynput
Pillow
openai
psutil (опционально / optional)
```

### Сборка .exe / Build .exe
```batch
build.bat
```
(Требуется PyInstaller)

---

## 🤖 AI-ассистент / AI Assistant

- **Онлайн:** Укажите API-ключ OpenRouter в настройках → AI → `sk-or-v1-...`. Бесплатные модели помечены `:free`.
- **Офлайн:** Установите [Ollama](https://ollama.com), выполните `ollama pull qwen2.5:0.5b` и выберите модель в настройках.

---

## ⌨️ Горячие клавиши / Hotkeys

| Комбинация | Действие |
|------------|----------|
| `Ctrl+Shift+F7` | Защита экрана вкл/выкл |
| `Ctrl+Shift+F9` | Цикл прозрачности окна |
| `Ctrl+Shift+X` | Экстренное закрытие (без трея) |
| `Ctrl+Shift+A` | Открыть AI-панель |
| `Ctrl+T` | Новая вкладка |
| `Ctrl+W` | Закрыть вкладку |
| `Ctrl+D` | Добавить закладку |
| `Ctrl+H` | История |
| `Ctrl+J` | Загрузки |
| `F5` | Обновить страницу |
| `F9` | Режим чтения |
| `F10` | Скриншот |

---

## ⚙️ Настройки / Settings

Все настройки хранятся в `%APPDATA%\VisionEdge\settings.json`.  
Пароль мастера защищает доступ к программе.

---

## 📄 Лицензия / License

MIT © qelrix

---

**Репозиторий:** [github.com/qelrix/visionedge](https://github.com/creator-ghost/visionedge)
