import { db } from "../firebase.js";

import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

console.log("SPORTS ZONE PLAYER JS LOADED");

/* =========================================
   URL
========================================= */

const params = new URLSearchParams(window.location.search);

const matchId = params.get("id");

/* =========================================
   ELEMENT HELPER
========================================= */

function $(id) {
  return document.getElementById(id);
}

/* =========================================
   ELEMENTS
========================================= */

const elements = {
  matchName: $("matchName"),

  matchTitle: $("matchTitle"),

  statusBadge: $("statusBadge"),

  categoryText: $("categoryText"),

  serverList: $("serverList"),

  loader: $("loader"),

  loaderText: $("loaderText"),

  errorBox: $("player-error"),

  errorTitle: $("errorTitle"),

  errorText: $("errorText"),

  retryButton: $("retryButton"),

  refreshButton: $("refreshButton"),

  shakaBox: $("shaka-container"),

  iosBox: $("ios-container"),

  iframeBox: $("iframe-container"),

  video: $("videoPlayer"),

  iosVideo: $("ios-video"),

  frame: $("stream-frame"),
};

/* =========================================
   PLAYER STATE
========================================= */

let shakaPlayer = null;

let hlsPlayer = null;

let currentServer = null;

let currentServers = [];

/* =========================================
   SAFE TEXT
========================================= */

function setText(element, value) {
  if (!element) return;

  element.textContent = value == null ? "" : String(value);
}

/* =========================================
   LOADER
========================================= */

function showLoader(message = "Loading stream...") {
  if (!elements.loader) return;

  setText(elements.loaderText, message);

  elements.loader.style.display = "flex";
}

function hideLoader() {
  if (!elements.loader) return;

  elements.loader.style.display = "none";
}

/* =========================================
   ERROR
========================================= */

function showError(
  title = "Stream unavailable",
  message = "Please try another server.",
) {
  hideLoader();

  if (!elements.errorBox) return;

  setText(elements.errorTitle, title);

  setText(elements.errorText, message);

  elements.errorBox.style.display = "flex";
}

function hideError() {
  if (!elements.errorBox) return;

  elements.errorBox.style.display = "none";
}

/* =========================================
   PLAYER VISIBILITY
========================================= */

function hideAllPlayerBoxes() {
  if (elements.shakaBox) {
    elements.shakaBox.style.display = "none";
  }

  if (elements.iosBox) {
    elements.iosBox.style.display = "none";
  }

  if (elements.iframeBox) {
    elements.iframeBox.style.display = "none";
  }
}

/* =========================================
   HLS STOP
========================================= */

function stopHls() {
  if (!hlsPlayer) return;

  try {
    hlsPlayer.destroy();
  } catch (error) {
    console.warn("HLS DESTROY ERROR:", error);
  }

  hlsPlayer = null;
}

/* =========================================
   SHAKA STOP
========================================= */

async function stopShaka() {
  if (!shakaPlayer) return;

  try {
    await shakaPlayer.unload();
  } catch (error) {
    console.warn("SHAKA UNLOAD ERROR:", error);
  }
}

/* =========================================
   COOKIE SHAKA STOP
========================================= */

async function stopCookie() {
  if (typeof window.stopCookieShaka !== "function") {
    return;
  }

  try {
    await window.stopCookieShaka();
  } catch (error) {
    console.warn("COOKIE PLAYER STOP ERROR:", error);
  }
}

/* =========================================
   VIDEO STOP
========================================= */

function stopVideo(video) {
  if (!video) return;

  try {
    video.pause();

    video.removeAttribute("src");

    video.load();
  } catch (error) {
    console.warn("VIDEO STOP ERROR:", error);
  }
}

/* =========================================
   IFRAME STOP
========================================= */

function stopIframe() {
  if (!elements.frame) return;

  elements.frame.src = "about:blank";
}

/* =========================================
   STOP EVERYTHING
========================================= */

