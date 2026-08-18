import octoprint.plugin


class WebcamAutoRefreshPlugin(
    octoprint.plugin.AssetPlugin,
    octoprint.plugin.SettingsPlugin,
    octoprint.plugin.TemplatePlugin,
):

    def get_assets(self):
        return {
            "js": ["js/webcam_auto_refresh.js"]
        }

    def get_settings_defaults(self):
        return {
            "pollInterval": 2000,
            "transitionDelay": 500,
            "requestTimeout": 1.5,
            "failureThreshold": 2,
            "syncInitialState": True,
            "debugLogging": False,
        }

    def get_template_configs(self):
        return [
            {
                "type": "settings",
                "custom_bindings": False,
            }
        ]


__plugin_name__ = "Webcam Auto Refresh"
__plugin_version__ = "0.4.1"
__plugin_description__ = (
    "Automatically keeps the Classic Webcam view synchronized "
    "with the real state of the webcam stream."
)
__plugin_pythoncompat__ = ">=3.10,<4"

__plugin_implementation__ = WebcamAutoRefreshPlugin()