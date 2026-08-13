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

const params =
    new URLSearchParams(
        window.location.search
    );

const matchId =
    params.get("id");



/*
====================================================
ELEMENTS
====================================================
*/

const matchName =
    document.getElementById(
        "matchName"
    );

const matchTitle =
    document.getElementById(
        "matchTitle"
    );

const serverList =
    document.getElementById(
        "serverList"
    );

const loader =
    document.getElementById(
        "loader"
    );

const shakaBox =
    document.getElementById(
        "shaka-container"
    );

const iosBox =
    document.getElementById(
        "ios-container"
    );

const iframeBox =
    document.getElementById(
        "iframe-container"
    );

const video =
    document.getElementById(
        "videoPlayer"
    );

const iosVideo =
    document.getElementById(
        "ios-video"
    );

const frame =
    document.getElementById(
        "stream-frame"
    );



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

function showLoader() {

    if (loader) {

        loader.style.display =
            "block";

    }

}


function hideLoader() {

    if (loader) {

        loader.style.display =
            "none";

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


    /*
    HLS
    */

    if (hls) {

        try {

            hls.destroy();

        } catch (error) {

            console.log(
                "HLS DESTROY ERROR:",
                error
            );

        }

        hls = null;

    }



    /*
    SHAKA
    */

    if (player) {

        try {

            await player.unload();

        } catch (error) {

            console.log(
                "SHAKA UNLOAD ERROR:",
                error
            );

        }

    }



    /*
    NORMAL VIDEO
    */

    if (video) {

        try {

            video.pause();

            video.removeAttribute(
                "src"
            );

            video.load();

        } catch (error) {

            console.log(
                "VIDEO STOP ERROR:",
                error
            );

        }

    }



    /*
    IOS / HLS VIDEO
    */

    if (iosVideo) {

        try {

            iosVideo.pause();

            iosVideo.removeAttribute(
                "src"
            );

            iosVideo.load();

        } catch (error) {

            console.log(
                "IOS VIDEO STOP ERROR:",
                error
            );

        }

    }



    /*
    IFRAME
    */

    if (frame) {

        frame.src = "";

    }



    /*
    HIDE ALL CONTAINERS
    */

    if (shakaBox) {

        shakaBox.style.display =
            "none";

    }

    if (iosBox) {

        iosBox.style.display =
            "none";

    }

    if (iframeBox) {

        iframeBox.style.display =
            "none";

    }

}



/*
====================================================
AUTOPLAY HELPER
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



    /*
    IMPORTANT:
    Muted autoplay is allowed by
    most modern browsers.
    */

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

async function loadCookiePlayer(
    stream
) {

    console.log(
        "CALLING COOKIE SHAKA:",
        stream
    );


    if (
        typeof window.loadCookieShaka ===
        "function"
    ) {

        await window.loadCookieShaka(
            stream
        );

    } else {

        console.error(
            "cookie-shaka.js MISSING"
        );

        if (loader) {

            loader.innerHTML =
                "COOKIE PLAYER ERROR";

        }

    }

}



/*
====================================================
PLAY STREAM
====================================================
*/

async function playStream(
    stream
) {

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


    currentStream =
        stream;


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

    if (
        stream.type ===
        "iframe"
    ) {

        console.log(
            "LOADING IFRAME"
        );


        if (iframeBox) {

            iframeBox.style.display =
                "block";

        }


        if (frame) {

            frame.src =
                stream.url || "";

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
        stream.type ===
        "cookie"
        ||
        (
            stream.cookie &&
            stream.cookie.trim() !== ""
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


        try {

            await loadCookiePlayer(
                stream
            );

        } catch (error) {

            console.error(
                "COOKIE PLAYER ERROR:",
                error
            );

            if (loader) {

                loader.innerHTML =
                    "STREAM ERROR";

            }

        }


        return;

    }



    /*
    ==================================================
    FANCODE / NORMAL VIDEO
    ==================================================
    */

    if (
        stream.type ===
        "fancode"
    ) {

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

            return;

        }


        iosVideo.muted = true;

        iosVideo.autoplay = true;

        iosVideo.playsInline = true;


        iosVideo.src =
            stream.url || "";


        iosVideo.onplaying =
            hideLoader;


        try {

            await iosVideo.play();

            console.log(
                "FANCODE AUTOPLAY SUCCESS"
            );

        } catch (error) {

            console.warn(
                "FANCODE AUTOPLAY BLOCKED:",
                error
            );

        }


        return;

    }



    /*
    ==================================================
    HLS
    ==================================================
    */

    if (
        stream.type ===
        "hls"
    ) {

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

            return;

        }


        iosVideo.muted = true;

        iosVideo.autoplay = true;

        iosVideo.playsInline = true;


        iosVideo.onplaying =
            hideLoader;



        /*
        HLS.JS
        */

        if (
            window.Hls &&
            Hls.isSupported()
        ) {

            hls =
                new Hls({

                    enableWorker:
                        true,

                    lowLatencyMode:
                        true,

                });


            hls.loadSource(
                stream.url
            );


            hls.attachMedia(
                iosVideo
            );


            hls.on(
                Hls.Events.MANIFEST_PARSED,
                async function () {

                    console.log(
                        "HLS MANIFEST PARSED"
                    );


                    try {

                        await iosVideo.play();

                        console.log(
                            "HLS AUTOPLAY SUCCESS"
                        );

                    } catch (error) {

                        console.warn(
                            "HLS AUTOPLAY BLOCKED:",
                            error
                        );

                    }

                }
            );


            hls.on(
                Hls.Events.ERROR,
                function (
                    event,
                    data
                ) {

                    console.error(
                        "HLS ERROR:",
                        data
                    );

                }
            );

        }



        /*
        NATIVE HLS
        */

        else {

            console.log(
                "USING NATIVE HLS"
            );


            iosVideo.src =
                stream.url;


            try {

                await iosVideo.play();

                console.log(
                    "NATIVE HLS AUTOPLAY SUCCESS"
                );

            } catch (error) {

                console.warn(
                    "NATIVE HLS AUTOPLAY BLOCKED:",
                    error
                );

            }

        }


        return;

    }



    /*
    ==================================================
    NORMAL SHAKA DRM
    ==================================================
    */

    if (
        stream.type ===
        "shaka"
    ) {

        console.log(
            "NORMAL SHAKA STREAM"
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
                !shaka.Player
                    .isBrowserSupported()
            ) {

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
            VIDEO SETTINGS
            */

            if (video) {

                video.muted =
                    true;

                video.autoplay =
                    true;

                video.playsInline =
                    true;

            }



            /*
            CREATE SHAKA PLAYER
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
            DRM DEFAULT
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
                    "SHAKA CLEAR KEY:",
                    kid
                );


                player.configure({

                    drm: {

                        clearKeys: {

                            [kid]:
                                key

                        }

                    }

                });

            }



            /*
            STREAM URL
            */

            const streamUrl =
                stream.url ||
                stream.mpd;


            if (!streamUrl) {

                console.error(
                    "SHAKA STREAM URL MISSING"
                );

                if (loader) {

                    loader.innerHTML =
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
            AUTOPLAY
            */

            if (video) {

                video.onplaying =
                    hideLoader;


                await autoplayVideo(
                    video,
                    "SHAKA"
                );

            }


        } catch (error) {

            console.error(
                "SHAKA ERROR:",
                error
            );


            if (loader) {

                loader.innerHTML =
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

        loader.innerHTML =
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
        document.createElement(
            "button"
        );


    btn.className =
        "server-btn-play";


    btn.innerHTML =
        server.channelName ||
        "SERVER " +
        (index + 1);



    /*
    USER CLICK
    */

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
                            .remove(
                                "active"
                            );

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


        /*
        IMPORTANT:
        This is automatic page-load
        playback, so muted autoplay
        is used.
        */

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

        return;

    }



    try {

        /*
        FIREBASE
        */

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



        /*
        MATCH NOT FOUND
        */

        if (!snap.exists()) {

            if (matchName) {

                matchName.innerText =
                    "MATCH NOT FOUND";

            }

            if (matchTitle) {

                matchTitle.innerText =
                    "PLEASE TRY AGAIN";

            }

            return;

        }



        /*
        MATCH DATA
        */

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
            data.servers ||
            [];


        if (serverList) {

            serverList.innerHTML =
                "";

        }



        /*
        NO SERVERS
        */

        if (
            !servers ||
            servers.length === 0
        ) {

            if (serverList) {

                serverList.innerHTML =
                    "NO STREAM AVAILABLE";

            }

            hideLoader();

            return;

        }



        /*
        CREATE SERVER BUTTONS
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

            loader.innerHTML =
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


        if (hls) {

            try {

                hls.destroy();

            } catch (error) {}

            hls = null;

        }


        if (player) {

            try {

                player.destroy();

            } catch (error) {}

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

}