async function stopAllPlayers() {
  stopHls();

  await stopShaka();

  await stopCookie();

  stopVideo(elements.video);

  stopVideo(elements.iosVideo);

  stopIframe();

  hideAllPlayerBoxes();
}

/* =========================================
   VIDEO EVENTS
========================================= */

function setupVideoEvents(video) {
  if (!video) return;

  video.onplaying = function () {
    hideLoader();

    hideError();
  };

  video.onerror = function (event) {
    console.error("VIDEO ERROR:", event);
  };
}

/* =========================================
   AUTOPLAY
========================================= */

async function autoplay(video, name = "VIDEO") {
  if (!video) {
    console.error(name, "VIDEO ELEMENT MISSING");

    return false;
  }

  video.muted = true;

  video.autoplay = true;

  video.playsInline = true;

  try {
    await video.play();

    return true;
  } catch (error) {
    console.warn(name, "AUTOPLAY BLOCKED", error);

    return false;
  }
}

/* =========================================
   IFRAME
========================================= */

async function playIframe(stream) {
  if (!elements.iframeBox) {
    showError("Player unavailable", "Iframe container was not found.");

    return;
  }

  if (!stream.url) {
    showError(
      "Stream URL missing",
      "This server does not contain a valid URL.",
    );

    return;
  }

  elements.iframeBox.style.display = "block";

  elements.frame.src = stream.url;

  hideLoader();
}

/* =========================================
   HLS
========================================= */

async function playHls(stream) {
  if (!elements.iosBox || !elements.iosVideo) {
    showError("Player unavailable", "Video element was not found.");

    return;
  }

  if (!stream.url) {
    showError("Stream URL missing", "HLS URL is missing.");

    return;
  }

  elements.iosBox.style.display = "block";

  const video = elements.iosVideo;

  setupVideoEvents(video);

  video.muted = true;

  video.autoplay = true;

  video.playsInline = true;

  if (window.Hls && window.Hls.isSupported()) {
    hlsPlayer = new window.Hls({
      enableWorker: true,

      lowLatencyMode: true,
    });

    hlsPlayer.on(window.Hls.Events.ERROR, function (event, data) {
      console.error("HLS ERROR:", data);

      if (data && data.fatal) {
        showError("HLS stream error", "Try another server.");
      }
    });

    hlsPlayer.on(window.Hls.Events.MANIFEST_PARSED, async function () {
      await autoplay(video, "HLS");
    });

    hlsPlayer.loadSource(stream.url);

    hlsPlayer.attachMedia(video);

    return;
  }

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = stream.url;

    await autoplay(video, "NATIVE HLS");

    return;
  }

  showError("HLS not supported", "Your browser cannot play this stream.");
}

/* =========================================
   NORMAL VIDEO
========================================= */

async function playNormalVideo(stream) {
  if (!elements.iosBox || !elements.iosVideo) {
    showError("Player unavailable", "Video element was not found.");

    return;
  }

  if (!stream.url) {
    showError("Stream URL missing", "Video URL is missing.");

    return;
  }

  elements.iosBox.style.display = "block";

  const video = elements.iosVideo;

  setupVideoEvents(video);

  video.src = stream.url;

  await autoplay(video, "VIDEO");
}

/* =========================================
   COOKIE SHAKA
========================================= */

async function playCookie(stream) {
  if (typeof window.loadCookieShaka !== "function") {
    showError("Cookie player unavailable", "cookie-shaka.js was not loaded.");

    return;
  }

  if (elements.shakaBox) {
    elements.shakaBox.style.display = "block";
  }

  const result = await window.loadCookieShaka(stream);

  if (!result) {
    showError("Stream unavailable", "Cookie stream could not be loaded.");
  }
}

/* =========================================
   CLEAR KEY
========================================= */

