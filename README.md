# Webcam Auto Refresh for OctoPrint

**Webcam Auto Refresh for OctoPrint** is a small OctoPrint plugin created to keep the **Classic Webcam** view synchronized with an MJPEG webcam stream that can be started and stopped independently from OctoPrint.

## Version 0.1.0

First proof of concept.

### Status
Working proof of concept.

### What it does
- Polls a fixed webcam snapshot URL every 2 seconds.
- Detects webcam **ON/OFF** transitions.
- Reloads the entire OctoPrint page when the state changes.

### Configuration
No settings page yet.

Snapshot endpoint:
```text
http://localhost:8080/?action=snapshot
```

## Why?

When an MJPEG webcam stream is stopped externally, OctoPrint's Classic Webcam interface may continue displaying the last received frame.

Likewise, when the stream is started again, the webcam view may remain offline until the user manually refreshes the webcam or reloads the browser.

**Webcam Auto Refresh for OctoPrint** solves this problem by periodically checking the webcam backend and automatically reloading the OctoPrint interface whenever the detected webcam state changes.

## How it works

Version 0.1.0 periodically checks a fixed webcam snapshot endpoint using OctoPrint's URL testing API.

Conceptually:

```text
Every 2 seconds
      │
      ▼
Is snapshot available?
      │
 ┌────┴────┐
 │         │
YES       NO
 │         │
ON        OFF
 │         │
 └────┬────┘
      │
Did state change?
      │
     YES
      │
      ▼
Reload OctoPrint page
```

The first successful health check establishes the initial webcam state.

When the detected state changes from ON to OFF or from OFF to ON, the plugin reloads the complete OctoPrint page after a short delay.

This forces Classic Webcam to rebuild its view and reflect the new webcam state.

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
                    └── Reloads OctoPrint UI
```

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

The plugin detects the resulting state change and reloads the OctoPrint page automatically.

This makes it possible to combine it with OctoPrint System Commands, power-control plugins, smart plugs, or other automation systems.

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
    └── static/
        └── js/
            └── webcam_auto_refresh.js
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
Webcam Auto Refresh (0.1.0)
```

## Limitations
- Full-page reload.
- Reloading OctoPrint interrupts the current browser UI state.
- Hardcoded snapshot URL.
- Fixed timing values.
- No transient-failure protection.

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