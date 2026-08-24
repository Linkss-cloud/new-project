import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

/* ==================================================
   ELEMENTS
================================================== */

const loginScreen = document.getElementById("loginScreen");

const dashboardScreen = document.getElementById("dashboardScreen");

const loginForm = document.getElementById("loginForm");

const loginError = document.getElementById("loginError");

const logoutBtn = document.getElementById("logoutBtn");

const matchForm = document.getElementById("matchForm");

const serverContainer = document.getElementById("serverFieldsContainer");

const addServerBtn = document.getElementById("addServerBtn");

const matchList = document.getElementById("matchList");

const formTitle = document.getElementById("formTitle");

const cancelEditBtn = document.getElementById("cancelEditBtn");

const matchStatus = document.getElementById("matchStatus");

const scheduleGroup = document.getElementById("scheduleGroup");

const scheduledAt = document.getElementById("scheduledAt");

let serverCount = 0;

let editId = null;

let matchesData = {};

/* ==================================================
   AUTH
================================================== */

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginScreen.style.display = "none";

    dashboardScreen.style.display = "block";

    loadMatches();
  } else {
    loginScreen.style.display = "flex";

    dashboardScreen.style.display = "none";
  }
});

/* ==================================================
   LOGIN
================================================== */

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  loginError.textContent = "";

  const email = document.getElementById("adminEmail").value.trim();

  const password = document.getElementById("adminPassword").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    loginError.textContent = "INVALID LOGIN";
  }
});

/* ==================================================
   LOGOUT
================================================== */

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("LOGOUT ERROR:", error);
  }
});

/* ==================================================
   STATUS / SCHEDULE
================================================== */

function updateScheduleVisibility() {
  if (matchStatus.value === "Upcoming") {
    scheduleGroup.style.display = "flex";

    scheduledAt.required = true;
  } else {
    scheduleGroup.style.display = "none";

    scheduledAt.required = false;
  }
}

matchStatus.addEventListener("change", updateScheduleVisibility);

/* ==================================================
   ADD SERVER
================================================== */

addServerBtn.addEventListener("click", () => {
  addServerField();
});

/* ==================================================
   ADD SERVER FIELD
================================================== */

window.addServerField = function (
  name = "",

  type = "shaka",

  url = "",

  key = "",

  cookie = "",

  whatToShow = "dash",
) {
  serverCount++;

  const id = "server_" + serverCount;

  const div = document.createElement("div");

  div.className = "server-block";

  div.id = id;

  div.innerHTML = `

        <button
            type="button"
            class="btn-delete-server"
            onclick="removeServerField('${id}')"
        >
            REMOVE
        </button>


        <!-- SERVER NAME -->

        <div class="input-group">

            <label>
                CHANNEL NAME
            </label>

            <input
                class="srv-name"
                value="${escapeAttribute(name)}"
                placeholder="Star Sports HD"
                required
            >

        </div>


        <!-- STREAM TYPE -->

        <div class="input-group">

            <label>
                STREAM TYPE
            </label>

            <select class="srv-type">

                <option
                    value="shaka"
                    ${type === "shaka" ? "selected" : ""}
                >
                    SHAKA / DASH DRM
                </option>


                <option
                    value="cookie"
                    ${type === "cookie" ? "selected" : ""}
                >
                    COOKIE SHAKA / DASH
                </option>


                <option
                    value="hls"
                    ${type === "hls" ? "selected" : ""}
                >
                    HLS / M3U8
                </option>


                <option
                    value="fancode"
                    ${type === "fancode" ? "selected" : ""}
                >
                    FANCODE
                </option>


                <option
                    value="iframe"
                    ${type === "iframe" ? "selected" : ""}
                >
                    IFRAME
                </option>

            </select>

        </div>


        <!-- WHAT TO SHOW -->

        <div class="input-group">

            <label>
                WHAT TO SHOW ON WATCH PAGE
            </label>

            <select class="srv-watch-type">

                <option
                    value="dash"
                    ${whatToShow === "dash" ? "selected" : ""}
                >
                    DASH
                </option>


                <option
                    value="hls"
                    ${whatToShow === "hls" ? "selected" : ""}
                >
                    HLS
                </option>

            </select>

            <small class="field-help">
                Watch page par channel name ke saath ye value show hogi.
            </small>

        </div>


        <!-- STREAM URL -->

        <div class="input-group">

            <label>
                STREAM URL
            </label>

            <input
                class="srv-url"
                value="${escapeAttribute(url)}"
                placeholder="MPD / M3U8 / IFRAME URL"
                oninput="detectStreamType(this)"
                required
            >

        </div>


        <!-- DRM KEY -->

        <div class="input-group">

            <label>
                DRM KEY
                <span class="optional">
                    OPTIONAL
                </span>
            </label>

            <input
                class="srv-key"
                value="${escapeAttribute(key)}"
                placeholder="kid:key"
            >

        </div>


        <!-- COOKIE -->

        <div class="input-group">

            <label>
                COOKIE / TOKEN
                <span class="optional">
                    OPTIONAL
                </span>
            </label>

            <input
                class="srv-cookie"
                value="${escapeAttribute(cookie)}"
                placeholder="Optional"
            >

        </div>

    `;

  serverContainer.appendChild(div);
};

