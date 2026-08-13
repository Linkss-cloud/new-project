console.log(
    "COOKIE SHAKA FILE LOADED"
);


let cookiePlayer = null;
let cookieRequestFilterRegistered = false;


/*
====================================================
HELPERS
====================================================
*/

function getCookieElement(id) {

    return document.getElementById(id);

}


function hideCookieLoader() {

    const loader =
        getCookieElement("loader");


    if (loader) {

        loader.style.display =
            "none";

    }

}


function showCookieError(
    message = "STREAM ERROR"
) {

    const loader =
        getCookieElement("loader");


    if (loader) {

        loader.innerText =
            message;

        loader.style.display =
            "block";

    }

}


/*
====================================================
STOP COOKIE PLAYER
====================================================
*/

window.stopCookieShaka =
    async function () {

        console.log(
            "STOP COOKIE SHAKA"
        );


        if (!cookiePlayer) {
            return;
        }


        try {

            await cookiePlayer.unload();

        } catch (error) {

            console.error(
                "COOKIE SHAKA UNLOAD ERROR:",
                error
            );

        }

    };


/*
====================================================
LOAD COOKIE SHAKA
====================================================
*/

window.loadCookieShaka =
    async function (stream) {

        console.log(
            "COOKIE STREAM RECEIVED:",
            stream
        );


        const video =
            getCookieElement(
                "videoPlayer"
            );


        const loader =
            getCookieElement(
                "loader"
            );


        const box =
            getCookieElement(
                "shaka-container"
            );


        if (!video) {

            console.error(
                "VIDEO ELEMENT NOT FOUND"
            );

            showCookieError(
                "VIDEO ELEMENT NOT FOUND"
            );

            return false;

        }


        try {

            /*
            ==========================================
            SHOW PLAYER
            ==========================================
            */

            if (box) {

                box.style.display =
                    "block";

            }


            /*
            ==========================================
            LOADER
            ==========================================
            */

            if (loader) {

                loader.innerText =
                    "LOADING STREAM...";

                loader.style.display =
                    "block";

            }


            /*
            ==========================================
            VIDEO SETTINGS
            ==========================================
            */

            video.muted = true;

            video.autoplay = true;

            video.playsInline = true;


            /*
            ==========================================
            IMPORTANT:
            EVENT PEHLE REGISTER KARO
            ==========================================
            */

            video.onplaying =
                function () {

                    console.log(
                        "COOKIE VIDEO PLAYING"
                    );

                    hideCookieLoader();

                };


            video.oncanplay =
                function () {

                    console.log(
                        "COOKIE VIDEO CAN PLAY"
                    );

                };


            video.onerror =
                function (event) {

                    console.error(
                        "COOKIE VIDEO ERROR:",
                        event
                    );

                };


            /*
            ==========================================
            SHAKA
            ==========================================
            */

            shaka.polyfill.installAll();


            if (
                !shaka.Player.isBrowserSupported()
            ) {

                console.error(
                    "SHAKA NOT SUPPORTED"
                );

                showCookieError(
                    "BROWSER NOT SUPPORTED"
                );

                return false;

            }


            /*
            ==========================================
            CREATE / REUSE PLAYER
            ==========================================
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
            ==========================================
            SHAKA ERROR
            ==========================================
            */

            cookiePlayer.onerror =
                function (event) {

                    console.error(
                        "COOKIE SHAKA ERROR:",
                        event.detail
                    );

                };


            /*
            ==========================================
            DRM
            ==========================================
            */

            cookiePlayer.configure({

                drm: {

                    clearKeys: {}

                }

            });


            /*
            ==========================================
            CLEAR KEY
            ==========================================
            */

            if (
                stream.key &&
                String(stream.key).includes(":")
            ) {

                const parts =
                    String(stream.key).split(":");


                const kid =
                    parts[0]
                        .trim()
                        .toLowerCase();


                const key =
                    parts[1]
                        .trim()
                        .toLowerCase();


                console.log(
                    "COOKIE CLEAR KEY:",
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
            ==========================================
            TOKEN / COOKIE
            ==========================================
            */

            const token =
                stream.cookie
                    ? String(
                        stream.cookie
                    ).trim()
                    : "";


            /*
            ==========================================
            NETWORKING ENGINE
            ==========================================
            */

            const networkingEngine =
                cookiePlayer
                    .getNetworkingEngine();


            if (!networkingEngine) {

                console.error(
                    "NETWORKING ENGINE NOT FOUND"
                );

                showCookieError(
                    "NETWORK ERROR"
                );

                return false;

            }


            /*
            ==========================================
            CLEAR OLD FILTERS
            ==========================================
            */

            networkingEngine
                .clearAllRequestFilters();


            /*
            ==========================================
            REQUEST FILTER
            ==========================================
            */

            cookieRequestFilterRegistered =
                false;


            if (token) {

                networkingEngine
                    .registerRequestFilter(
                        function (
                            type,
                            request
                        ) {

                            if (
                                !request ||
                                !request.uris ||
                                !request.uris.length
                            ) {

                                return;

                            }


                            const originalUrl =
                                request.uris[0];


                            console.log(
                                "COOKIE REQUEST:",
                                originalUrl
                            );


                            /*
                            IMPORTANT:
                            Browser JavaScript cannot reliably
                            override User-Agent.
                            
                            Authentication/token handling
                            should preferably be done by your
                            authorized backend/CDN configuration.
                            */


                            if (
                                originalUrl.startsWith(
                                    "https://"
                                ) &&
                                !originalUrl.includes(
                                    "__hdnea__"
                                )
                            ) {

                                const separator =
                                    originalUrl.includes("?")
                                        ? "&"
                                        : "?";


                                request.uris[0] =
                                    originalUrl +
                                    separator +
                                    token;

                            }

                        }
                    );


                cookieRequestFilterRegistered =
                    true;

            }


            /*
            ==========================================
            STREAM URL
            ==========================================
            */

            const url =
                stream.mpd ||
                stream.url;


            if (!url) {

                console.error(
                    "NO STREAM URL"
                );

                showCookieError(
                    "STREAM URL NOT FOUND"
                );

                return false;

            }


            console.log(
                "COOKIE SHAKA LOADING:",
                url
            );


            /*
            ==========================================
            LOAD
            ==========================================
            */

            await cookiePlayer.load(
                url
            );


            console.log(
                "COOKIE SHAKA LOAD SUCCESS"
            );


            /*
            ==========================================
            AUTOPLAY
            ==========================================
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
            ==========================================
            LOADER FALLBACK
            ==========================================
            */

            setTimeout(
                function () {

                    /*
                    readyState:
                    0 = nothing
                    1 = metadata
                    2 = current data
                    3 = future data
                    4 = enough data
                    */

                    if (
                        video.readyState >= 3 &&
                        !video.paused
                    ) {

                        console.log(
                            "COOKIE VIDEO IS PLAYING - FALLBACK HIDE"
                        );

                        hideCookieLoader();

                    }

                },
                1000
            );


            /*
            ==========================================
            SECOND FALLBACK
            ==========================================
            */

            setTimeout(
                function () {

                    if (
                        video.readyState >= 3 &&
                        !video.paused
                    ) {

                        hideCookieLoader();

                    }

                },
                3000
            );


            return true;

        } catch (error) {

            console.error(
                "COOKIE SHAKA ERROR:",
                error
            );


            showCookieError(
                "STREAM ERROR"
            );


            return false;

        }

    };
