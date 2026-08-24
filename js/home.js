import { db } from "../firebase.js";

import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const matchContainer = document.getElementById("matchContainer");

const eventCount = document.getElementById("eventCount");

const heroTitle = document.getElementById("heroTitle");

const heroSubtitle = document.getElementById("heroSubtitle");

const heroWatchButton = document.getElementById("heroWatchButton");

const localTime = document.getElementById("localTime");

let matches = [];

let timerInterval = null;

/* =====================================
   LOCAL TIME
===================================== */

function updateLocalTime() {
  if (!localTime) return;

  const now = new Date();

  localTime.textContent = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

updateLocalTime();

setInterval(updateLocalTime, 1000);

/* =====================================
   ESCAPE HTML
===================================== */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =====================================
   SPORT EMOJI
===================================== */

function getSportEmoji(sport) {
  const value = String(sport || "")
    .toLowerCase()
    .trim();

  if (value.includes("cricket")) {
    return "🏏";
  }

  if (value.includes("football") || value.includes("soccer")) {
    return "⚽";
  }

  if (
    value.includes("racing") ||
    value.includes("race") ||
    value.includes("formula") ||
    value.includes("motorsport") ||
    value.includes("f1") ||
    value.includes("f2") ||
    value.includes("f3")
  ) {
    return "🏎️";
  }

  if (
    value.includes("fighting") ||
    value.includes("fight") ||
    value.includes("boxing") ||
    value.includes("mma") ||
    value.includes("ufc")
  ) {
    return "🥊";
  }

  return "🏆";
}

/* =====================================
   GET MATCH DATE
===================================== */

function getMatchDate(data) {
  const value =
    data.scheduledAt ||
    data.startTime ||
    data.matchTime ||
    data.dateTime ||
    data.scheduledTime;

  if (!value) {
    return null;
  }

  /* Firebase Timestamp */

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  /* Firestore timestamp */

  if (typeof value === "object" && typeof value.seconds === "number") {
    return new Date(value.seconds * 1000);
  }

  /* Number */

  if (typeof value === "number") {
    if (value < 10000000000) {
      return new Date(value * 1000);
    }

    return new Date(value);
  }

  /* Date */

  if (value instanceof Date) {
    return value;
  }

  /* String */

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/* =====================================
   MATCH NAME
===================================== */

function getMatchName(data) {
  return (
    data.matchName ||
    data.match_name ||
    data.eventName ||
    data.event_name ||
    data.name ||
    data.title ||
    data.matchTitle ||
    "Untitled Match"
  );
}

/* =====================================
   LEAGUE NAME
===================================== */

function getLeagueName(data) {
  return (
    data.leagueName ||
    data.league_name ||
    data.league ||
    data.leagueTitle ||
    data.league_title ||
    data.tournamentName ||
    data.tournament_name ||
    data.tournament ||
    data.competitionName ||
    data.competition ||
    data.matchLeague ||
    data.match_league ||
    data.seriesName ||
    data.series ||
    ""
  );
}

/* =====================================
   SPORT
===================================== */

function getSport(data) {
  return (
    data.sport ||
    data.sports ||
    data.sportName ||
    data.category ||
    data.type ||
    ""
  );
}

/* =====================================
   LIVE CHECK
===================================== */

function isLive(data) {
  const status = String(data.status || "")
    .toLowerCase()
    .trim();

  /*
       Admin me status Live hai
    */

  if (status === "live") {
    return true;
  }

  /*
       Scheduled time aa gaya
    */

  const date = getMatchDate(data);

  if (!date) {
    return false;
  }

  return Date.now() >= date.getTime();
}

/* =====================================
   COUNTDOWN
===================================== */

function formatCountdown(date) {
  if (!date) {
    return "SCHEDULED";
  }

  const difference = date.getTime() - Date.now();

  if (difference <= 0) {
    return "STARTING NOW";
  }

  let seconds = Math.floor(difference / 1000);

  const days = Math.floor(seconds / 86400);

  seconds %= 86400;

  const hours = Math.floor(seconds / 3600);

  seconds %= 3600;

  const minutes = Math.floor(seconds / 60);

  seconds %= 60;

  const h = String(hours).padStart(2, "0");

  const m = String(minutes).padStart(2, "0");

  const s = String(seconds).padStart(2, "0");

  if (days > 0) {
    return `${days}D ${h}H ${m}M`;
  }

  return `${h}:${m}:${s}`;
}

/* =====================================
   LIVE CARD
===================================== */

function createLiveCard(item) {
  const data = item.data;

  const id = item.id;

  const matchName = getMatchName(data);

  const leagueName = getLeagueName(data);

  const sport = getSport(data);

  const emoji = getSportEmoji(sport);

  return `

        <div class="match-card">

            <div class="sport-icon">
                ${emoji}
            </div>


            <div class="match-info">

                <div class="match-name">
                    ${escapeHTML(matchName)}
                </div>

                <div class="league-name">
                    ${escapeHTML(leagueName || "SPORTS")}
                </div>

            </div>


            <a
                href="player.html?id=${encodeURIComponent(id)}"
                class="watch-btn">

                ▶ WATCH LIVE

            </a>

        </div>

    `;
}

/* =====================================
   UPCOMING CARD
===================================== */

function createUpcomingCard(item) {
  const data = item.data;

  const matchName = getMatchName(data);

  const leagueName = getLeagueName(data);

  const sport = getSport(data);

  const emoji = getSportEmoji(sport);

  const date = getMatchDate(data);

  const timestamp = date ? date.getTime() : "";

  return `

        <div
            class="match-card"
            data-upcoming="true"
            data-time="${timestamp}">

            <div class="sport-icon">
                ${emoji}
            </div>


            <div class="match-info">

                <div class="match-name">
                    ${escapeHTML(matchName)}
                </div>

                <div class="league-name">
                    ${escapeHTML(leagueName || "SPORTS")}
                </div>

            </div>


            <div class="match-time">

                <div class="time-label">
                    STARTS IN
                </div>

                <div class="countdown">
                    ${date ? formatCountdown(date) : "SCHEDULED"}
                </div>

            </div>

        </div>

    `;
}

/* =====================================
   CARD
===================================== */

function createCard(item) {
  if (isLive(item.data)) {
    return createLiveCard(item);
  }

  return createUpcomingCard(item);
}

/* =====================================
   SORT
===================================== */

function sortMatches(list) {
  return [...list].sort((a, b) => {
    const aLive = isLive(a.data);

    const bLive = isLive(b.data);

    /* Live first */

    if (aLive && !bLive) {
      return -1;
    }

    if (!aLive && bLive) {
      return 1;
    }

    const aDate = getMatchDate(a.data);

    const bDate = getMatchDate(b.data);

    if (!aDate && !bDate) {
      return 0;
    }

    if (!aDate) {
      return 1;
    }

    if (!bDate) {
      return -1;
    }

    return aDate.getTime() - bDate.getTime();
  });
}

/* =====================================
   RENDER
===================================== */

function renderMatches() {
  if (!matches.length) {
    matchContainer.innerHTML = `

            <div class="empty">
                NO EVENTS ARE CURRENTLY SCHEDULED.
            </div>

        `;

    eventCount.textContent = "0 EVENTS";

    return;
  }

  const sorted = sortMatches(matches);

  matchContainer.innerHTML = sorted.map(createCard).join("");

  eventCount.textContent = `${sorted.length} EVENTS`;
}

/* =====================================
   HERO
===================================== */

function updateHero() {
  if (!heroTitle) {
    return;
  }

  const liveMatch = matches.find((item) => isLive(item.data));

  /* LIVE MATCH */

  if (liveMatch) {
    const data = liveMatch.data;

    const matchName = getMatchName(data);

    const leagueName = getLeagueName(data);

    const sport = getSport(data);

    const emoji = getSportEmoji(sport);

    heroTitle.innerHTML = `${emoji} ${escapeHTML(matchName)}`;

    heroSubtitle.textContent = leagueName || "Watch this match live now";

    heroWatchButton.href = `player.html?id=${encodeURIComponent(liveMatch.id)}`;

    heroWatchButton.classList.remove("hidden");

    return;
  }

  /* NO LIVE MATCH */

  heroTitle.textContent = "Watch Live Sports";

  heroSubtitle.textContent = "Cricket, Football, Racing & Fighting";

  heroWatchButton.classList.add("hidden");
}

/* =====================================
   COUNTDOWN UPDATE
===================================== */

function updateCountdowns() {
  let matchBecameLive = false;

  document
    .querySelectorAll(".match-card[data-upcoming='true']")
    .forEach((card) => {
      const timestamp = Number(card.dataset.time);

      if (!timestamp) {
        return;
      }

      const countdown = card.querySelector(".countdown");

      if (!countdown) {
        return;
      }

      if (Date.now() >= timestamp) {
        matchBecameLive = true;

        return;
      }

      countdown.textContent = formatCountdown(new Date(timestamp));
    });

  if (matchBecameLive) {
    renderMatches();

    updateHero();
  }
}

/* =====================================
   LOAD FIREBASE
===================================== */

async function loadMatches() {
  matchContainer.innerHTML = `

        <div class="loading">
            LOADING EVENTS...
        </div>

    `;

  try {
    const snapshot = await getDocs(collection(db, "matches"));

    matches = [];

    snapshot.forEach((doc) => {
      matches.push({
        id: doc.id,

        data: doc.data(),
      });
    });

    console.log("MATCHES:", matches);

    renderMatches();

    updateHero();

    updateCountdowns();

    if (timerInterval) {
      clearInterval(timerInterval);
    }

    timerInterval = setInterval(() => {
      updateCountdowns();

      updateHero();
    }, 1000);
  } catch (error) {
    console.error("FIREBASE ERROR:", error);

    matchContainer.innerHTML = `

            <div class="empty">

                ERROR LOADING EVENTS.

                <br><br>

                <span style="color:#444">
                    ${escapeHTML(error.message)}
                </span>

            </div>

        `;
  }
}

/* =====================================
   START
===================================== */

loadMatches();
