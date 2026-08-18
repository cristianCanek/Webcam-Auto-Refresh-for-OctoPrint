$(function () {
    "use strict";

    const CHECK_INTERVAL_MS = 2000;
    const SNAPSHOT_URL = "http://localhost:8080/?action=snapshot";
    const STREAM_URL = "/webcam/?action=stream";

    let previousState = null;
    let requestInProgress = false;

    function getWebcamImage() {
        // Classic Webcam normalmente utiliza este elemento.
        let image = $("#webcam_image");

        // Fallback por si cambia el ID en otra versión.
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

    function showOfflineState() {
        const image = getWebcamImage();

        if (!image || !image.length) {
            console.warn(
                "[Webcam Auto Refresh] Webcam image element not found"
            );
            return;
        }

        const container = getContainer(image);

        // Detenemos inmediatamente cualquier stream anterior.
        image.attr("src", "");
        image.hide();

        if (
            container &&
            container.length &&
            !container.find(".webcam-auto-refresh-offline").length
        ) {
            container.append(
                '<div class="webcam-auto-refresh-offline" ' +
                'style="display:flex;' +
                'align-items:center;' +
                'justify-content:center;' +
                'min-height:200px;' +
                'background:#111;' +
                'color:#fff;' +
                'font-weight:bold;' +
                'text-align:center;">' +
                'Webcam stream not available' +
                '</div>'
            );
        }

        console.log("[Webcam Auto Refresh] Webcam UI -> OFF");
    }

    function showOnlineState() {
        const image = getWebcamImage();

        if (!image || !image.length) {
            console.warn(
                "[Webcam Auto Refresh] Webcam image element not found"
            );
            return;
        }

        const container = getContainer(image);

        if (container && container.length) {
            container.find(".webcam-auto-refresh-offline").remove();
        }

        // Cache-buster explícito para obligar al browser
        // a abrir una conexión MJPEG nueva.
        const url =
            STREAM_URL +
            (STREAM_URL.includes("?") ? "&" : "?") +
            "_=" +
            Date.now();

        image.attr("src", url);
        image.show();

        console.log("[Webcam Auto Refresh] Webcam UI -> ON");
    }

    function applyState(isOnline) {
        if (isOnline) {
            showOnlineState();
        } else {
            showOfflineState();
        }
    }

    function checkWebcam() {
        if (requestInProgress) {
            return;
        }

        requestInProgress = true;

        OctoPrint.util.testUrl(
            SNAPSHOT_URL,
            {
                method: "GET"
            }
        )
        .done(function (response) {
            const currentState = response.result === true;

            // Primera lectura: sincronizar UI sin reload.
            if (previousState === null) {
                previousState = currentState;

                console.log(
                    "[Webcam Auto Refresh] Initial state:",
                    currentState ? "ON" : "OFF"
                );

                applyState(currentState);
                return;
            }

            if (currentState !== previousState) {
                console.log(
                    "[Webcam Auto Refresh] State changed:",
                    previousState ? "ON" : "OFF",
                    "->",
                    currentState ? "ON" : "OFF"
                );

                previousState = currentState;

                // Pequeño margen para que mjpg-streamer
                // termine de iniciar/detenerse.
                setTimeout(function () {
                    applyState(currentState);
                }, 500);
            }
        })
        .fail(function () {
            console.warn(
                "[Webcam Auto Refresh] Webcam status check failed"
            );
        })
        .always(function () {
            requestInProgress = false;
        });
    }

    setTimeout(function () {
        checkWebcam();
        setInterval(checkWebcam, CHECK_INTERVAL_MS);
    }, 2000);
});