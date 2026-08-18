$(function () {
    "use strict";

    function WebcamAutoRefreshViewModel(parameters) {
        const self = this;

        self.settingsViewModel = parameters[0];

        self.classicWebcamViewModel = null;
        self.classicWebcamSettingsViewModel = null;

        self.previousState = null;
        self.requestInProgress = false;

        self.timer = null;

        self.consecutiveFailures = 0;

        self.pollInterval = 2000;
        self.transitionDelay = 500;
        self.requestTimeout = 1.5;
        self.failureThreshold = 2;
        self.syncInitialState = true;
        self.debugLogging = false;


        /*
         * ------------------------------------------------------
         * Logging
         * ------------------------------------------------------
         */

        self.log = function () {
            if (!self.debugLogging) {
                return;
            }

            console.log(
                "[Webcam Auto Refresh]",
                ...arguments
            );
        };


        self.warn = function () {
            console.warn(
                "[Webcam Auto Refresh]",
                ...arguments
            );
        };


        /*
         * ------------------------------------------------------
         * Helpers
         * ------------------------------------------------------
         */

        self.unwrap = function (value) {
            if (typeof ko !== "undefined") {
                return ko.unwrap(value);
            }

            if (typeof value === "function") {
                return value();
            }

            return value;
        };


        self.getPluginSettings = function () {
            try {
                return self
                    .settingsViewModel
                    .settings
                    .plugins
                    .webcam_auto_refresh;
            } catch (error) {
                return null;
            }
        };


        self.getClassicWebcamSettings = function () {
            try {
                return self
                    .settingsViewModel
                    .settings
                    .plugins
                    .classicwebcam;
            } catch (error) {
                return null;
            }
        };


        /*
         * ------------------------------------------------------
         * Runtime settings
         * ------------------------------------------------------
         */

        self.loadRuntimeSettings = function () {
            const plugin =
                self.getPluginSettings();

            if (!plugin) {
                self.warn(
                    "Plugin settings unavailable. " +
                    "Using defaults."
                );

                return;
            }

            self.pollInterval =
                parseInt(
                    self.unwrap(plugin.pollInterval),
                    10
                ) || 2000;

            self.transitionDelay =
                parseInt(
                    self.unwrap(plugin.transitionDelay),
                    10
                ) || 500;

            self.requestTimeout =
                parseFloat(
                    self.unwrap(plugin.requestTimeout)
                ) || 1.5;

            self.failureThreshold =
                parseInt(
                    self.unwrap(plugin.failureThreshold),
                    10
                ) || 2;

            self.syncInitialState =
                self.unwrap(plugin.syncInitialState)
                !== false;

            self.debugLogging =
                self.unwrap(plugin.debugLogging)
                === true;


            /*
             * Defensive bounds.
             */

            self.pollInterval =
                Math.max(
                    500,
                    self.pollInterval
                );

            self.transitionDelay =
                Math.max(
                    0,
                    self.transitionDelay
                );

            self.requestTimeout =
                Math.max(
                    0.5,
                    self.requestTimeout
                );

            self.failureThreshold =
                Math.max(
                    1,
                    self.failureThreshold
                );


            self.log(
                "Runtime settings loaded"
            );

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

            self.log(
                "Request timeout:",
                self.requestTimeout,
                "s"
            );

            self.log(
                "Failure threshold:",
                self.failureThreshold
            );
        };


        /*
         * ------------------------------------------------------
         * Classic Webcam discovery
         * ------------------------------------------------------
         */

        self.discoverViewModels =
            function (allViewModels) {

                self.classicWebcamViewModel =
                    allViewModels.find(
                        function (vm) {
                            return (
                                vm &&
                                vm.constructor &&
                                vm.constructor.name ===
                                    "ClassicWebcamViewModel"
                            );
                        }
                    ) || null;


                self.classicWebcamSettingsViewModel =
                    allViewModels.find(
                        function (vm) {
                            return (
                                vm &&
                                vm.constructor &&
                                vm.constructor.name ===
                                    "ClassicWebcamSettingsViewModel"
                            );
                        }
                    ) || null;


                if (
                    !self.classicWebcamViewModel
                ) {
                    self.warn(
                        "ClassicWebcamViewModel not found"
                    );
                }


                if (
                    !self.classicWebcamSettingsViewModel
                ) {
                    self.warn(
                        "ClassicWebcamSettingsViewModel " +
                        "not found"
                    );
                }


                self.log(
                    "Classic Webcam viewmodels discovered"
                );
            };


        /*
         * ------------------------------------------------------
         * Webcam URLs
         * ------------------------------------------------------
         */

        self.getSnapshotUrl = function () {

            /*
             * Preferred source:
             * Classic Webcam settings held by OctoPrint.
             */
            const settings =
                self.getClassicWebcamSettings();

            if (
                settings &&
                settings.snapshotUrl !== undefined
            ) {
                const value =
                    self.unwrap(
                        settings.snapshotUrl
                    );

                if (value) {
                    return value;
                }
            }


            /*
             * Fallback:
             * ClassicWebcamSettingsViewModel.
             */
            try {
                if (
                    self.classicWebcamSettingsViewModel &&
                    self.classicWebcamSettingsViewModel
                        .snapshotUrl !== undefined
                ) {
                    return self.unwrap(
                        self
                            .classicWebcamSettingsViewModel
                            .snapshotUrl
                    );
                }
            } catch (error) {
                // handled below
            }


            return null;
        };


        self.getStreamUrl = function () {
            try {
                if (
                    self.classicWebcamViewModel &&
                    self.classicWebcamViewModel
                        .settings &&
                    self.classicWebcamViewModel
                        .settings
                        .streamUrl
                ) {
                    return self
                        .classicWebcamViewModel
                        .settings
                        .streamUrl();
                }
            } catch (error) {
                // handled below
            }

            return null;
        };


        /*
         * ------------------------------------------------------
         * Webcam DOM
         * ------------------------------------------------------
         */

        self.getWebcamImage = function () {
            return $("#webcam_image");
        };


        /*
         * ------------------------------------------------------
         * OFF
         * ------------------------------------------------------
         */

        self.showOfflineState = function () {
            const image =
                self.getWebcamImage();

            if (!image.length) {
                self.warn(
                    "Webcam image element not found"
                );

                return;
            }

            /*
             * Terminate the active MJPEG connection.
             */
            image.attr("src", "");
            image.hide();

            self.log("UI -> OFF");
        };


        /*
         * ------------------------------------------------------
         * ON
         * ------------------------------------------------------
         */

        self.showOnlineState = function () {
            const image =
                self.getWebcamImage();

            if (!image.length) {
                self.warn(
                    "Webcam image element not found"
                );

                return;
            }

            const streamUrl =
                self.getStreamUrl();

            if (!streamUrl) {
                self.warn(
                    "Classic Webcam stream URL unavailable"
                );

                return;
            }

            /*
             * Explicit cache buster.
             */
            const separator =
                streamUrl.includes("?")
                    ? "&"
                    : "?";

            const newUrl =
                streamUrl +
                separator +
                "_=" +
                Date.now();

            image.attr(
                "src",
                newUrl
            );

            image.show();

            self.log(
                "UI -> ON",
                streamUrl
            );
        };


        /*
         * ------------------------------------------------------
         * Apply state
         * ------------------------------------------------------
         */

        self.applyState = function (online) {
            setTimeout(
                function () {
                    if (online) {
                        self.showOnlineState();
                    } else {
                        self.showOfflineState();
                    }
                },
                self.transitionDelay
            );
        };


        /*
         * ------------------------------------------------------
         * State processing
         * ------------------------------------------------------
         */

        self.processHealthResult = function (healthy) {

            let detectedState = null;


            /*
            * Successful health check.
            */
            if (healthy) {

                /*
                * If we had previous failures, log the recovery once
                * before resetting the counter.
                */
                if (self.consecutiveFailures > 0) {
                    self.log(
                        "Health check recovered - failure counter reset"
                    );
                }

                self.consecutiveFailures = 0;
                detectedState = true;

            } else {

                /*
                * If the webcam is already known to be OFF,
                * there is no value in continuing to increment
                * or log the failure counter.
                */
                if (self.previousState === false) {
                    return;
                }

                self.consecutiveFailures += 1;

                /*
                * Clamp the counter at the configured threshold.
                */
                self.consecutiveFailures =
                    Math.min(
                        self.consecutiveFailures,
                        self.failureThreshold
                    );

                self.log(
                    "Health check failure",
                    self.consecutiveFailures,
                    "/",
                    self.failureThreshold
                );

                /*
                * Do not declare OFF until enough consecutive
                * failures have occurred.
                */
                if (
                    self.consecutiveFailures <
                    self.failureThreshold
                ) {
                    return;
                }

                detectedState = false;
            }


            /*
            * First usable state.
            */
            if (self.previousState === null) {

                self.previousState =
                    detectedState;

                self.log(
                    "Initial state:",
                    detectedState
                        ? "ON"
                        : "OFF"
                );

                if (self.syncInitialState) {
                    self.applyState(
                        detectedState
                    );
                }

                return;
            }


            /*
            * No state transition.
            */
            if (
                detectedState ===
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
                detectedState
                    ? "ON"
                    : "OFF"
            );


            self.previousState =
                detectedState;


            self.applyState(
                detectedState
            );
        };


        /*
         * ------------------------------------------------------
         * Health check
         * ------------------------------------------------------
         */

        self.checkWebcam = function () {

            if (
                self.requestInProgress
            ) {
                return;
            }


            const snapshotUrl =
                self.getSnapshotUrl();


            if (!snapshotUrl) {
                self.warn(
                    "Classic Webcam snapshot URL unavailable"
                );

                return;
            }


            self.requestInProgress = true;


            OctoPrint.util.testUrl(
                snapshotUrl,
                {
                    method: "GET",
                    timeout:
                        self.requestTimeout
                }
            )
            .done(function (response) {

                self.processHealthResult(
                    response.result === true
                );

            })
            .fail(function () {

                /*
                 * Failure talking to OctoPrint's test API
                 * counts as a failed health check too.
                 */
                self.processHealthResult(
                    false
                );

            })
            .always(function () {

                self.requestInProgress =
                    false;

            });
        };


        /*
         * ------------------------------------------------------
         * Polling lifecycle
         * ------------------------------------------------------
         */

        self.stopPolling = function () {

            if (self.timer) {

                clearInterval(
                    self.timer
                );

                self.timer = null;
            }

            self.requestInProgress =
                false;

            self.log(
                "Polling stopped"
            );
        };


        self.startPolling = function () {

            self.stopPolling();


            self.checkWebcam();


            self.timer =
                setInterval(
                    self.checkWebcam,
                    self.pollInterval
                );


            self.log(
                "Polling started every",
                self.pollInterval,
                "ms"
            );
        };


        self.restartPolling = function () {

            self.stopPolling();

            self.loadRuntimeSettings();

            self.consecutiveFailures = 0;

            self.startPolling();
        };


        /*
         * ------------------------------------------------------
         * OctoPrint lifecycle
         * ------------------------------------------------------
         */

        self.onAllBound =
            function (allViewModels) {

                self.discoverViewModels(
                    allViewModels
                );

                self.loadRuntimeSettings();


                setTimeout(
                    function () {
                        self.startPolling();
                    },
                    1500
                );
            };


        /*
         * Settings dialog closed:
         * immediately apply new values.
         */
        self.onSettingsHidden =
            function () {

                self.log(
                    "Settings changed, " +
                    "restarting polling"
                );

                self.restartPolling();
            };


        /*
         * OctoPrint backend disconnected.
         */
        self.onServerDisconnect =
            function () {

                self.stopPolling();

            };


        /*
         * Backend connection restored.
         */
        self.onDataUpdaterReconnect =
            function () {

                self.log(
                    "OctoPrint connection restored"
                );

                self.previousState = null;
                self.consecutiveFailures = 0;

                self.restartPolling();
            };
    }


    OCTOPRINT_VIEWMODELS.push({
        construct:
            WebcamAutoRefreshViewModel,

        dependencies: [
            "settingsViewModel"
        ],

        elements: []
    });
});