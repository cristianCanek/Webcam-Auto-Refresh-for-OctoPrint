$(function () {
    "use strict";

    function WebcamAutoRefreshViewModel(parameters) {
        const self = this;

        self.settingsViewModel = parameters[0];
        self.classicWebcamViewModel = parameters[1];

        self.previousState = null;
        self.requestInProgress = false;
        self.timer = null;

        self.pollInterval = 2000;
        self.transitionDelay = 500;

        // La URL de snapshot permanece estable en nuestra
        // instalación y se usa únicamente como health check.
        self.snapshotUrl =
            "http://localhost:8080/?action=snapshot";

        self.log = function () {
            console.log(
                "[Webcam Auto Refresh]",
                ...arguments
            );
        };

        self.loadPluginSettings = function () {
            try {
                const settings =
                    self.settingsViewModel.settings;

                const plugin =
                    settings.plugins
                        .webcam_auto_refresh;

                self.pollInterval =
                    parseInt(
                        plugin.pollInterval(),
                        10
                    ) || 2000;

                self.transitionDelay =
                    parseInt(
                        plugin.transitionDelay(),
                        10
                    ) || 500;

            } catch (error) {
                console.warn(
                    "[Webcam Auto Refresh] " +
                    "Could not read plugin settings, " +
                    "using defaults.",
                    error
                );
            }

            self.log(
                "Poll interval:",
                self.pollInterval,
                "ms"
            );

            self.log(
                "Transition delay:",
                self.transitionDelay,
                "ms"
            );
        };

        self.refreshWebcam = function () {
            self.log(
                "Refreshing Classic Webcam"
            );

            if (
                self.classicWebcamViewModel &&
                typeof self.classicWebcamViewModel
                    .onWebcamRefresh === "function"
            ) {
                self.classicWebcamViewModel
                    .onWebcamRefresh();

                return;
            }

            console.warn(
                "[Webcam Auto Refresh] " +
                "Classic Webcam refresh function " +
                "not available"
            );
        };

        self.checkWebcam = function () {
            if (self.requestInProgress) {
                return;
            }

            self.requestInProgress = true;

            OctoPrint.util.testUrl(
                self.snapshotUrl,
                {
                    method: "GET"
                }
            )
            .done(function (response) {
                const currentState =
                    response.result === true;

                // Primera lectura:
                // sólo memorizar estado.
                if (self.previousState === null) {
                    self.previousState =
                        currentState;

                    self.log(
                        "Initial state:",
                        currentState
                            ? "ON"
                            : "OFF"
                    );

                    return;
                }

                // No hacemos nada mientras
                // no cambie el estado.
                if (
                    currentState ===
                    self.previousState
                ) {
                    return;
                }

                self.log(
                    "State changed:",
                    self.previousState
                        ? "ON"
                        : "OFF",
                    "->",
                    currentState
                        ? "ON"
                        : "OFF"
                );

                self.previousState =
                    currentState;

                setTimeout(
                    function () {
                        self.refreshWebcam();
                    },
                    self.transitionDelay
                );
            })
            .fail(function () {
                console.warn(
                    "[Webcam Auto Refresh] " +
                    "Health check request failed"
                );
            })
            .always(function () {
                self.requestInProgress =
                    false;
            });
        };

        self.startPolling = function () {
            if (self.timer) {
                clearInterval(
                    self.timer
                );
            }

            self.checkWebcam();

            self.timer = setInterval(
                self.checkWebcam,
                self.pollInterval
            );

            self.log(
                "Polling started"
            );
        };

        self.onAllBound = function () {
            self.loadPluginSettings();

            setTimeout(
                self.startPolling,
                1500
            );
        };
    }

    OCTOPRINT_VIEWMODELS.push({
        construct:
            WebcamAutoRefreshViewModel,

        dependencies: [
            "settingsViewModel"
        ],

        optional: [
            "classicWebcamViewModel"
        ],

        elements: []
    });
});