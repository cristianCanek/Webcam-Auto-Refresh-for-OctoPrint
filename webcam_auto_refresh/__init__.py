import octoprint.plugin


class WebcamAutoRefreshPlugin(octoprint.plugin.AssetPlugin):

    def get_assets(self):
        return {
            "js": ["js/webcam_auto_refresh.js"]
        }


__plugin_name__ = "Webcam Auto Refresh"
__plugin_version__ = "0.1.0"
__plugin_description__ = "Refreshes OctoPrint when the webcam stream changes state."
__plugin_pythoncompat__ = ">=3.10,<4"

__plugin_implementation__ = WebcamAutoRefreshPlugin()