function getClearKey(stream) {
  if (!stream.key) {
    return null;
  }

  const value = String(stream.key).trim();

  if (!value.includes(":")) {
    return null;
  }

  const parts = value.split(":");

  if (parts.length < 2) {
    return null;
  }

  return {
    kid: parts[0].trim().toLowerCase(),

    key: parts.slice(1).join(":").trim().toLowerCase(),
  };
}

/* =========================================
   SHAKA
========================================= */

async function playShaka(stream) {
  if (!elements.video || !elements.shakaBox) {
    showError("Player unavailable", "Shaka video element was not found.");

    return;
  }

  const url = stream.mpd || stream.url;

  if (!url) {
    showError("Stream URL missing", "DASH/MPD URL is missing.");

    return;
  }

  elements.shakaBox.style.display = "block";

  const video = elements.video;

  setupVideoEvents(video);

  video.muted = true;

  video.autoplay = true;

  video.playsInline = true;

  if (typeof shaka === "undefined") {
    showError("Shaka unavailable", "Shaka Player library was not loaded.");

    return;
  }

  shaka.polyfill.installAll();

  if (!shaka.Player.isBrowserSupported()) {
    showError("Browser unsupported", "This browser cannot run Shaka Player.");

    return;
  }

  try {
    if (!shakaPlayer) {
      shakaPlayer = new shaka.Player();

      await shakaPlayer.attach(video);
    } else {
      await shakaPlayer.unload();
    }

    shakaPlayer.configure({
      drm: {
        clearKeys: {},
      },
    });

    const clearKey = getClearKey(stream);

    if (clearKey) {
      shakaPlayer.configure({
        drm: {
          clearKeys: {
            [clearKey.kid]: clearKey.key,
          },
        },
      });
    }

    shakaPlayer.addEventListener("error", function (event) {
      console.error("SHAKA ERROR:", event.detail);
    });

    await shakaPlayer.load(url);

    await autoplay(video, "SHAKA");
  } catch (error) {
    console.error("SHAKA ERROR:", error);

    showError("Stream error", "Shaka could not load this stream.");
  }
}

/* =========================================
   PLAY STREAM
========================================= */

async function playStream(stream) {
  if (!stream) {
    showError("Invalid server", "No stream data was provided.");

    return;
  }

  currentServer = stream;

  hideError();

  showLoader("Loading stream...");

  await stopAllPlayers();

  const type = String(stream.type || "").toLowerCase();

  /* IFRAME */

  if (type === "iframe") {
    await playIframe(stream);

    return;
  }

  /* COOKIE */

  if (type === "cookie" || (stream.cookie && String(stream.cookie).trim())) {
    await playCookie(stream);

    return;
  }

  /* HLS */

  if (type === "hls") {
    await playHls(stream);

    return;
  }

  /* FANCODE / NORMAL */

  if (type === "fancode" || type === "mp4" || type === "video") {
    await playNormalVideo(stream);

    return;
  }

  /* SHAKA */

  if (type === "shaka") {
    await playShaka(stream);

    return;
  }

  /* AUTO MPD */

  if (stream.mpd) {
    await playShaka(stream);

    return;
  }

  /* AUTO HLS */

  if (
    stream.url &&
    (stream.url.includes(".m3u8") || stream.url.includes("m3u8"))
  ) {
    await playHls(stream);

    return;
  }

  showError(
    "Unknown stream type",
    `Unsupported stream type: ${type || "unknown"}`,
  );
}

/* =========================================
   SERVER BUTTON
========================================= */

function createServerButton(server, index) {
  const button = document.createElement("button");

  button.type = "button";

  button.className = "server-btn";

  const name = server.channelName || server.name || `Server ${index + 1}`;

  /*
    =========================================
    IMPORTANT:
    STREAM TYPE DISPLAY NAHI HOGA
    =========================================

    Admin se:
        whatToShow = dash / hls

    wahi watch page par show hoga.
    */

  const watchType = String(server.whatToShow || "dash").toLowerCase();

  const watchLabel = watchType === "hls" ? "HLS" : "DASH";

  button.innerHTML = `

        <div class="server-top">

            <span class="server-name">
                ${escapeHtml(name)}
            </span>


            <span class="server-type">
                ${escapeHtml(watchLabel)}
            </span>

        </div>


        <div class="server-status">

            <span class="server-dot"></span>

            Ready

        </div>

    `;

  button.addEventListener("click", async function () {
    document.querySelectorAll(".server-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    await playStream(server);
  });

  return button;
}

/* =========================================
   ESCAPE HTML
========================================= */

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");
}

