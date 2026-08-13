import { db } from "../firebase.js";

import {
    doc,
    getDoc,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


console.log("PLAYER JS LOADED");


/*
====================================================
URL PARAMETER
====================================================
*/

const params = new URLSearchParams(
    window.location.search
);

const matchId = params.get("id");


/*
====================================================
ELEMENTS
====================================================
*/

const matchName =
    document.getElementById("matchName");

const matchTitle =
    document.getElementById("matchTitle");

const serverList =
    document.getElementById("serverList");

const loader =
    document.getElementById("loader");

const shakaBox =
    document.getElementById("shaka-container");

const iosBox =
    document.getElementById("ios-container");

const iframeBox =
    document.getElementById("iframe-container");

const video =
    document.getElementById("videoPlayer");

const iosVideo =
    document.getElementById("ios-video");

const frame =
    document.getElementById("stream-frame");


/*
====================================================
PLAYER VARIABLES
====================================================
*/

let player = null;
let hls = null;
let currentStream = null;


/*
====================================================
LOADER
====================================================
*/

function showLoader(message = "LOADING STREAM...") {

    if (!loader) return;

    loader.innerText = message;
    loader.style.display = "block";

}


function hideLoader() {

    if (!loader) return;

    loader.style.display = "none";

}


/*
====================================================
VIDEO EVENTS
====================================================
*/

function setupVideoEvents(targetVideo) {

    if (!targetVideo) return;

    targetVideo.onplaying = function () {

        console.log(
            "VIDEO PLAYING - HIDING LOADER"
        );

        hideLoader();

    };


    targetVideo.oncanplay = function () {

        console.log(
            "VIDEO CAN PLAY"
        );

    };


    targetVideo.onerror = function (event) {

        console.error(
            "VIDEO ERROR:",
            event
        );

    };

}


/*
====================================================
STOP HLS
====================================================
*/

function stopHls() {

    if (!hls) return;

    try {

        hls.destroy();

    } catch (error) {

        console.error(
            "HLS DESTROY ERROR:",
            error
        );

    }

    hls = null;

}


/*
====================================================
STOP SHAKA
====================================================
*/

async function stopShaka() {

    if (!player) return;

    try {

        await player.unload();

    } catch (error) {

        console.error(
            "SHAKA UNLOAD ERROR:",
            error
        );

    }

}


/*
====================================================
STOP VIDEO
====================================================
*/

function stopVideo(targetVideo) {

    if (!targetVideo) return;

    try {

        targetVideo.pause();

        targetVideo.removeAttribute("src");

        targetVideo.load();

    } catch (error) {

        console.error(
            "VIDEO STOP ERROR:",
            error
        );

    }

}


/*
====================================================
STOP IFRAME
====================================================
*/

function stopIframe() {

    if (!frame) return;

    try {

        frame.src = "about:blank";

    } catch (error) {

        console.error(
            "IFRAME STOP ERROR:",
            error
        );

    }

}


/*
====================================================
STOP ALL PLAYERS
====================================================
*/

async function stopAll() {

    console.log(
        "STOPPING ALL PLAYERS"
    );


    stopHls();


    await stopShaka();


    stopVideo(video);

    stopVideo(iosVideo);


    stopIframe();


    if (shakaBox) {

        shakaBox.style.display = "none";

    }


    if (iosBox) {

        iosBox.style.display = "none";

    }


    if (iframeBox) {

        iframeBox.style.display = "none";

    }

}


/*
====================================================
AUTOPLAY
====================================================
*/

async function autoplayVideo(
    targetVideo,
    name = "VIDEO"
) {

    if (!targetVideo) {

        console.error(
            name +
            ": VIDEO ELEMENT NOT FOUND"
        );

        return false;

    }


    targetVideo.muted = true;

    targetVideo.autoplay = true;

    targetVideo.playsInline = true;


    try {

        await targetVideo.play();

        console.log(
            name +
            ": AUTOPLAY SUCCESS"
        );

        return true;

    } catch (error) {

        console.warn(
            name +
            ": AUTOPLAY BLOCKED",
            error
        );

        return false;

    }

}


/*
====================================================
COOKIE SHAKA
====================================================
*/

async function loadCookiePlayer(stream) {

    console.log(
        "CALLING COOKIE SHAKA:",
        stream
    );


    if (
        typeof window.loadCookieShaka !==
        "function"
    ) {

        console.error(
            "cookie-shaka.js MISSING"
        );

        if (loader) {

            loader.innerText =
                "COOKIE PLAYER ERROR";

        }

        return false;

    }


    try {

        await window.loadCookieShaka(
            stream
        );

        return true;

    } catch (error) {

        console.error(
            "COOKIE PLAYER ERROR:",
            error
        );

        if (loader) {

            loader.innerText =
                "STREAM ERROR";

        }

        return false;

    }

}


/*
====================================================
PLAY STREAM
====================================================
*/

async function playStream(stream) {

    console.log(
        "PLAY STREAM:",
        stream
    );


    if (!stream) {

        console.error(
            "NO STREAM PROVIDED"
        );

        return;

    }


    currentStream = stream;


    showLoader();


    /*
    STOP PREVIOUS STREAM
    */

    await stopAll();


    /*
    ==================================================
    IFRAME
    ==================================================
    */

    if (stream.type === "iframe") {

        console.log(
            "LOADING IFRAME"
        );


        if (iframeBox) {

            iframeBox.style.display =
                "block";

        }


        if (frame) {

            frame.src =
                stream.url || "about:blank";

        }


        hideLoader();

        return;

    }


    /*
    ==================================================
    COOKIE SHAKA
    ==================================================
    */

    if (
        stream.type === "cookie" ||
        (
            stream.cookie &&
            String(stream.cookie).trim() !== ""
        )
    ) {

        console.log(
            "COOKIE SHAKA STREAM:",
            stream
        );


        if (shakaBox) {

            shakaBox.style.display =
                "block";

        }


        await loadCookiePlayer(
            stream
        );

        return;

    }


    /*
    ==================================================
    FANCODE / NORMAL VIDEO
    ==================================================
    */

    if (stream.type === "fancode") {

        console.log(
            "FANCODE STREAM"
        );


        if (iosBox) {

            iosBox.style.display =
                "block";

        }


        if (!iosVideo) {

            console.error(
                "IOS VIDEO NOT FOUND"
            );

            if (loader) {
                loader.innerText =
                    "VIDEO ELEMENT NOT FOUND";
            }

            return;

        }


        setupVideoEvents(
            iosVideo
        );


        iosVideo.muted = true;
        iosVideo.autoplay = true;
        iosVideo.playsInline = true;


        iosVideo.src =
            stream.url || "";


        const played =
            await autoplayVideo(
                iosVideo,
                "FANCODE"
            );


        if (!played) {

            console.warn(
                "FANCODE AUTOPLAY BLOCKED"
            );

        }


        return;

    }


    /*
    ==================================================
    HLS
    ==================================================
    */

    if (stream.type === "hls") {

        console.log(
            "HLS STREAM"
        );


        if (iosBox) {

            iosBox.style.display =
                "block";

        }


        if (!iosVideo) {

            console.error(
                "IOS VIDEO NOT FOUND"
            );

            if (loader) {
                loader.innerText =
                    "VIDEO ELEMENT NOT FOUND";
            }

            return;

        }


        setupVideoEvents(
            iosVideo
        );


        iosVideo.muted = true;
        iosVideo.autoplay = true;
        iosVideo.playsInline = true;


        /*
        HLS.JS
        */

        if (
            window.Hls &&
            window.Hls.isSupported()
        ) {

            console.log(
                "USING HLS.JS"
            );


            hls = new window.Hls({

                enableWorker: true,

                lowLatencyMode: true,

            });


            hls.on(
                window.Hls.Events.ERROR,
                function (
                    event,
                    data
                ) {

                    console.error(
                        "HLS ERROR:",
                        data
                    );


                    if (
                        data &&
                        data.fatal
                    ) {

                        console.error(
                            "FATAL HLS ERROR"
                        );

                    }

                }
            );


            hls.on(
                window.Hls.Events.MANIFEST_PARSED,
                async function () {

                    console.log(
                        "HLS MANIFEST PARSED"
                    );


                    await autoplayVideo(
                        iosVideo,
                        "HLS"
                    );

                }
            );


            hls.loadSource(
                stream.url
            );


            hls.attachMedia(
                iosVideo
            );


        }


        /*
        NATIVE HLS
        */

        else if (
            iosVideo.canPlayType(
                "application/vnd.apple.mpegurl"
            )
        ) {

            console.log(
                "USING NATIVE HLS"
            );


            iosVideo.src =
                stream.url;


            await autoplayVideo(
                iosVideo,
                "NATIVE HLS"
            );

        }


        /*
        HLS NOT SUPPORTED
        */

        else {

            console.error(
                "HLS NOT SUPPORTED"
            );


            if (loader) {

                loader.innerText =
                    "HLS NOT SUPPORTED";

            }

        }


        return;

    }


    /*
    ==================================================
    NORMAL SHAKA DRM
    ==================================================
    */

    if (stream.type === "shaka") {

        console.log(
            "NORMAL SHAKA STREAM"
        );


        if (shakaBox) {

            shakaBox.style.display =
                "block";

        }


        if (!video) {

            console.error(
                "VIDEO ELEMENT NOT FOUND"
            );

            if (loader) {
                loader.innerText =
                    "VIDEO ELEMENT NOT FOUND";
            }

            return;

        }


        setupVideoEvents(
            video
        );


        try {

            /*
            SHAKA POLYFILL
            */

            shaka.polyfill.installAll();


            /*
            BROWSER SUPPORT
            */

            if (
                !shaka.Player.isBrowserSupported()
            ) {

                console.error(
                    "SHAKA NOT SUPPORTED"
                );

                if (loader) {

                    loader.innerText =
                        "BROWSER NOT SUPPORTED";

                }

                return;

            }


            /*
            VIDEO
            */

            video.muted = true;
            video.autoplay = true;
            video.playsInline = true;


            /*
            CREATE PLAYER
            */

            if (!player) {

                player =
                    new shaka.Player();

                await player.attach(
                    video
                );

            } else {

                await player.unload();

            }


            /*
            DRM
            */

            player.configure({

                drm: {

                    clearKeys: {}

                }

            });


            /*
            CLEAR KEY
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
                    "SHAKA CLEAR KEY:",
                    kid
                );


                player.configure({

                    drm: {

                        clearKeys: {

                            [kid]: key

                        }

                    }

                });

            }


            /*
            URL
            */

            const streamUrl =
                stream.url ||
                stream.mpd;


            if (!streamUrl) {

                console.error(
                    "SHAKA STREAM URL MISSING"
                );

                if (loader) {

                    loader.innerText =
                        "STREAM URL NOT FOUND";

                }

                return;

            }


            /*
            LOAD
            */

            console.log(
                "SHAKA LOADING:",
                streamUrl
            );


            await player.load(
                streamUrl
            );


            console.log(
                "SHAKA LOAD SUCCESS"
            );


            /*
            PLAY
            */

            const played =
                await autoplayVideo(
                    video,
                    "SHAKA"
                );


            /*
            FALLBACK
            */

            if (played) {

                setTimeout(
                    function () {

                        if (
                            video.readyState >= 3 &&
                            !video.paused
                        ) {

                            hideLoader();

                        }

                    },
                    1000
                );

            }


        } catch (error) {

            console.error(
                "SHAKA ERROR:",
                error
            );


            if (loader) {

                loader.innerText =
                    "STREAM ERROR";

            }

        }


        return;

    }


    /*
    ==================================================
    UNKNOWN TYPE
    ==================================================
    */

    console.warn(
        "UNKNOWN STREAM TYPE:",
        stream.type
    );


    if (loader) {

        loader.innerText =
            "UNKNOWN STREAM TYPE";

    }

}


/*
====================================================
CREATE SERVER BUTTON
====================================================
*/

function createServer(
    server,
    index
) {

    const btn =
        document.createElement("button");


    btn.className =
        "server-btn-play";


    btn.innerText =
        server.channelName ||
        "SERVER " +
        (index + 1);


    btn.onclick =
        async function () {

            console.log(
                "SERVER CLICK:",
                index
            );


            document
                .querySelectorAll(
                    ".server-btn-play"
                )
                .forEach(
                    function (button) {

                        button.classList
                            .remove("active");

                    }
                );


            btn.classList.add(
                "active"
            );


            await playStream(
                server
            );

        };


    if (serverList) {

        serverList.appendChild(
            btn
        );

    }


    /*
    FIRST SERVER
    */

    if (index === 0) {

        btn.classList.add(
            "active"
        );


        playStream(
            server
        );

    }

}


/*
====================================================
LOAD MATCH
====================================================
*/

async function loadMatch() {

    console.log(
        "LOAD MATCH START:",
        matchId
    );


    if (!matchId) {

        console.error(
            "NO MATCH ID"
        );


        if (matchName) {

            matchName.innerText =
                "MATCH ID MISSING";

        }


        hideLoader();

        return;

    }


    try {

        const snap =
            await getDoc(
                doc(
                    db,
                    "matches",
                    matchId
                )
            );


        console.log(
            "FIREBASE RESULT:",
            snap.exists()
        );


        if (!snap.exists()) {

            if (matchName) {

                matchName.innerText =
                    "MATCH NOT FOUND";

            }


            if (matchTitle) {

                matchTitle.innerText =
                    "PLEASE TRY AGAIN";

            }


            hideLoader();

            return;

        }


        const data =
            snap.data();


        console.log(
            "MATCH DATA:",
            data
        );


        /*
        TITLE
        */

        if (matchName) {

            matchName.innerText =
                data.matchName ||
                "LIVE MATCH";

        }


        if (matchTitle) {

            matchTitle.innerText =
                data.matchTitle ||
                "SPORTS LIVE";

        }


        /*
        SERVERS
        */

        const servers =
            Array.isArray(data.servers)
                ? data.servers
                : [];


        if (serverList) {

            serverList.innerHTML =
                "";

        }


        if (servers.length === 0) {

            if (serverList) {

                serverList.innerText =
                    "NO STREAM AVAILABLE";

            }

            hideLoader();

            return;

        }


        /*
        CREATE BUTTONS
        */

        servers.forEach(
            function (
                server,
                index
            ) {

                createServer(
                    server,
                    index
                );

            }
        );


    } catch (error) {

        console.error(
            "MATCH LOAD ERROR:",
            error
        );


        if (matchName) {

            matchName.innerText =
                "ERROR LOADING MATCH";

        }


        if (matchTitle) {

            matchTitle.innerText =
                "PLEASE TRY AGAIN";

        }


        if (loader) {

            loader.innerText =
                "ERROR LOADING STREAM";

        }

    }

}


/*
====================================================
PAGE CLOSE / REFRESH
====================================================
*/

window.addEventListener(
    "beforeunload",
    function () {

        console.log(
            "DESTROYING PLAYERS"
        );


        stopHls();


        if (player) {

            try {

                player.destroy();

            } catch (error) {

                console.error(
                    "SHAKA DESTROY ERROR:",
                    error
                );

            }

            player = null;

        }

    }
);


/*
====================================================
START
====================================================
*/

if (matchId) {

    loadMatch();

} else {

    console.error(
        "NO MATCH ID"
    );

    hideLoader();

}
