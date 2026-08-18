# Webcam Auto Refresh for OctoPrint

**Webcam Auto Refresh for OctoPrint** is a small OctoPrint plugin created to keep the **Classic Webcam** view synchronized with an MJPEG webcam stream that can be started and stopped independently from OctoPrint.


## Version 0.4.3

Navbar layout polish version.

> **Development note:** this version keeps the visual webcam status integration introduced in v0.4.2 and reorders the OctoPrint navbar so plugin controls appear together before native controls.


### Status

Stable UI polish version.


### Added in v0.4.3

- Reorders the OctoPrint navbar so plugin-related controls appear together.
- Places the webcam camera menu immediately after the printer power control.
- Keeps OctoPrint's native controls, such as Settings, after the plugin controls.
- Preserves the camera icon and ON/OFF color indication introduced in v0.4.2.
- Does not change webcam health-checking or synchronization behavior.


### Retained from v0.4.2

- Camera icon for the webcam System Commands menu.
- Webcam ON/OFF color indication.
- Visual colors matched to the printer power indicator.
- `Webcam ON` / `Webcam OFF` hover text.
- Dynamic Classic Webcam snapshot URL discovery.
- Dynamic Classic Webcam stream URL discovery.
- Configurable **Poll interval**.
- Configurable **Transition delay**.
- Configurable **Health check timeout**.
- Configurable **Failure threshold**.
- Optional **Initial synchronization**.
- Optional **Debug logging**.
- Runtime settings reload without restarting OctoPrint.
- OctoPrint disconnect/reconnect lifecycle handling.
- Automatic webcam ON/OFF synchronization.
- Failure-counter and recovery-log cleanup.
- No full-page OctoPrint reload.


### Behavior

- Periodically checks whether the webcam is available.
- Detects webcam **ON/OFF** transitions.
- Discovers the real `ClassicWebcamViewModel`.
- Retrieves the configured stream URL from Classic Webcam.
- Clears and hides the MJPEG image when the webcam goes offline.
- Rebuilds the MJPEG stream connection when the webcam comes back online.
- Keeps polling, transition timing, health-check behavior, initial synchronization, and debug logging configurable from OctoPrint Settings.
- Changes the webcam navbar icon color according to the detected webcam state.
- Uses a camera icon instead of the default System Commands power icon.
- Reorders the navbar to place the printer power and webcam controls before OctoPrint's native controls.


### Navbar integration

Version 0.4.3 keeps the camera icon and webcam state colors introduced in v0.4.2 and adds navbar ordering for a cleaner layout.

Expected order:

```text
Power → Camera → Settings → Notifications → Warnings → User
```

The printer power and webcam controls are therefore grouped together before OctoPrint's native controls.

The webcam camera icon continues to reflect the detected webcam state:

```text
Webcam OFF → Camera icon uses the OFF color
Webcam ON  → Camera icon uses the ON color
```

The colors remain intentionally matched to the printer power indicator for visual consistency.


### Configuration

Open: **Settings → Webcam Auto Refresh**

Current options:

- **Poll interval**: How often the webcam health check runs.
- **Transition delay**: Delay before updating the webcam UI after a detected state change.
- **Health check timeout**: Maximum time to wait for the snapshot endpoint.
- **Failure threshold**: Number of consecutive failed checks required before considering the webcam offline.
- **Initial synchronization**: Synchronize the webcam UI with the detected state when OctoPrint loads.
- **Debug logging**: Enable detailed browser-console logging.

Recommended defaults:

```text
Poll interval:           2000 ms
Transition delay:        500 ms
Health check timeout:    1.5 s
Failure threshold:       2
Initial synchronization: ON
Debug logging:           OFF
```


### Runtime settings

Changes made in **Settings → Webcam Auto Refresh** are applied when the Settings dialog closes.

The plugin stops the current polling loop, reloads the configured values, and starts polling again without requiring an OctoPrint restart.


## Why?

When an MJPEG webcam stream is stopped externally, OctoPrint's Classic Webcam interface may continue displaying the last received frame.

Likewise, when the stream is started again, the webcam view may remain offline until the user manually refreshes the webcam or reloads the browser.

