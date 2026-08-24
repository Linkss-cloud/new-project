console.log("COOKIE SHAKA JS LOADED");

let cookiePlayer = null;

/* =========================================
   HELPERS
========================================= */

function get(id) {
  return document.getElementById(id);
}

function cookieLoader(message) {
  const loader = get("loader");

  const text = get("loaderText");

  if (text) {
    text.textContent = message;
  }

  if (loader) {
    loader.style.display = "flex";
  }
}

function hideCookieLoader() {
  const loader = get("loader");

  if (loader) {
    loader.style.display = "none";
  }
}

/* =========================================
   STOP
========================================= */

window.stopCookieShaka = async function () {
  if (!cookiePlayer) {
    return;
  }

  try {
    await cookiePlayer.unload();
  } catch (error) {
    console.warn("COOKIE SHAKA UNLOAD:", error);
  }
};

/* =========================================
   LOAD
========================================= */

window.loadCookieShaka = async function (stream) {
  console.log("COOKIE STREAM:", stream);

  const video = get("videoPlayer");

  const box = get("shaka-container");

  if (!video) {
    console.error("videoPlayer missing");

    return false;
  }

  if (!box) {
    console.error("shaka-container missing");

    return false;
  }

  const url = stream.mpd || stream.url;

  if (!url) {
    cookieLoader("STREAM URL MISSING");

    return false;
  }

  try {
    box.style.display = "block";

    cookieLoader("Loading stream...");

    video.muted = true;

    video.autoplay = true;

    video.playsInline = true;

    /* =================================
               SHAKA
            ================================= */

    if (typeof shaka === "undefined") {
      cookieLoader("SHAKA NOT LOADED");

      return false;
    }

    shaka.polyfill.installAll();

    if (!shaka.Player.isBrowserSupported()) {
      cookieLoader("BROWSER NOT SUPPORTED");

      return false;
    }

    /* =================================
               PLAYER
            ================================= */

    if (!cookiePlayer) {
      cookiePlayer = new shaka.Player();

      await cookiePlayer.attach(video);
    } else {
      await cookiePlayer.unload();
    }

    /* =================================
               ERROR
            ================================= */

    cookiePlayer.addEventListener("error", function (event) {
      console.error("COOKIE SHAKA ERROR:", event.detail);
    });

    /* =================================
               DRM
            ================================= */

    cookiePlayer.configure({
      drm: {
        clearKeys: {},
      },
    });

    /* =================================
               CLEAR KEY
            ================================= */

    if (stream.key && String(stream.key).includes(":")) {
      const parts = String(stream.key).split(":");

      const kid = parts[0].trim().toLowerCase();

      const key = parts.slice(1).join(":").trim().toLowerCase();

      cookiePlayer.configure({
        drm: {
          clearKeys: {
            [kid]: key,
          },
        },
      });
    }

    /* =================================
               AUTH/TOKEN
            ================================= */

    const token = stream.cookie ? String(stream.cookie).trim() : "";

    if (token) {
      const networkingEngine = cookiePlayer.getNetworkingEngine();

      if (networkingEngine) {
        networkingEngine.clearAllRequestFilters();

        networkingEngine.registerRequestFilter(function (type, request) {
          if (!request || !request.uris || !request.uris.length) {
            return;
          }

          const original = request.uris[0];

          /*
           * Only append the supplied
           * authorized token.
           */

          if (!original.includes("__hdnea__")) {
            const separator = original.includes("?") ? "&" : "?";

            request.uris[0] = original + separator + token;
          }
        });
      }
    }

    /* =================================
               LOAD
            ================================= */

    console.log("COOKIE SHAKA LOAD:", url);

    await cookiePlayer.load(url);

    console.log("COOKIE SHAKA SUCCESS");

    /* =================================
               PLAY
            ================================= */

    try {
      await video.play();

      hideCookieLoader();
    } catch (error) {
      console.warn("COOKIE AUTOPLAY BLOCKED:", error);
    }

    video.onplaying = function () {
      hideCookieLoader();
    };

    setTimeout(function () {
      if (video.readyState >= 3 && !video.paused) {
        hideCookieLoader();
      }
    }, 1500);

    return true;
  } catch (error) {
    console.error("COOKIE SHAKA ERROR:", error);

    cookieLoader("STREAM ERROR");

    return false;
  }
};
