$(function () {
    "use strict";

    const CAMERA_OFF_COLOR = "#EF3413";
    const CAMERA_ON_COLOR = "#67FA28";

    function getCameraNavbarIcon() {
        return $("#navbar_systemmenu > a > i");
    }
    
    function reorderNavbarItems() {
        const systemMenu = $("#navbar_systemmenu").closest("li");

        /*
         * TP-Link Smartplug icon.
         *
         * Buscamos el icono power del smartplug dentro del navbar
         * y tomamos su <li> contenedor.
         */
        let powerMenu = null;

        $(".navbar i.icon-off").each(function () {
            const item = $(this).closest("li");

            /*
             * Evitamos confundir el antiguo System menu con el
             * smartplug. Nuestro System menu ya debe usar icon-camera.
             */
            if (
                item.length &&
                !item.is(systemMenu)
            ) {
                powerMenu = item;
                return false;
            }
        });

        if (
            powerMenu &&
            powerMenu.length &&
            systemMenu.length
        ) {
            /*
             * Resultado:
             *
             * Power -> Camera -> resto del navbar
             */
            systemMenu.insertAfter(powerMenu);
        }
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

    function updateNavbar() {
        updateNavbarIcons();
        reorderNavbarItems();
    }

    updateNavbar();

    setTimeout(updateNavbar, 250);
    setTimeout(updateNavbar, 1000);
    setTimeout(updateNavbar, 2500);
});