/* ==================================================
   REMOVE SERVER
================================================== */

window.removeServerField = function (id) {
  const element = document.getElementById(id);

  if (element) {
    element.remove();
  }
};

/* ==================================================
   DETECT STREAM TYPE
================================================== */

window.detectStreamType = function (input) {
  const block = input.closest(".server-block");

  if (!block) return;

  const type = block.querySelector(".srv-type");

  const url = input.value.trim().toLowerCase();

  if (url.includes(".m3u8")) {
    type.value = "hls";

    return;
  }

  if (url.includes(".mpd")) {
    type.value = "shaka";

    return;
  }

  if (url.includes("fancode") || url.includes("cloudfront.net")) {
    type.value = "fancode";
  }
};

/* ==================================================
   ESCAPE ATTRIBUTE
================================================== */

function escapeAttribute(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")

    .replace(/"/g, "&quot;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;");
}

/* ==================================================
   GET SERVERS
================================================== */

function getServers() {
  const servers = [];

  document.querySelectorAll(".server-block").forEach((block) => {
    const name = block.querySelector(".srv-name").value.trim();

    const type = block.querySelector(".srv-type").value;

    const watchType = block.querySelector(".srv-watch-type").value;

    const url = block.querySelector(".srv-url").value.trim();

    const key = block.querySelector(".srv-key").value.trim();

    const cookie = block.querySelector(".srv-cookie").value.trim();

    servers.push({
      channelName: name,

      /*
                    Actual player type
                    */

      type: type,

      /*
                    Watch page display value
                    */

      whatToShow: watchType,

      url: url,

      mpd: url,

      key: key,

      cookie: cookie,
    });
  });

  return servers;
}

/* ==================================================
   CREATE / UPDATE MATCH
================================================== */

matchForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const status = matchStatus.value;

    let scheduledTime = null;

    if (status === "Upcoming") {
      if (!scheduledAt.value) {
        alert("Please select match start date & time.");

        return;
      }

      scheduledTime = new Date(scheduledAt.value).toISOString();
    }

    const payload = {
      matchName: document.getElementById("matchName").value.trim(),

      leagueName: document.getElementById("leagueName").value.trim(),

      posterUrl: document.getElementById("posterUrl").value.trim(),

      sport: document.getElementById("sport").value,

      status: status,

      scheduledAt: scheduledTime,

      servers: getServers(),

      updatedAt: new Date().toISOString(),
    };

    if (editId) {
      await updateDoc(doc(db, "matches", editId), payload);
    } else {
      await addDoc(collection(db, "matches"), payload);
    }

    alert(editId ? "MATCH UPDATED" : "MATCH PUBLISHED");

    resetForm();

    await loadMatches();
  } catch (error) {
    console.error("SAVE MATCH ERROR:", error);

    alert("ERROR SAVING MATCH. CHECK CONSOLE.");
  }
});

/* ==================================================
   LOAD MATCHES
================================================== */

