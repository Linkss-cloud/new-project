console.log("COOKIE SHAKA FILE LOADED");


let cookiePlayer = null;


window.loadCookieShaka = async function (stream) {

    console.log(
        "COOKIE STREAM RECEIVED:",
        stream
    );


    const video =
        document.getElementById("videoPlayer");


    const loader =
        document.getElementById("loader");


    const box =
        document.getElementById("shaka-container");


    if (!video) {

        console.error(
            "VIDEO ELEMENT NOT FOUND"
        );

        return;

    }


    try {

        /*
         * SHOW PLAYER
         */

        if (box) {
            box.style.display = "block";
        }


        /*
         * SHAKA SUPPORT
         */

        shaka.polyfill.installAll();


        if (!shaka.Player.isBrowserSupported()) {

            console.error(
                "SHAKA NOT SUPPORTED"
            );

            if (loader) {
                loader.innerHTML =
                    "BROWSER NOT SUPPORTED";
            }

            return;

        }


        /*
         * VIDEO AUTOPLAY SETTINGS
         *
         * Muted autoplay direct URL par
         * browser ke liye reliable hota hai.
         */

        video.muted = true;

        video.autoplay = true;

        video.playsInline = true;



        /*
         * CREATE PLAYER
         */

        if (!cookiePlayer) {

            cookiePlayer =
                new shaka.Player();

            await cookiePlayer.attach(
                video
            );

        } else {

            await cookiePlayer.unload();

        }



        /*
         * DRM
         */

        cookiePlayer.configure({

            drm: {

                clearKeys: {}

            }

        });



        /*
         * CLEAR OLD REQUEST FILTERS
         */

        cookiePlayer
            .getNetworkingEngine()
            .clearAllRequestFilters();



        /*
         * CLEAR KEY
         */

        if (
            stream.key &&
            stream.key.includes(":")
        ) {

            const parts =
                stream.key.split(":");


            const kid =
                parts[0]
                    .trim()
                    .toLowerCase();


            const key =
                parts[1]
                    .trim()
                    .toLowerCase();


            console.log(
                "CLEAR KEY:",
                kid
            );


            cookiePlayer.configure({

                drm: {

                    clearKeys: {

                        [kid]: key

                    }

                }

            });

        }



        /*
         * COOKIE / TOKEN
         */

        const token =
            stream.cookie
                ? stream.cookie.trim()
                : "";



        /*
         * NETWORK REQUEST FILTER
         */

        cookiePlayer
            .getNetworkingEngine()
            .registerRequestFilter(
                (type, request) => {

                    console.log(
                        "REQUEST:",
                        request.uris[0]
                    );


                    if (!token) {
                        return;
                    }



                    /*
                     * REFERER
                     */

                    request.headers["Referer"] =
                        "https://www.jiotv.com/";



                    /*
                     * USER AGENT
                     */

                    request.headers["User-Agent"] =
                        "plaYtv/7.1.5 (Linux;Android 13) ExoPlayerLib/2.11.6";



                    /*
                     * TOKEN
                     */

                    if (
                        request.uris[0]
                            .startsWith("https://")
                        &&
                        !request.uris[0]
                            .includes("__hdnea__")
                    ) {

                        request.uris[0] +=

                            (
                                request.uris[0]
                                    .includes("?")
                                    ? "&"
                                    : "?"
                            )

                            +

                            token;

                    }

                }
            );



        /*
         * STREAM URL
         */

        const url =
            stream.mpd ||
            stream.url;


        if (!url) {

            console.error(
                "NO STREAM URL"
            );

            if (loader) {
                loader.innerHTML =
                    "STREAM URL NOT FOUND";
            }

            return;

        }


        console.log(
            "LOADING:",
            url
        );



        /*
         * LOAD STREAM
         */

        await cookiePlayer.load(
            url
        );


        console.log(
            "COOKIE SHAKA LOADED"
        );



        /*
         * AUTOPLAY
         */

        try {

            await video.play();


            console.log(
                "COOKIE SHAKA AUTOPLAY SUCCESS"
            );


        } catch (error) {

            console.warn(
                "COOKIE SHAKA AUTOPLAY BLOCKED:",
                error
            );

        }



        /*
         * VIDEO STARTED
         */

        video.onplaying = function () {

            console.log(
                "VIDEO STARTED"
            );


            if (loader) {

                loader.style.display =
                    "none";

            }

        };



        /*
         * VIDEO ERROR
         */

        video.onerror = function (error) {

            console.error(
                "VIDEO ERROR:",
                error
            );

        };



        /*
         * SHAKA ERROR
         */

        cookiePlayer.addEventListener(
            "error",
            function (event) {

                console.error(
                    "SHAKA ERROR:",
                    event.detail
                );

            }
        );

    }


    catch (error) {

        console.error(
            "COOKIE SHAKA ERROR:",
            error
        );


        if (loader) {

            loader.innerHTML =
                "STREAM ERROR";

        }

    }

};
