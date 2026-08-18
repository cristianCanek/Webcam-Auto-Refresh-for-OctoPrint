# Webcam Auto Refresh for OctoPrint

**Webcam Auto Refresh for OctoPrint** is a small OctoPrint plugin created to keep the **Classic Webcam** view synchronized with an MJPEG webcam stream that can be started and stopped independently from OctoPrint.


## Version 0.3.0

Experimental configuration release.

> **Development note:** this version introduced a regression in the original test environment.

### Status

Experimental / known broken.

### Added in v0.3.0

- OctoPrint Settings page.
- Configurable **Poll interval**.
- Configurable **Transition delay**.
- Attempted automatic discovery of snapshot and stream URLs.
- `Offline`, `Starting webcam...`, and `Online` UI states.

### Retained from v0.2.0

- Direct webcam DOM updates.
- Automatic ON/OFF state detection.
- Stale MJPEG image removal.
- Automatic MJPEG stream reconnection.

### Known issue

The attempted webcam URL discovery did not match the way Classic Webcam exposed its configuration in the tested OctoPrint version.

As a result, automatic webcam state detection and UI synchronization did not work correctly in this release.


### Intended behavior

- Periodically checks the configured webcam snapshot endpoint.
- Detects webcam **ON/OFF** transitions.
- Updates only the webcam DOM when the state changes.
- Hides the stale MJPEG image when the webcam goes offline.
- Reconnects the MJPEG stream automatically when the webcam comes back online.
- Allows the polling interval and transition delay to be configured from OctoPrint Settings.

> Due to a regression in webcam URL discovery, this behavior did not work correctly in the original test environment.


### Configuration

Open: **Settings → Webcam Auto Refresh**

Current options:
- **Poll interval**: How often the plugin checks whether the webcam is available.
- **Transition delay**: Delay between detecting an ON/OFF transition and updating the webcam UI.

Default values:
```text
Polling:           2000 ms
Delay:              500 ms
```

*The defaults are recommended for most local-network installations.*

This version also attempted to obtain the webcam snapshot and stream URLs dynamically from OctoPrint instead of relying on the hardcoded URLs used by previous versions.


## Why?

When an MJPEG webcam stream is stopped externally, OctoPrint's Classic Webcam interface may continue displaying the last received frame.

Likewise, when the stream is started again, the webcam view may remain offline until the user manually refreshes the webcam or reloads the browser.

**Webcam Auto Refresh for OctoPrint** solves this problem by periodically checking the webcam backend and updating only the Classic Webcam area whenever the detected webcam state changes.


## How it works

Version 0.3.0 attempts to obtain the webcam snapshot and stream URLs from OctoPrint's configuration and periodically checks the resulting snapshot endpoint using OctoPrint's URL testing API.

Conceptually:

```text
OctoPrint webcam configuration
          │
          ▼
Discover snapshot / stream URLs
          │
          ▼
Periodic snapshot health check
          │
          ▼
Is snapshot available?
          │
     ┌────┴────┐
     │         │
    YES       NO
     │         │
     ON       OFF
     │         │
     └────┬────┘
          │
    Did state change?
          │
         YES
          │
          ▼
   Update webcam DOM
```

The URL-discovery step did not work correctly with the Classic Webcam configuration exposed by the tested OctoPrint version, which caused this release to regress.


## Example use case

A typical setup can look like this:

```text
OctoPrint
   │
   ├── Printer power ON
   │      │
   │      ├── Smart plug ON
   │      └── mjpg-streamer ON
   │
   └── Printer power OFF
          │
          ├── mjpg-streamer OFF
          └── Smart plug OFF

Webcam Auto Refresh
          │
          └── Detects webcam state
                    │
                    └── Updates webcam DOM
```

*In v0.3.0, the URL-discovery regression prevented this flow from working reliably in the original test environment.*

The plugin does not need to know how the webcam was turned on or off; it only observes its state.


## External webcam control

Webcam Auto Refresh intentionally does **not** start or stop the webcam itself.

For example, `mjpg-streamer` can be controlled independently with scripts such as:

```bash
s6-svc -u /run/s6/services/mjpg-streamer
```

and:

```bash
s6-svc -d /run/s6/services/mjpg-streamer
```

The intended behavior is to detect the resulting state change and update the webcam view automatically without reloading the rest of OctoPrint.

Due to the URL-discovery regression in v0.3.0, this did not work reliably in the original test environment.

The design is intended to support integration with OctoPrint System Commands, power-control plugins, smart plugs, or other automation systems.


## Debugging

Browser-side activity can be inspected using the browser developer console:

```text
F12 → Console
```

and filter for:

```text
Webcam Auto Refresh
```

This release may report missing or unavailable webcam URLs because its URL-discovery implementation was not compatible with the Classic Webcam configuration used in the original test environment.


## Requirements

- OctoPrint
- Classic Webcam plugin
- Python `>=3.10,<4`
- MJPEG webcam stream
- A working snapshot endpoint used for webcam health checking

The plugin has currently been tested with:

- OctoPrint **1.11.8**
- Classic Webcam
- `mjpg-streamer`
- OctoPrint running in Docker


## Installation

The project is currently a development-style OctoPrint plugin and can be installed manually.

Copy the plugin directory into the OctoPrint plugins directory.

Example Docker bind-volume installation:

```bash
mkdir -p /path/to/octoprint/plugins/

cp -a webcam_auto_refresh \
    /path/to/octoprint/plugins/
```

The resulting structure should look like:

```text
plugins/
└── webcam_auto_refresh/
    ├── __init__.py
    ├── static/
    │   └── js/
    │       └── webcam_auto_refresh.js
    └── templates/
        └── webcam_auto_refresh_settings.jinja2
```

Restart OctoPrint afterward.

For Docker:

```bash
docker restart octoprint
```

Verify that OctoPrint loaded the plugin:

```bash
docker logs octoprint 2>&1 | grep -i "Webcam Auto Refresh"
```

Expected output:

```text
Webcam Auto Refresh (0.3.0)
```


## Limitations

- Webcam URL discovery is experimental and does not work correctly with the Classic Webcam configuration used in the original test environment.
- Automatic webcam state synchronization is therefore unreliable in this release.
- No transient-failure protection.
- Single-camera design.
- Direct DOM manipulation depends on the Classic Webcam HTML structure.
- Only polling interval and transition delay are configurable.


## License

This project is licensed under the MIT License.

See [LICENSE](LICENSE) for details.


## Disclaimer

This project is an independent OctoPrint plugin and is not affiliated with or endorsed by the OctoPrint project.

Use printer power automation responsibly. A webcam or remote monitoring system is not a substitute for appropriate printer safety measures.


## Support

If this plugin is useful to you and you'd like to support its development:

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20the%20project-555?logo=ko-fi&logoColor=white)](https://ko-fi.com/cristiancampuzano)
[![PayPal](https://img.shields.io/badge/PayPal-Leave%20a%20tip-555?logo=paypal&logoColor=white)](https://paypal.me/cristianCanek)
