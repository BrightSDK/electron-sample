# Bright Data SDK – Electron Sample App

A minimal but complete Electron application that demonstrates how to integrate and use the [Bright Data](https://brightdata.com) SDK in a desktop app. It covers every public API method, the consent customisation surface, and all SDK-emitted events.

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [SDK Initialisation](#sdk-initialisation)
- [API Reference](#api-reference)
  - [Methods](#methods)
  - [Events](#events)
- [Supported Languages](#supported-languages)

---

## Overview

The app initialises the Bright Data SDK at startup and exposes its full functionality. A **Settings** panel contains an example of implementation of SDK consent (Web Indexing option with on/off slider). **Developer Mode** unlocks an Actions panel for calling every SDK method manually, a live Event Log, and a **Consent Customiser** for tweaking the appearance of the built-in consent dialog at runtime.

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 18 or later |
| npm | 9 or later |
| Electron | 29 |
| Visual Studio Build Tools | 2019 or later (for native addon build) |
| Bright Data SDK |

The native addon (`brd-sdk`) uses the **N-API**, so it does not need to be rebuilt for every new Electron or Node.js version.

---

## Getting Started

```bash
# 1. Install dependencies and rebuild the native addon for Electron
cd electron-sample
npm install

# 2. Run the app
npm run start
```
---

## Project Structure

```
electron-sample/
├── main.js          # Main process – BrowserWindow + SDK init
├── ipc.js           # IPC handlers that call into the native addon
├── preload.js       # contextBridge – exposes sdkApi to the renderer
├── window.js        # Singleton reference to the BrowserWindow
├── renderer.js      # Renderer process – UI logic
├── index.html       # App UI
├── style.css        # All styles
└── package.json
```

---

## SDK Initialisation

The SDK is initialised in `main.js` after the renderer window has finished loading:

```js
await brd_sdk.init(appId, options);
```

| Parameter | Type | Description |
|---|---|---|
| `appId` | `string` | Unique reverse-domain identifier for your application (e.g. `com.example.myapp`). Make sure your app is registered in BrightData CP, otherwise the SDK will not start.|
| `options.app_path` | `string` | Absolute path to the directory that contains the SDK DLLs. Pass `path.dirname(app.getPath('exe'))` for packaged builds. |
| `options.app_name` | `string` | Human-readable name displayed on the consent screen. |
| `options.logo_link` | `string` | URL of your app's logo, shown on the consent screen. |
| `options.skip_consent` | `boolean` | When `true`, the consent dialog is never shown automatically. Pass `true` when you want to show the consent screen at a different point, e.g. after the user sees an ad or spends some time in the app.|

`init()` returns a Promise. On success it resolves; on failure it rejects with an error message. The sample app relays these outcomes to the renderer via `sdk:ready` / `sdk:init_error` IPC events.

---

## API Reference

All methods are accessible from the renderer process through `window.sdkApi` (exposed via `contextBridge` in `preload.js`). Every method returns a Promise.

### Methods

#### `get_uuid() → { ok, uuid }`

Returns the unique identifier assigned to this SDK installation.

```js
const { ok, uuid } = await window.sdkApi.get_uuid();
```

---

#### `get_tracking_id() → { ok, tracking_id }`

Returns the tracking ID for the current session. This is distinct from the UUID and may change across sessions.

```js
const { ok, tracking_id } = await window.sdkApi.get_tracking_id();
```

---

#### `get_status() → { status_name, opt_in }`

Returns the current service status and the user's consent choice.

| Field | Type | Description |
|---|---|---|
| `status_name` | `string` | Human-readable service state (e.g. `"Running"`, `"Connected"`, `"Idle"`). |
| `opt_in` | `boolean \| null` | `true` if the user has opted in, `false` if opted out, `null` if no choice has been made yet. |

```js
const { status_name, opt_in } = await window.sdkApi.get_status();
```

---

#### `is_supported() → { ok, supported }`

Returns `true` if the SDK is supported on the current platform/OS version.

```js
const { ok, supported } = await window.sdkApi.is_supported();
```

---

#### `show_consent() → { ok }`

Opens the built-in Bright Data consent dialog. Use this to prompt the user to opt in at a point of your choosing (e.g. first launch, or when they toggle a setting).

```js
await window.sdkApi.show_consent();
```

---

#### `opt_out() → { ok }`

Opts the user out of web indexing without showing the consent dialog.

```js
await window.sdkApi.opt_out();
```

---

#### `fix_sdk() → { ok }`

Attempts to repair a broken or out-of-date SDK installation. Call this if `get_status()` reports an unexpected state that persists across restarts.

```js
await window.sdkApi.fix_sdk();
```

---

#### `set_benefit_txt(text) → { ok }`

Overrides the first sentence displayed on the consent screen (the "benefit" description shown to the user). Must be called before `show_consent()`.

| Parameter | Type | Description |
|---|---|---|
| `text` | `string` | The custom benefit text to display. |

```js
await window.sdkApi.set_benefit_txt('Help improve the internet while you browse.');
```

---

#### `set_lang(locale) → { ok }`

Sets the language of the consent screen. Must be called before `show_consent()`. See [Supported Languages](#supported-languages) for valid values.

| Parameter | Type | Description |
|---|---|---|
| `locale` | `string` | A BCP 47-style locale code (e.g. `"en-US"`, `"fr-FR"`). |

```js
await window.sdkApi.set_lang('fr-FR');
```

---

#### `set_consent_txt_color(argb) → { ok }`

Sets the color of the body text on the consent screen.

| Parameter | Type | Description |
|---|---|---|
| `argb` | `string` | Color in `#AARRGGBB` hex format (alpha, red, green, blue). |

```js
await window.sdkApi.set_consent_txt_color('#FF1A1A2E');
```

---

#### `set_consent_app_name_color(argb) → { ok }`

Sets the color of your application name as it appears on the consent screen.

```js
await window.sdkApi.set_consent_app_name_color('#FF0055FF');
```

---

#### `set_consent_bg_color(argb) → { ok }`

Sets the background color of the consent dialog.

```js
await window.sdkApi.set_consent_bg_color('#FFFFFFFF');
```

---

#### `set_consent_btn_color(argb) → { ok }`

Sets the color of the action buttons on the consent dialog.

```js
await window.sdkApi.set_consent_btn_color('#FF00AA44');
```

> **Color format note:** All color methods accept `#AARRGGBB` (8-digit hex with alpha). The HTML `<input type="color">` produces `#rrggbb`; prefix with `FF` for full opacity, e.g. `#FF` + `rrggbb`.

---

### Events

Subscribe to SDK events from the renderer process via the `on_*` methods on `window.sdkApi`.

#### `on_ready(callback)`

Fired once after `init()` resolves successfully. This is the earliest point at which other API methods can be called safely.

```js
window.sdkApi.on_ready(() => {
    console.log('SDK is ready');
});
```

---

#### `on_init_error(callback(message))`

Fired if `init()` fails. `message` is the error string.

```js
window.sdkApi.on_init_error(msg => {
    console.error('SDK init failed:', msg);
});
```

---

#### `on_status_change(callback({ code, name }))`

Fired whenever the service status changes.

| Field | Type | Description |
|---|---|---|
| `code` | `number` | Numeric status code. |
| `name` | `string` | Human-readable status name (e.g. `"Running"`, `"Idle"`, `"Stopped"`). |

```js
window.sdkApi.on_status_change(({ code, name }) => {
    console.log(`Service status: ${name} (${code})`);
});
```

---

#### `on_choice_change(callback({ code, name }))`

Fired whenever the user's consent choice changes (e.g. after the consent dialog is dismissed).

| Field | Type | Description |
|---|---|---|
| `code` | `number` | Numeric choice code. |
| `name` | `string` | `"Agree"` (opted in) or `"Disagree"` (opted out). |

```js
window.sdkApi.on_choice_change(({ code, name }) => {
    const opted_in = name === 'Agree';
});
```

---

#### `on_dialog_shown(callback)`

Fired when the consent dialog becomes visible.

```js
window.sdkApi.on_dialog_shown(() => console.log('Consent dialog opened'));
```

---

#### `on_dialog_closed(callback)`

Fired when the consent dialog is dismissed (regardless of the user's choice).

```js
window.sdkApi.on_dialog_closed(() => console.log('Consent dialog closed'));
```

---

## Supported Languages

| Locale code | Language |
|---|---|
| `en-US` | English (default) |
| `de-De` | German |
| `es-Es` | Spanish |
| `fr-FR` | French |
| `it-IT` | Italian |
| `pt-PT` | Portuguese |
| `ru-RU` | Russian |
| `zh-CN` | Chinese (Simplified) |
