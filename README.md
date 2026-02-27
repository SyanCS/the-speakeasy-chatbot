# The Speakeasy

A 1920s speakeasy barkeep chatbot that runs entirely in your browser. Ask for cocktail ideas from what you have, ingredient substitutions with ratios, recipe scaling for a crowd, or help fixing a drink that went wrong. Uses Chrome’s on-device **Prompt API (Gemini Nano)** — no backend, no API keys, no data leaves your machine.

![The Speakeasy](bar-chat-assistant.png)

### Demo

**[Watch demonstration video](https://drive.google.com/file/d/1a66jY_FVDFbj3u2UkcrXdrEJXXzfrmsB/view?usp=sharing)** (Google Drive)

---

## Features

- **Cocktail suggestions** — List your spirits and mixers (or send a photo of your bar); get 1–2 drink ideas and a first step.
- **Substitutions** — “I don’t have Campari” → exact ratios and a short caveat.
- **Scaling** — Paste or photo a recipe; get amounts scaled for N people or for batching.
- **Fix a drink** — Too strong, too sweet, broken emulsion, etc. → 2–3 concrete fixes.
- **Multimodal** — Text and optional image (photo of bottles or a recipe); optional voice input.
- **Streaming responses** — Answers stream in with throttled DOM updates and a “thinking” state so the UI stays responsive.
- **Model download in-app** — If Gemini Nano isn’t installed, the UI guides you to download it once (with a user gesture); status and progress are always visible.

---

## Prerequisites

- **Google Chrome** or **Chrome Canary** (recent version).
- **Prompt API for Gemini Nano** must be enabled:
  1. Open `chrome://flags/#prompt-api-for-gemini-nano`.
  2. Set it to **Enabled**.
  3. Restart Chrome.

The first time you run the app, you may need to **download the model**. The app shows a “Load the barkeep” section; click the button (Chrome requires a user gesture to start the download). Progress and status are shown in the UI.

---

## Setup

### Clone the repo

```bash
git clone https://github.com/SyanCS/the-speakeasy-chatbot.git
cd the-speakeasy-chatbot
```

(Or use SSH: `git clone git@github.com:SyanCS/the-speakeasy-chatbot.git` if you have keys set up.)

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm start
```

This starts `http-server` on the default port (usually **8080**) with cache disabled so you always get the latest code. Open **http://localhost:8080** (or the URL printed in the terminal) in Chrome.

---

## Architecture

The app is a small **client-only** SPA with a clear separation between AI logic, UI state, and user input.

### High-level flow

```
User (text + optional image/audio)
    → FormController.handleSubmit()
    → AIService.createSession(prompt, temperature, topK, file)
    → Chrome Prompt API (LanguageModel.create + promptStreaming)
    → Streaming chunks
    → FormController (throttled updates) → View.setOutput()
    → User sees answer in #output
```

### Entry point

- **`index.html`** — Single page: header + logo, model-download section, form (parameters, file input, textarea, submit), output area.
- **`index.js`** — Bootstraps the app: creates `AIService`, `View`, runs `checkRequirements()`. If the model is missing or still downloading, it shows the download section and wires the “Load the barkeep” / “Check again” flow. If the model is ready, it shows the section as “Bar is open” and calls `initializeAfterRequirements()` (params, controller, event listeners).

### Core modules

| Layer        | File                     | Role |
|-------------|---------------------------|------|
| **Service** | `services/aiService.js`   | Talks to the Chrome Prompt API. `checkRequirements()` checks browser, `LanguageModel` availability, and returns errors or `{ downloadable, status }`. `startModelDownload(onProgress)` starts the model download (must be called from a user gesture). `createSession(question, temperature, topK, file)` creates a session with the speakeasy system prompt, sends the user message (and optional image/audio), yields streaming text chunks. Handles abort. |
| **View**    | `views/view.js`           | DOM and UI state. References form elements, output, model-download section. Methods: parameter display, file preview, `setOutput` / `showError`, `showModelDownloadSection(status)`, `setDownloadStatus()`, `setDownloadProgress()`, button labels. No business logic. |
| **Controller** | `controllers/formController.js` | Connects view and service. On submit: validates (text or file required), shows “Mixing your drink…” then “The barkeep is thinking…”, calls `aiService.createSession()`, consumes the async iterator with throttled updates (e.g. every 50ms) and a one-time “thinking” message until first content. Renders final or streamed response. Handles stop and errors. |

### Model download and “user gesture”

Chrome requires a **user gesture** (e.g. a click) to start the model download when availability is `downloadable` or `downloading`. The app never calls `LanguageModel.create()` on page load. Instead it shows a section with a button; when the user clicks, `startModelDownload()` is invoked synchronously in the click handler (no `await` before it), so the gesture is preserved. Progress is reported via a callback and reflected in the download section; when the model is ready, the section shows “Bar is open” and the rest of the app initializes.

### Styling

- **`style.css`** — Speakeasy 1920s theme: dark background, burgundy and gold accents, serif type. Covers layout, form, download section, buttons, and output area.

### Static assets

- **`bar-chat-assistant.png`** — Logo shown next to the title in the header.

---

## Project structure

```
the-speakeasy-chatbot/
├── index.html              # Single page shell
├── index.js                # App entry and bootstrap
├── style.css               # Speakeasy theme
├── package.json            # Scripts and deps (http-server)
├── .gitignore
├── bar-chat-assistant.png   # Header logo
├── controllers/
│   └── formController.js   # Submit handler, streaming, throttling
├── services/
│   └── aiService.js        # Chrome Prompt API, model download, session
└── views/
    └── view.js             # DOM refs and UI updates
```

No backend, no build step. The server is for development only (`http-server` with `-c-1` to disable cache).

---

## Tech stack

- **Runtime:** Browser only (Chrome with Prompt API).
- **AI:** Chrome’s built-in **Prompt API** (Gemini Nano); no external API keys.
- **Stack:** Vanilla JS (ES modules), HTML, CSS.
- **Dev server:** `http-server` (npm).

---

## License

ISC.