async function loadMatches() {
  matchList.innerHTML = "<p class='loading-text'>Loading...</p>";

  try {
    const snap = await getDocs(collection(db, "matches"));

    matchesData = {};

    let html = "";

    snap.forEach((item) => {
      const data = item.data();

      matchesData[item.id] = data;

      const status = String(data.status || "Upcoming").toLowerCase();

      const isLive = status === "live";

      let dateText = "";

      if (data.scheduledAt) {
        const date = new Date(data.scheduledAt);

        if (!Number.isNaN(date.getTime())) {
          dateText = date.toLocaleString(undefined, {
            dateStyle: "medium",

            timeStyle: "short",
          });
        }
      }

      html += `

                    <div class="match-item">

                        ${
                          data.posterUrl
                            ? `
                                    <img
                                        src="${escapeAttribute(data.posterUrl)}"
                                        alt=""
                                        onerror="this.style.display='none'"
                                    >
                                `
                            : `
                                    <div class="no-poster">
                                        NO POSTER
                                    </div>
                                `
                        }


                        <div class="match-item-content">


                            <div class="admin-match-status
                                ${isLive ? "live" : "upcoming"}">

                                ${isLive ? "🔴 LIVE" : "🕐 UPCOMING"}

                            </div>


                            <h3>
                                ${escapeHTML(data.matchName)}
                            </h3>


                            ${
                              data.leagueName
                                ? `
                                        <p class="admin-league">
                                            ${escapeHTML(data.leagueName)}
                                        </p>
                                    `
                                : ""
                            }


                            ${
                              data.sport
                                ? `
                                        <span class="sport-label">
                                            ${escapeHTML(data.sport)}
                                        </span>
                                    `
                                : ""
                            }


                            ${
                              Array.isArray(data.servers)
                                ? `
                                        <span class="player-label">
                                            SERVERS:
                                            ${data.servers.length}
                                        </span>
                                    `
                                : ""
                            }


                            ${
                              !isLive && dateText
                                ? `
                                        <p class="admin-time">
                                            STARTS:
                                            ${escapeHTML(dateText)}
                                        </p>
                                    `
                                : ""
                            }


                            <div class="admin-actions">

                                <button
                                    onclick="editMatch('${item.id}')"
                                    class="edit-btn"
                                >
                                    EDIT
                                </button>


                                <button
                                    onclick="deleteMatch('${item.id}')"
                                    class="delete-btn"
                                >
                                    DELETE
                                </button>

                            </div>


                        </div>

                    </div>

                `;
    });

    if (!html) {
      html = `
                <div class="empty-list">
                    NO MATCHES FOUND
                </div>
            `;
    }

    matchList.innerHTML = html;
  } catch (error) {
    console.error("LOAD MATCH ERROR:", error);

    matchList.innerHTML = `
            <div class="empty-list">
                ERROR LOADING MATCHES
            </div>
        `;
  }
}

/* ==================================================
   EDIT MATCH
================================================== */

window.editMatch = function (id) {
  const data = matchesData[id];

  if (!data) return;

  editId = id;

  formTitle.textContent = "EDIT MATCH";

  cancelEditBtn.style.display = "block";

  document.getElementById("matchName").value = data.matchName || "";

  document.getElementById("leagueName").value = data.leagueName || "";

  document.getElementById("posterUrl").value = data.posterUrl || "";

  document.getElementById("sport").value = data.sport || "cricket";

  document.getElementById("matchStatus").value = data.status || "Upcoming";

  if (data.scheduledAt) {
    const date = new Date(data.scheduledAt);

    if (!Number.isNaN(date.getTime())) {
      scheduledAt.value = toDateTimeLocal(date);
    }
  } else {
    scheduledAt.value = "";
  }

  updateScheduleVisibility();

  serverContainer.innerHTML = "";

  if (Array.isArray(data.servers) && data.servers.length) {
    data.servers.forEach((server) => {
      addServerField(
        server.channelName || "",

        server.type || "shaka",

        server.url || server.mpd || "",

        server.key || "",

        server.cookie || "",

        /*
                    New field.
                    Old records => DASH
                    */

        server.whatToShow || "dash",
      );
    });
  } else {
    addServerField();
  }

  window.scrollTo({
    top: 0,

    behavior: "smooth",
  });
};

/* ==================================================
   DATE LOCAL
================================================== */

function toDateTimeLocal(date) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  const hours = String(date.getHours()).padStart(2, "0");

  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/* ==================================================
   CANCEL
================================================== */

cancelEditBtn.addEventListener("click", () => {
  resetForm();
});

/* ==================================================
   RESET
================================================== */

function resetForm() {
  editId = null;

  formTitle.textContent = "CREATE MATCH";

  cancelEditBtn.style.display = "none";

  matchForm.reset();

  matchStatus.value = "Live";

  scheduledAt.value = "";

  serverContainer.innerHTML = "";

  addServerField();

  updateScheduleVisibility();
}

/* ==================================================
   DELETE
================================================== */

window.deleteMatch = async function (id) {
  if (!confirm("Delete this match?")) {
    return;
  }

  try {
    await deleteDoc(doc(db, "matches", id));

    await loadMatches();
  } catch (error) {
    console.error("DELETE ERROR:", error);

    alert("ERROR DELETING MATCH");
  }
};

/* ==================================================
   ESCAPE HTML
================================================== */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");
}

/* ==================================================
   START
================================================== */

addServerField();

updateScheduleVisibility();
