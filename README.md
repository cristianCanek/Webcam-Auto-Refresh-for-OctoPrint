# Webcam Auto Refresh for OctoPrint

**Webcam Auto Refresh for OctoPrint** is a small OctoPrint plugin created to keep the **Classic Webcam** view synchronized with an MJPEG webcam stream that can be started and stopped independently from OctoPrint.


## Version 0.3.1

Second experimental attempt at integrating directly with Classic Webcam.

> **Development note:** this version was not functional in the original test environment.


### Status

Experimental / known broken.


### Changed in v0.3.1

- Reworked the webcam refresh strategy to use Classic Webcam's native ViewModel.
- Attempted to call Classic Webcam's own refresh handler instead of manually rebuilding the stream.
- Kept the configurable poll interval and transition delay introduced in v0.3.0.


### Retained from previous versions

- Automatic webcam ON/OFF state detection.
- Snapshot-based health checking.
- OctoPrint Settings page.
- Configurable **Poll interval**.
- Configurable **Transition delay**.


### Known issue

The Classic Webcam ViewModel dependency was not obtained in the way expected by this implementation, so automatic UI refresh still did not work.


### Intended behavior

- Periodically checks whether the webcam is available.
- Detects webcam **ON/OFF** transitions.
- Uses Classic Webcam's own ViewModel refresh method when the state changes.
- Avoids reloading the complete OctoPrint page.
- Keeps polling interval and transition delay configurable from OctoPrint Settings.

> The Classic Webcam ViewModel dependency was not resolved correctly in the original test environment, so the automatic refresh path did not work.


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

This version shifted focus from direct stream reconstruction to integrating with Classic Webcam's own refresh logic through its ViewModel.


## Why?

When an MJPEG webcam stream is stopped externally, OctoPrint's Classic Webcam interface may continue displaying the last received frame.

Likewise, when the stream is started again, the webcam view may remain offline until the user manually refreshes the webcam or reloads the browser.

**Webcam Auto Refresh for OctoPrint** solves this problem by periodically checking the webcam backend and updating only the Classic Webcam area whenever the detected webcam state changes.


## How it works

Version 0.3.1 changes the refresh strategy introduced in v0.3.0.

Instead of rebuilding the webcam stream directly, it attempts to obtain the Classic Webcam ViewModel and invoke its native refresh handler whenever the detected webcam state changes.

Conceptually:

```text
Periodic snapshot health check
          │
          ▼
Is webcam available?
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
Find Classic Webcam ViewModel
          │
          ▼
Call native webcam refresh
```

The ViewModel dependency was not obtained correctly in the original test environment, so the final refresh step did not execute as intended.


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
                    └── Requests Classic Webcam refresh
```

*In v0.3.1, the Classic Webcam ViewModel dependency was not resolved correctly, so this refresh path was not functional in the original test environment.*

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

The intended behavior is to detect the resulting state change and ask Classic Webcam to refresh its own view without reloading the rest of OctoPrint.

Because the Classic Webcam ViewModel dependency was not resolved correctly in v0.3.1, this did not work in the original test environment.

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

The main failure mode in this version is that the Classic Webcam ViewModel is not available through the dependency mechanism expected by this implementation.

As a result, the plugin can detect state changes but cannot reliably trigger Classic Webcam's native refresh behavior.


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
Webcam Auto Refresh (0.3.1)
```


## Limitations

- Classic Webcam ViewModel dependency resolution does not work correctly in the original test environment.
- Automatic webcam UI refresh is therefore non-functional in this release.
- Snapshot health checking still depends on the expected webcam endpoint.
- No transient-failure protection.
- Single-camera design.
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