/* =========================================
   RENDER SERVERS
========================================= */

function renderServers(servers) {
  if (!elements.serverList) {
    return;
  }

  elements.serverList.innerHTML = "";

  if (!servers.length) {
    elements.serverList.innerHTML = `

            <div class="server-placeholder">
                No stream servers available.
            </div>

        `;

    return;
  }

  servers.forEach(function (server, index) {
    const button = createServerButton(server, index);

    elements.serverList.appendChild(button);

    if (index === 0) {
      button.classList.add("active");
    }
  });
}

/* =========================================
   LOAD MATCH
========================================= */

async function loadMatch() {
  if (!matchId) {
    setText(elements.matchName, "MATCH ID MISSING");

    setText(elements.matchTitle, "Open the watch page with ?id=MATCH_ID");

    showError("Match ID missing", "No match ID was supplied in the URL.");

    return;
  }

  showLoader("Loading match...");

  try {
    const matchRef = doc(db, "matches", matchId);

    const snap = await getDoc(matchRef);

    if (!snap.exists()) {
      setText(elements.matchName, "MATCH NOT FOUND");

      setText(elements.matchTitle, "This match does not exist.");

      showError("Match not found", "The requested match could not be found.");

      return;
    }

    const data = snap.data();

    /* MATCH NAME */

    setText(elements.matchName, data.matchName || "LIVE MATCH");

    /* TITLE */

    setText(elements.matchTitle, data.matchTitle || "SPORTS LIVE");

    /* STATUS */

    const status = data.status || "Live";

    setText(elements.statusBadge, String(status).toUpperCase());

    if (String(status).toLowerCase() !== "live") {
      elements.statusBadge?.classList.add("offline");
    }

    /* CATEGORY */

    setText(elements.categoryText, data.category || data.sport || "SPORTS");

    /* SERVERS */

    const servers = Array.isArray(data.servers) ? data.servers : [];

    currentServers = servers;

    renderServers(servers);

    if (!servers.length) {
      showError(
        "No streams available",
        "There are currently no servers for this match.",
      );

      return;
    }

    hideError();

    /* FIRST SERVER */

    const firstServer = servers[0];

    if (firstServer) {
      await playStream(firstServer);
    }
  } catch (error) {
    console.error("MATCH LOAD ERROR:", error);

    setText(elements.matchName, "ERROR LOADING MATCH");

    setText(elements.matchTitle, "Please try again.");

    showError(
      "Unable to load match",
      error?.message || "Firebase request failed.",
    );
  }
}

/* =========================================
   RETRY
========================================= */

if (elements.retryButton) {
  elements.retryButton.addEventListener("click", async function () {
    hideError();

    if (currentServer) {
      await playStream(currentServer);
    } else {
      await loadMatch();
    }
  });
}

/* =========================================
   REFRESH
========================================= */

if (elements.refreshButton) {
  elements.refreshButton.addEventListener("click", async function () {
    elements.refreshButton.disabled = true;

    elements.refreshButton.textContent = "↻ Loading...";

    try {
      await loadMatch();
    } finally {
      elements.refreshButton.disabled = false;

      elements.refreshButton.textContent = "↻ Refresh";
    }
  });
}

/* =========================================
   CLEANUP
========================================= */

window.addEventListener("beforeunload", function () {
  stopHls();

  stopShaka();

  stopCookie();
});

/* =========================================
   START
========================================= */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadMatch);
} else {
  loadMatch();
}
