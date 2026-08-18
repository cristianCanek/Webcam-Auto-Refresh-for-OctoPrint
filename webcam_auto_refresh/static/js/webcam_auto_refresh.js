$(function () {
    "use strict";

    const CHECK_INTERVAL_MS = 2000;
    const SNAPSHOT_URL = "http://localhost:8080/?action=snapshot";

    let previousState = null;
    let requestInProgress = false;

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

            // Primera lectura: solamente memorizar el estado.
            if (previousState === null) {
                previousState = currentState;
                console.log(
                    "[Webcam Auto Refresh] Initial state:",
                    currentState ? "ON" : "OFF"
                );
                return;
            }

            // Sólo hacemos reload si hubo una transición real.
            if (currentState !== previousState) {
                console.log(
                    "[Webcam Auto Refresh] Webcam changed:",
                    previousState ? "ON" : "OFF",
                    "->",
                    currentState ? "ON" : "OFF"
                );

                previousState = currentState;

                // Damos un pequeño margen para que mjpg-streamer
                // termine completamente de subir/bajar.
                setTimeout(function () {
                    window.location.reload();
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

    // Dejamos que OctoPrint termine de cargar primero.
    setTimeout(function () {
        checkWebcam();
        setInterval(checkWebcam, CHECK_INTERVAL_MS);
    }, 2000);
});