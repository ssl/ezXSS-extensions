# ezXSS-extensions

This repository contains examples and documentation for creating extensions for [ezXSS](https://github.com/ssl/ezXSS). Extensions allow you to customize and extend the functionality of ezXSS payloads, enabling you to add new features or modify existing behaviors.

Extensions were introduced in **ezXSS 4.3**. This documentation covers both 4.3+ and the newer 5.0+ payload API. Functions marked with **5.0+** are only available in ezXSS 5 and later.

---

## What are ezXSS Extensions?

ezXSS extensions are JavaScript files that can be loaded into ezXSS payloads to modify or extend their behavior. They are inserted **after** all core functions in the payload, allowing you to override existing functions or add new ones.

Extensions are useful for:
- Adding custom data to reports
- Modifying how data is collected or sent
- Implementing new features not present in the default payload
- Sharing reusable code across multiple payloads

---

## Installing Extensions

There are multiple ways to install extensions in ezXSS:

| Method | Description | Details |
|--------|-------------|---------|
| **Public GitHub Repo** | Point ezXSS to a public GitHub repository | Install all `.js` extension files from the repository |
| **GitHub Blob URL** | Use a direct blob URL from a public GitHub repository | Install a single `.js` extension file via direct link |
| **GitHub Gist** | Use a public or private Gist | Single `.js` extension file per Gist |
| **ezXSS Panel** | Create and add custom extension directly | Manage extensions through the ezXSS management panel |

Once installed, extensions can be enabled or disabled for specific payloads. You can manually check for updates in the ezXSS panel, view the differences between versions, and accept updates if desired.

---

## How to Create an Extension

Every extension must start with a specific comment block that provides metadata about the extension. This is crucial for ezXSS to recognize and load the extension properly.

### Required Header

```javascript
// <ezXSS extension>
// @name              My First Extension
// @description       This is my first extension
// @author            Your Name
// @version           1.0
// </ezXSS extension>
```

- **`@name`**: The name of your extension (2-35 characters).
- **`@description`**: A brief description of what the extension does (max 250 characters).
- **`@author`**: Your name or handle (max 50 characters).
- **`@version`**: The version number of your extension (max 15 characters).

If this header is missing or incorrect, the extension will not load.

### Writing Your Extension Code

After the header, you can write your JavaScript code. This code can:
- Add new functions
- Override existing functions from the default payload
- Include additional custom data fields in reports

#### Example: Adding Custom Data to Reports

```javascript
// <ezXSS extension>
// @name              Platform Info
// @description       Adds the user's platform to the report
// @author            ssl
// @version           1.0
// </ezXSS extension>

ez_a({"platform": navigator.platform});
```

This simple extension adds the user's platform information in a custom `platform` field via the `ez_a` function.

---

## Understanding Payload Functions

The ezXSS payload consists of several functions that handle data collection, sending reports, and optional persistence. Below are tables describing the functions included in the default payload and those added when persistence is enabled.

### Default Payload Functions (4.3+)

These functions are available in all versions of ezXSS that support extensions:

| Function Name | Description |
|---|---|
| `ez_n(e)` | Returns the value of `e` if defined, otherwise an empty string. |
| `ez_cb(e, t, o)` | Sends collected data to the ezXSS server via POST. On error, retries once after blanking heavy fields. |
| `ez_hL()` | Main harvest function. Fills `ez_rD` with page data, captures screenshot if html2canvas is present, then runs filter, custom JS, callback, extra pages and persist. |
| `ez_p()` | Runs persistent mode when the persist module is present. |
| `ez_s()` | Applies the noCollect list: blanks fields disabled for this payload. |
| `ez_cp()` | Collects additional specified pages via XHR. |
| `ez_as()` | Implements spider functionality for same-origin links (XHR or iframe mode). |
| `ez_dc(e)` | Fetches and collects data from a URL via XHR. |
| `ez_se(e)` | Serializes the report-data object (JSON with form-encode fallback). |
| `ez_e()` | Executes per-payload custom JS (pre-callback). |
| `ez_l()` | Executes global custom JS (pre-callback). |
| `ez_y()` | Executes per-payload custom JS (post-callback). |
| `ez_esa()` | Executes global custom JS (post-callback). |
| `ez_aE(t, e, n)` | addEventListener / attachEvent shim. |
| `ez_nW()` | Runs `ez_e()` and `ez_l()` before the callback. |
| `ez_dr2(z)` | Runs `ez_y()`, `ez_esa()` and `ez_as()` after the report is sent. |
| `ez_a(k, v)` | Adds data to the extra field without overwriting existing data. |

### Functions Added in 5.0+

These functions were introduced in ezXSS 5 and are **not available** in 4.x:

| Function Name | Description |
|---|---|
| `ez_tok()` | Generates a high-entropy 32-character token for split-body attach requests. |
| `ez_blen(v)` | Returns the UTF-8 byte length of a string (via Blob when available). |
| `ez_atp(t, f, v)` | POSTs a single withheld field to the attach endpoint, keyed by the report token. |
| `ez_fin()` | Final send: when dom+screenshot exceed the max body size, splits them into separate attach requests using `ez_tok`. Otherwise sends everything in one `ez_cb` call. |
| `ez_cg(cb)` | Collects the page's Content-Security-Policy from meta tags and response headers. Calls the callback within 2 seconds. |

> **Note for extension authors:** In ezXSS 5, `ez_hL()` calls `ez_fin()` instead of calling `ez_cb()` directly. If your extension overrides `ez_hL()`, use `ez_fin()` on 5.0+ to ensure large payloads are handled correctly with split-body attach. In 4.x, call `ez_cb(ez_rD, ez_dr2)` as before.

### Global Variables

| Variable | Since | Description |
|---|---|---|
| `ez_rD` | 4.3+ | The report-data object (uri, cookies, referer, user-agent, origin, storage, dom, payload, screenshot, extra). |
| `ez_bid` | 5.0+ | Per-pageload beacon nonce: ties this report to any beacon probes from this page. |
| `ez_bb` | 5.0+ | Beacon URL base (`protocol://domain`). |
| `ez_mb` | 5.0+ | Max callback body in bytes before dom/screenshot are split off (0 = off). |
| `ez_nc` | 4.3+ | The noCollect list: field names disabled for this payload (consumed by `ez_s()`). On 5.0+, add `'csp'` to this list to skip Content-Security-Policy collection. |
| `ez_cv` | 5.0+ | First CSP violation's policy, used as fallback when headers can't be read. |

### Beacon Fallback Functions (5.0+)

When the beacon fallback is enabled in ezXSS 5, these functions handle CSP-bypass probe channels. They are **not available** in 4.x.

| Function Name | Description |
|---|---|
| `ez_bu(type, data)` | Builds a beacon URL for a specific channel type. |
| `ez_bk(e)` | Base64url-encodes the core signal for data-bearing channels. |
| `ez_bf(u)` | Best-effort no-cors fetch used by connect/manifest/report probes. |
| `ez_bc(e)` | Fires the channel cascade: img, connect, style, font, script, media, frame, object, prefetch, manifest and report probes. |

> In 5.0+, `ez_cb` automatically falls back to `ez_bc` when the XHR callback is blocked (status 0). Extensions do not need to call `ez_bc` directly.

### Persist Functions (4.3+)

When the persistence feature is enabled, additional functions are included to maintain a session and proxy navigation. These functions are available in all versions that support extensions, unless noted otherwise.

| Function Name | Since | Description |
|---|---|---|
| `ez_pin()` | 4.3+ | Pings the server every 10 seconds with collected data and console output. |
| `ez_stp()` | 4.3+ | Starts the ping interval. |
| `ez_eva(input)` | 4.3+ | Evaluates a command returned by the server. |
| `eze_ini()` | 4.3+ | Initializes persistent mode: harvests, callbacks, optionally opens the proxy. |
| `ez_persist()` | 4.3+ | Entry point called by `ez_p()`. |
| `ez_stop()` | 4.3+ | Stops persistent mode. |
| `ez_queue()` | 4.3+ | Processes the reverse-proxy request queue. |
| `ra_fl(e, t)` | 4.3+ | Formats log messages with timestamp and level. |
| `ra_wc(e, t)` | 4.3+ | Wraps console methods to capture logs. |
| `ra_client()` | 4.3+ | Reads the server-assigned client ID. |
| `ra_adopt(id)` | 5.0+ | Stores the server-assigned client ID (once). In 4.x, `ra_client()` generates its own ID. |
| `ra_hL()` | 4.3+ | Persistent harvest (sends method:"persist", type:"init"). |
| `ez_dol(e, t, n)` | 4.3+ | Replaces the document with fetched content (SPA navigation). |
| `ra_li(e)` | 4.3+ | Intercepts same-origin link navigation. |
| `ez_hac(e)` | 4.3+ | Routes anchor clicks through `ra_li`. |
| `ra_fo(e)` | 4.3+ | Intercepts same-origin form submissions. |
| `ez_hab(e)` | 4.3+ | Tracks which submit button was clicked. |
| `ez_hap(e)` | 4.3+ | Handles popstate events for SPA navigation. |
| `ez_fet(e, t, n)` | 4.3+ | XHR fetch used by the reverse proxy (Promise with sync fallback). |
| `ez_soc(e, t, s)` | 4.3+ | Opens the reverse-proxy WebSocket connection. In 5.0+, accepts a third `secret` parameter. |
| `ra_r()` | 4.3+ | Rewires links, forms and popstate to the persistent handlers. |

---

### The ez_rD Object (4.3+)

The `ez_rD` object stores all report data. Default fields include: `uri`, `cookies`, `referer`, `user-agent`, `origin`, `localstorage`, `sessionstorage`, `dom`, `payload`, and `screenshot`. In **5.0+**, `csp` is also collected, unless `'csp'` is present in the noCollect list (`ez_nc`).

**Adding Custom Data:**
Use the `.extra` property to add custom fields:

```javascript
// Object format - creates separate fields
ez_rD.extra = {"platform": navigator.platform, "language": navigator.language};

// String format - creates single 'extra' field  
ez_rD.extra = "Custom message";
```

### The ez_a(k,v) Function (4.3+)

Use `ez_a()` to add data safely without overwriting existing extra fields (from other extensions):

```javascript
// Object format
ez_a({"key": "value", "another_key": "another_value"});

// Key-value format
ez_a("key", "value");
```

> Multiple extensions can safely use `ez_a()` without conflicts.

---

## Example Extensions

This repository includes several example extensions to help you get started:

1. **`platform-info.js`**: Collects basic browser and system information
2. **`enhanced-platform-info.js`**: System and browser platform info with fingerprinting
3. **`alert-on-load.js`**: Displays an alert when the payload fires (for testing)
4. **`security-scanner.js`**: Security analysis including headers, CSP, cookies, secrets and vulnerability detection

All example extensions use `ez_a()` and are compatible with both ezXSS 4.3+ and 5.0+.

---

## Create and Share Your Own Extensions

Create your own extensions and share them on GitHub. Extensions can enhance the functionality of ezXSS for various use cases, and sharing them helps the community grow.

If you'd like to have your extension listed here, you can submit a pull request to add it to the list below.

**Community Extensions:**
- (None yet)