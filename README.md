# Webcam Auto Refresh for OctoPrint

**Webcam Auto Refresh for OctoPrint** is a small OctoPrint plugin created to keep the **Classic Webcam** view synchronized with an MJPEG webcam stream that can be started and stopped independently from OctoPrint.


## Version 0.3.2

Restored working automatic webcam state synchronization by correctly discovering the Classic Webcam ViewModel after OctoPrint finished binding its ViewModels.

> **Development note:** this version restored the functionality that was broken in v0.3.0 and v0.3.1, but introduced a visual layout issue in the offline state.


### Status

Working, with a known offline layout issue.


### Fixed in v0.3.2

- Correctly discovers `ClassicWebcamViewModel` after all OctoPrint ViewModels are bound.
- Restores automatic webcam ON/OFF synchronization.
- Retrieves the configured MJPEG stream URL from Classic Webcam.
- Restores automatic stream reconnection when the webcam comes back online.


### Retained from previous versions

- Snapshot-based webcam health checking.
- OctoPrint Settings page.
- Configurable **Poll interval**.
- Configurable **Transition delay**.
- No full-page OctoPrint reload.


### Known issue

When the webcam goes offline, this version adds a custom offline panel inside the Classic Webcam container.

Because Classic Webcam already maintains its own offline area, the webcam section becomes approximately twice as tall while the stream is unavailable.

This layout issue was fixed in v0.3.3.


### Behavior

- Periodically checks whether the webcam is available.
- Detects webcam **ON/OFF** transitions.
- Discovers the real `ClassicWebcamViewModel`.
- Retrieves the configured stream URL from Classic Webcam.
- Clears and hides the MJPEG image when the webcam goes offline.
- Rebuilds the MJPEG stream connection when the webcam comes back online.
- Keeps polling interval and transition delay configurable from OctoPrint Settings.


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

This version discovers the actual Classic Webcam ViewModel after OctoPrint finishes binding its ViewModels and uses it to obtain the configured MJPEG stream URL.


## Why?

When an MJPEG webcam stream is stopped externally, OctoPrint's Classic Webcam interface may continue displaying the last received frame.

Likewise, when the stream is started again, the webcam view may remain offline until the user manually refreshes the webcam or reloads the browser.

**Webcam Auto Refresh for OctoPrint** solves this problem by periodically checking the webcam backend and updating only the Classic Webcam area whenever the detected webcam state changes.


## How it works

Version 0.3.2 fixes the ViewModel integration attempted in v0.3.1.

Instead of expecting Classic Webcam to be available as a direct dependency, the plugin waits until OctoPrint has finished binding its ViewModels and searches the complete ViewModel list for `ClassicWebcamViewModel`.

Conceptually:

```text
OctoPrint ViewModels finish binding
          │
          ▼
Find ClassicWebcamViewModel
          │
          ▼
Start periodic snapshot health checks
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
Update Classic Webcam DOM
```

When the webcam comes online, the stream URL is obtained from `ClassicWebcamViewModel` and assigned to the webcam image element.

When the webcam goes offline, the MJPEG image is cleared and hidden.

This restored automatic webcam synchronization without reloading the full OctoPrint page.


### Offline layout issue

This version also creates its own offline status panel inside the Classic Webcam container.

Because Classic Webcam already renders its own offline area, the result is an unnecessarily tall webcam section while the camera is OFF.

This issue is corrected in v0.3.3.


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
[Webcam Auto Refresh] Poll interval: 2000 ms
[Webcam Auto Refresh] Transition delay: 500 ms
[Webcam Auto Refresh] ClassicWebcamViewModel found
[Webcam Auto Refresh] Polling started every 2000 ms
[Webcam Auto Refresh] Initial state: OFF
[Webcam Auto Refresh] State changed: OFF -> ON
[Webcam Auto Refresh] UI -> ON /webcam/?action=stream
[Webcam Auto Refresh] State changed: ON -> OFF
[Webcam Auto Refresh] UI -> OFF
```


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
Webcam Auto Refresh (0.3.2)
```


## Limitations

- The custom offline panel causes the Classic Webcam area to become approximately twice as tall while the webcam is OFF.
- Snapshot health checking still depends on the expected webcam endpoint.
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
