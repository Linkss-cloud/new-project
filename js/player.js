import { db } from "../firebase.js";

import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

console.log("PLAYER JS LOADED");

const params = new URLSearchParams(window.location.search);

const matchId = params.get("id");

const matchName = document.getElementById("matchName");

const matchTitle = document.getElementById("matchTitle");

const serverList = document.getElementById("serverList");

const loader = document.getElementById("loader");

const shakaBox = document.getElementById("shaka-container");

const iosBox = document.getElementById("ios-container");

const iframeBox = document.getElementById("iframe-container");

const video = document.getElementById("videoPlayer");

const iosVideo = document.getElementById("ios-video");

const frame = document.getElementById("stream-frame");

let player = null;

let hls = null;

function showLoader() {
  if (loader) loader.style.display = "block";
}

function hideLoader() {
  if (loader) loader.style.display = "none";
}

function stopAll() {
  if (hls) {
    hls.destroy();

    hls = null;
  }

  if (player) {
    player.unload().catch(() => {});
  }

  if (video) {
    video.pause();
  }

  if (iosVideo) {
    iosVideo.pause();

    iosVideo.removeAttribute("src");

    iosVideo.load();
  }

  if (frame) {
    frame.src = "";
  }

  if (shakaBox) shakaBox.style.display = "none";

  if (iosBox) iosBox.style.display = "none";

  if (iframeBox) iframeBox.style.display = "none";
}

async function loadCookiePlayer(stream) {
  console.log("CALLING COOKIE SHAKA", stream);

  if (typeof window.loadCookieShaka === "function") {
    await window.loadCookieShaka(stream);
  } else {
    console.error("cookie-shaka.js missing");
  }
}

async function playStream(stream) {
  console.log("PLAY STREAM", stream);

  showLoader();

  stopAll();

  // IFRAME

  if (stream.type === "iframe") {
    if (iframeBox) iframeBox.style.display = "block";

    if (frame) frame.src = stream.url;

    hideLoader();

    return;
  }

  // COOKIE SHAKA

  if (
    stream.type === "cookie" ||
    (stream.cookie && stream.cookie.trim() !== "")
  ) {
    console.log("COOKIE SHAKA STREAM:", stream);

    if (shakaBox) shakaBox.style.display = "block";

    await loadCookiePlayer(stream);

    return;
  }
  // FANCODE / NORMAL VIDEO

  if (stream.type === "fancode") {
    if (iosBox) iosBox.style.display = "block";

    iosVideo.src = stream.url;

    iosVideo.play().catch(() => {});

    iosVideo.onplaying = hideLoader;

    return;
  }

  // HLS

  if (stream.type === "hls") {
    if (iosBox) iosBox.style.display = "block";

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,

        lowLatencyMode: true,
      });

      hls.loadSource(stream.url);

      hls.attachMedia(iosVideo);

      hls.on(
        Hls.Events.MANIFEST_PARSED,

        () => {
          iosVideo.play().catch(() => {});
        },
      );

      hls.on(
        Hls.Events.ERROR,

        (event, data) => {
          console.log("HLS ERROR", data);
        },
      );
    } else {
      iosVideo.src = stream.url;

      iosVideo.play().catch(() => {});
    }

    iosVideo.onplaying = hideLoader;

    return;
  }

  // NORMAL SHAKA DRM

  if (stream.type === "shaka") {
    try {
      shaka.polyfill.installAll();

      if (!player) {
        player = new shaka.Player();

        await player.attach(video);
      } else {
        await player.unload();
      }

      player.configure({
        drm: {
          clearKeys: {},
        },
      });

      if (stream.key && stream.key.includes(":")) {
        const parts = stream.key.split(":");

        const kid = parts[0].trim().toLowerCase();

        const key = parts[1].trim().toLowerCase();

        player.configure({
          drm: {
            clearKeys: {
              [kid]: key,
            },
          },
        });
      }

      await player.load(stream.url || stream.mpd);

      video.play().catch(() => {});

      video.onplaying = hideLoader;
    } catch (error) {
      console.error("SHAKA ERROR", error);

      if (loader) loader.innerHTML = "STREAM ERROR";
    }
  }
}

function createServer(server, index) {
  const btn = document.createElement("button");

  btn.className = "server-btn-play";

  btn.innerHTML = server.channelName || "SERVER " + (index + 1);

  btn.onclick = () => {
    document.querySelectorAll(".server-btn-play").forEach((b) => {
      b.classList.remove("active");
    });

    btn.classList.add("active");

    playStream(server);
  };

  serverList.appendChild(btn);

  if (index === 0) {
    btn.classList.add("active");

    playStream(server);
  }
}

async function loadMatch() {
  console.log("LOAD MATCH START", matchId);

  try {
    const snap = await getDoc(doc(db, "matches", matchId));

    console.log("FIREBASE RESULT", snap.exists());

    if (!snap.exists()) {
      matchName.innerText = "MATCH NOT FOUND";

      return;
    }

    const data = snap.data();

    console.log("MATCH DATA", data);

    matchName.innerText = data.matchName || "LIVE MATCH";

    matchTitle.innerText = data.matchTitle || "SPORTS LIVE";

    const servers = data.servers || [];

    serverList.innerHTML = "";

    if (servers.length === 0) {
      serverList.innerHTML = "NO STREAM AVAILABLE";

      return;
    }

    servers.forEach((server, index) => {
      createServer(server, index);
    });
  } catch (error) {
    console.error("MATCH LOAD ERROR", error);

    if (matchName) matchName.innerText = "ERROR LOADING MATCH";
  }
}

window.addEventListener(
  "beforeunload",

  () => {
    if (hls) {
      hls.destroy();
    }

    if (player) {
      player.destroy();
    }
  },
);

if (matchId) {
  loadMatch();
} else {
  console.error("NO MATCH ID");
}
