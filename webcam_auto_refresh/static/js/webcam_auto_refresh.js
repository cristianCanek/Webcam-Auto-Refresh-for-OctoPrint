$(function () {
    "use strict";

    function WebcamAutoRefreshViewModel(parameters) {
        const self = this;

        self.settingsViewModel = parameters[0];

        self.classicWebcamViewModel = null;

        self.previousState = null;
        self.requestInProgress = false;
        self.timer = null;

        self.pollInterval = 2000;
        self.transitionDelay = 500;

        /*
         * Health check.
         *
         * Por ahora dejamos únicamente ESTA URL fija.
         * En v0.4 la obtendremos del backend/plugin.
         */
        self.snapshotUrl =
            "http://localhost:8080/?action=snapshot";

        self.log = function () {
            console.log(
                "[Webcam Auto Refresh]",
                ...arguments
            );
        };


        /*
         * ------------------------------------------------------
         * Settings
         * ------------------------------------------------------
         */

        self.loadPluginSettings = function () {
            try {
                const plugin =
                    self.settingsViewModel
                        .settings
                        .plugins
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
                    "Could not read plugin settings. " +
                    "Using defaults.",
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


        /*
         * ------------------------------------------------------
         * Classic Webcam discovery
         * ------------------------------------------------------
         */

        self.findClassicWebcamViewModel =
            function (allViewModels) {

                self.classicWebcamViewModel =
                    allViewModels.find(function (vm) {

                        return (
                            vm &&
                            vm.constructor &&
                            vm.constructor.name ===
                                "ClassicWebcamViewModel"
                        );

                    }) || null;

                if (self.classicWebcamViewModel) {
                    self.log(
                        "ClassicWebcamViewModel found"
                    );
                } else {
                    console.warn(
                        "[Webcam Auto Refresh] " +
                        "ClassicWebcamViewModel not found"
                    );
                }
            };


        /*
         * ------------------------------------------------------
         * DOM helpers
         * ------------------------------------------------------
         */

        self.getWebcamImage = function () {
            return $("#webcam_image");
        };


        /*
         * ------------------------------------------------------
         * OFF state
         * ------------------------------------------------------
         */

        self.showOfflineState = function () {
            const image =
                self.getWebcamImage();

            /*
            * Cortamos la conexión MJPEG y ocultamos sólo la imagen.
            * No insertamos ningún elemento adicional en el contenedor.
            *
            * Así dejamos que Classic Webcam muestre su propio estado
            * "Webcam stream not loaded".
            */
            image.attr("src", "");
            image.hide();

            self.log("UI -> OFF");
        };


        /*
         * ------------------------------------------------------
         * ON state
         * ------------------------------------------------------
         */

        self.showOnlineState = function () {
            const image =
                self.getWebcamImage();

            let streamUrl = null;

            try {
                streamUrl =
                    self.classicWebcamViewModel
                        .settings
                        .streamUrl();
            } catch (error) {
                console.error(
                    "[Webcam Auto Refresh] " +
                    "Could not obtain Classic Webcam stream URL",
                    error
                );

                return;
            }

            if (!streamUrl) {
                console.error(
                    "[Webcam Auto Refresh] " +
                    "Classic Webcam stream URL is empty"
                );

                return;
            }

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
         * State transition
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
         * Health check
         * ------------------------------------------------------
         */

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

                /*
                 * Primera lectura:
                 * sólo sincronizamos estado interno.
                 */
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

                /*
                 * Nada cambió.
                 */
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

                self.applyState(
                    currentState
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


        /*
         * ------------------------------------------------------
         * Polling
         * ------------------------------------------------------
         */

        self.startPolling = function () {

            if (self.timer) {
                clearInterval(
                    self.timer
                );
            }

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


        /*
         * ------------------------------------------------------
         * OctoPrint lifecycle
         * ------------------------------------------------------
         */

        self.onAllBound =
            function (allViewModels) {

                self.loadPluginSettings();

                self.findClassicWebcamViewModel(
                    allViewModels
                );

                if (
                    !self.classicWebcamViewModel
                ) {
                    return;
                }

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

        elements: []
    });
});