$(function () {
    "use strict";

    const CAMERA_OFF_COLOR = "#EF3413";
    const CAMERA_ON_COLOR = "#67FA28";

    function getCameraNavbarIcon() {
        return $("#navbar_systemmenu > a > i");
    }

    function updateNavbarIcons() {

        /*
         * Webcam System menu
         * Power icon -> camera icon
         */
        const systemMenuIcon = getCameraNavbarIcon();

        if (systemMenuIcon.length) {
            systemMenuIcon
                .removeClass(
                    "icon-off " +
                    "icon-power-off " +
                    "fa-power-off"
                )
                .addClass("icon-camera");
        }


        /*
         * TP-Link fallback:
         * bolt -> power
         *
         * Normally the TP-Link plugin itself already
         * handles this via icon: icon-off.
         */
        $("i.icon-bolt").each(function () {
            const icon = $(this);

            if (
                icon.closest(".navbar").length ||
                icon.closest("#navbar").length
            ) {
                icon
                    .removeClass("icon-bolt")
                    .addClass("icon-off");
            }
        });
    }


    /*
     * Public function used by webcam_auto_refresh.js
     * whenever the real webcam state changes.
     */
    window.setWebcamNavbarState = function (online) {
        const icon = getCameraNavbarIcon();

        if (!icon.length) {
            return;
        }

        icon.css(
            "color",
            online
                ? CAMERA_ON_COLOR
                : CAMERA_OFF_COLOR
        );

        icon.attr(
            "title",
            online
                ? "Webcam ON"
                : "Webcam OFF"
        );
    };


    updateNavbarIcons();

    setTimeout(updateNavbarIcons, 250);
    setTimeout(updateNavbarIcons, 1000);
    setTimeout(updateNavbarIcons, 2500);
});