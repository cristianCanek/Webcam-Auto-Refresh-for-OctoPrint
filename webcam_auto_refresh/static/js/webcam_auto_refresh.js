$(function () {
    "use strict";

    let previousState = null;
    let requestInProgress = false;
    let timer = null;

    let snapshotUrl = null;
    let streamUrl = null;

    let pollInterval = 2000;
    let transitionDelay = 500;

    function log() {
        console.log(
            "[Webcam Auto Refresh]",
            ...arguments
        );
    }

    function getWebcamImage() {
        let image = $("#webcam_image");

        if (!image.length) {
            image = $('img[src*="action=stream"]').first();
        }

        return image;
    }

    function getContainer(image) {
        if (!image || !image.length) {
            return null;
        }

        return image.parent();
    }

    function removeStatus(container) {
        if (!container || !container.length) {
            return;
        }

        container
            .find(".webcam-auto-refresh-status")
            .remove();
    }

    function showStatus(text) {
        const image = getWebcamImage();

        if (!image || !image.length) {
            log("Webcam image element not found");
            return;
        }

        const container = getContainer(image);

        removeStatus(container);

        image.attr("src", "");
        image.hide();

        container.append(
            '<div class="webcam-auto-refresh-status" ' +
            'style="' +
            'display:flex;' +
            'align-items:center;' +
            'justify-content:center;' +
            'min-height:200px;' +
            'background:#111;' +
            'color:#fff;' +
            'font-weight:bold;' +
            'text-align:center;' +
            '">' +
            text +
            "</div>"
        );
    }

    function showOfflineState() {
        showStatus("Webcam offline");
        log("UI -> OFF");
    }

    function showStartingState() {
        showStatus("Starting webcam...");
        log("UI -> STARTING");
    }

    function showOnlineState() {
        const image = getWebcamImage();

        if (!image || !image.length) {
            log("Webcam image element not found");
            return;
        }

        const container = getContainer(image);

        removeStatus(container);

        const separator =
            streamUrl.includes("?") ? "&" : "?";

        const url =
            streamUrl +
            separator +
            "_=" +
            Date.now();

        image.attr("src", url);
        image.show();

        log("UI -> ON");
    }

    function applyState(isOnline) {
        if (isOnline) {
            showStartingState();

            setTimeout(function () {
                showOnlineState();
            }, transitionDelay);

        } else {
            showOfflineState();
        }
    }

    function checkWebcam() {
        if (
            requestInProgress ||
            !snapshotUrl
        ) {
            return;
        }

        requestInProgress = true;

        OctoPrint.util.testUrl(
            snapshotUrl,
            {
                method: "GET"
            }
        )
        .done(function (response) {
            const currentState =
                response.result === true;

            if (previousState === null) {
                previousState = currentState;

                log(
                    "Initial state:",
                    currentState ?
                        "ON" :
                        "OFF"
                );

                applyState(currentState);
                return;
            }

            if (
                currentState !== previousState
            ) {
                log(
                    "State changed:",
                    previousState ?
                        "ON" :
                        "OFF",
                    "->",
                    currentState ?
                        "ON" :
                        "OFF"
                );

                previousState =
                    currentState;

                applyState(currentState);
            }
        })
        .fail(function () {
            log(
                "Webcam status check failed"
            );
        })
        .always(function () {
            requestInProgress = false;
        });
    }

    function startPolling() {
        if (timer) {
            clearInterval(timer);
        }

        checkWebcam();

        timer = setInterval(
            checkWebcam,
            pollInterval
        );

        log(
            "Polling every",
            pollInterval,
            "ms"
        );
    }

    function loadConfiguration() {
        OctoPrint.settings
            .get()
            .done(function (settings) {

                if (
                    settings.webcam &&
                    settings.webcam.snapshot
                ) {
                    snapshotUrl =
                        settings.webcam.snapshot;
                }

                if (
                    settings.webcam &&
                    settings.webcam.stream
                ) {
                    streamUrl =
                        settings.webcam.stream;
                }

                const pluginSettings =
                    settings.plugins &&
                    settings.plugins
                        .webcam_auto_refresh;

                if (pluginSettings) {

                    pollInterval =
                        parseInt(
                            pluginSettings
                                .pollInterval,
                            10
                        ) || 2000;

                    transitionDelay =
                        parseInt(
                            pluginSettings
                                .transitionDelay,
                            10
                        ) || 500;
                }

                log(
                    "Snapshot URL:",
                    snapshotUrl
                );

                log(
                    "Stream URL:",
                    streamUrl
                );

                log(
                    "Transition delay:",
                    transitionDelay,
                    "ms"
                );

                if (
                    !snapshotUrl ||
                    !streamUrl
                ) {
                    console.warn(
                        "[Webcam Auto Refresh] " +
                        "Webcam URLs unavailable"
                    );

                    return;
                }

                startPolling();
            })
            .fail(function () {
                console.error(
                    "[Webcam Auto Refresh] " +
                    "Could not load OctoPrint settings"
                );
            });
    }

    setTimeout(
        loadConfiguration,
        1500
    );
});