**Webcam Auto Refresh for OctoPrint** solves this problem by periodically checking the webcam backend and updating only the Classic Webcam area whenever the detected webcam state changes.


## How it works

Version 0.4.3 keeps the webcam health-check and visual status behavior from v0.4.2 and adds a final navbar layout adjustment.

Conceptually:

```text
OctoPrint ViewModels finish binding
          │
          ▼
Discover Classic Webcam ViewModels
          │
          ├── Snapshot URL
          └── Stream URL
          │
          ▼
Start periodic health checks
          │
          ▼
Snapshot request succeeds?
          │
     ┌────┴────┐
     │         │
    YES       NO
     │         │
 Reset      Failure
 counter     counter +1
     │         │
     │   Threshold reached?
     │         │
     └────┬────┘
          │
          ▼
Determine webcam state
          │
          ▼
Did state change?
          │
         YES
          │
          ▼
Update Classic Webcam DOM
```

A successful snapshot request immediately confirms that the webcam is online.

A failed request increments the consecutive-failure counter. The webcam is only considered offline after the configured failure threshold is reached.

If a health check succeeds before the threshold is reached, the failure counter is reset and a recovery message is logged when debug logging is enabled.

Once the webcam is considered OFF, additional failed checks no longer increase or repeatedly log the failure counter.

This prevents transient request failures from incorrectly switching the webcam UI to OFF while also avoiding unnecessary log spam during extended offline periods.

Whenever the webcam state is applied to the Classic Webcam UI, the navbar camera icon is updated at the same time.

Conceptually:

```text
Detected webcam state
          │
     ┌────┴────┐
     │         │
    ON        OFF
     │         │
     ▼         ▼
Update      Update
webcam UI   webcam UI
     │         │
     ▼         ▼
Camera      Camera
ON color    OFF color
```

After OctoPrint builds the navbar, the webcam System Commands menu is moved immediately after the printer power control.

Conceptually:

```text
Before v0.4.3

Power → Settings → Camera → ...

        ↓

v0.4.3

Power → Camera → Settings → ...
```

This is a visual ordering change only; webcam detection and synchronization logic are unchanged.


### OctoPrint connection lifecycle

When the OctoPrint server connection is lost, webcam polling is stopped.

When the connection is restored, the plugin resets its detected state and restarts polling using the current runtime settings.


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
                    └── Updates Classic Webcam DOM
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

The plugin detects the resulting state change and updates the webcam view automatically without reloading the rest of OctoPrint.

This makes it possible to combine it with OctoPrint System Commands, power-control plugins, smart plugs, or other automation systems.


## Debugging

Browser-side activity can be inspected using the browser developer console:

```text
F12 → Console
```

and filter for:

```text
Webcam Auto Refresh
```

Typical output:

```text
[Webcam Auto Refresh] Classic Webcam viewmodels discovered
[Webcam Auto Refresh] Runtime settings loaded
[Webcam Auto Refresh] Poll interval: 2000 ms
[Webcam Auto Refresh] Transition delay: 500 ms
[Webcam Auto Refresh] Request timeout: 1.5 s
[Webcam Auto Refresh] Failure threshold: 2
[Webcam Auto Refresh] Polling started every 2000 ms

...

[Webcam Auto Refresh] Health check failure 1 / 2
[Webcam Auto Refresh] Health check recovered - failure counter reset

...

[Webcam Auto Refresh] Health check failure 1 / 2
[Webcam Auto Refresh] Health check failure 2 / 2
[Webcam Auto Refresh] State changed: ON -> OFF
[Webcam Auto Refresh] UI -> OFF
```

Navbar icon updates remain synchronized with webcam ON/OFF transitions.

In v0.4.3, the camera menu is additionally repositioned after the printer power control when the navbar is initialized.


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
    │       ├── webcam_auto_refresh.js
    │       └── navbar_icon_swap.js
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
Webcam Auto Refresh (0.4.3)
```


## Limitations

- Single-camera design.
- Direct DOM manipulation depends on the Classic Webcam HTML structure.
- Health checking depends on a working Classic Webcam snapshot endpoint.
- Navbar icon customization and ordering depend on the current OctoPrint navbar structure and icon classes.


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
