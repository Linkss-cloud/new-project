import { db } from "../firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ======================================================
// DOM ELEMENTS
// ======================================================

const matchesBox =
  document.getElementById("matches");

const upcomingBox =
  document.getElementById("upcoming");

const favoritesBox =
  document.getElementById("favorites");

const favoritesSection =
  document.getElementById("favorites-section");

const search =
  document.getElementById("search");


// ======================================================
// GLOBAL DATA
// ======================================================

let matches = [];

let favorites =
  JSON.parse(
    localStorage.getItem("favorites")
  ) || [];


// ======================================================
// LOAD MATCHES
// ======================================================

async function loadMatches() {

  try {

    const snapshot =
      await getDocs(
        collection(db, "matches")
      );


    matches = [];


    snapshot.forEach(docSnap => {

      const data =
        docSnap.data();


      let servers =
        data.servers || [];


      // If servers is a single string
      if (typeof servers === "string") {

        servers = [servers];

      }


      matches.push({

        id:
          docSnap.id,

        title:
          data.matchName ||
          "Unknown Match",

        league:
          data.matchTitle ||
          "",

        thumbnail:
          data.posterUrl ||
          "",

        status:
          data.status === "Live"
            ? "LIVE"
            : "UPCOMING",

        servers:
          servers

      });

    });


    console.log(
      "Matches:",
      matches
    );


    render();

  }

  catch (error) {

    console.error(
      "Firestore error:",
      error
    );


    matchesBox.innerHTML = `

      <div class="no-live">

        Database connection error

      </div>

    `;

  }

}


// ======================================================
// GET STREAM URL
// ======================================================

function getStreamUrl(match) {

  if (!match) {
    return "";
  }


  const servers =
    match.servers;


  if (!servers) {
    return "";
  }


  // ----------------------------------------------------
  // STRING
  // ----------------------------------------------------

  if (typeof servers === "string") {

    return servers;

  }


  // ----------------------------------------------------
  // ARRAY
  // ----------------------------------------------------

  if (Array.isArray(servers)) {

    for (const server of servers) {


      // Example:
      // ["https://example.com/live.m3u8"]

      if (typeof server === "string") {

        if (
          server.startsWith("http://") ||
          server.startsWith("https://")
        ) {

          return server;

        }

      }


      // Example:
      // [{url:"https://example.com/live.m3u8"}]

      if (
        server &&
        typeof server === "object"
      ) {

        const url =
          server.url ||
          server.streamUrl ||
          server.stream ||
          server.link ||
          server.hlsUrl ||
          server.fancode ||
          "";


        if (
          typeof url === "string" &&
          (
            url.startsWith("http://") ||
            url.startsWith("https://")
          )
        ) {

          return url;

        }

      }

    }

  }


  // ----------------------------------------------------
  // OBJECT
  // ----------------------------------------------------

  if (
    typeof servers === "object" &&
    !Array.isArray(servers)
  ) {

    return (
      servers.url ||
      servers.streamUrl ||
      servers.stream ||
      servers.link ||
      servers.hlsUrl ||
      servers.fancode ||
      ""
    );

  }


  return "";

}


// ======================================================
// CREATE CARD
// ======================================================

function createCard(match) {

  const card =
    document.createElement("div");


  card.className =
    "match-card";


  const isFavorite =
    favorites.includes(
      match.id
    );


  card.innerHTML = `

    <div class="card-thumb">

      <img
        src="${escapeHtml(match.thumbnail)}"
        loading="lazy"
        alt="${escapeHtml(match.title)}"
      >

      <div class="status-badge">

        ${
          match.status === "LIVE"
            ? "🔴 LIVE"
            : "⏰ UPCOMING"
        }

      </div>

    </div>


    <div class="card-details">

      <div class="card-info">

        <h3>
          ${escapeHtml(match.title)}
        </h3>

        <p>
          ${escapeHtml(match.league)}
        </p>

      </div>


      <button
        class="favorite-btn"
        type="button"
        aria-label="Favorite"
      >

        ${
          isFavorite
            ? "★"
            : "☆"
        }

      </button>

    </div>


    <div class="card-actions">

      <a
        href="watch.html?id=${encodeURIComponent(match.id)}"
        class="btn-play"
      >

        ▶ WATCH NOW

      </a>

    </div>

  `;


  // ====================================================
  // FAVORITE BUTTON
  // ====================================================

  const favoriteButton =
    card.querySelector(
      ".favorite-btn"
    );


  favoriteButton.onclick = () => {

    toggleFavorite(
      match.id
    );

    render();

  };


  return card;

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHtml(value) {

  if (!value) {
    return "";
  }


  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// ======================================================
// RENDER
// ======================================================

function render(list = matches) {

  matchesBox.innerHTML = "";

  upcomingBox.innerHTML = "";

  favoritesBox.innerHTML = "";


  // ----------------------------------------------------
  // LIVE
  // ----------------------------------------------------

  const live =
    list.filter(
      match =>
        match.status === "LIVE"
    );


  // ----------------------------------------------------
  // UPCOMING
  // ----------------------------------------------------

  const upcoming =
    list.filter(
      match =>
        match.status === "UPCOMING"
    );


  // ----------------------------------------------------
  // LIVE MATCHES
  // ----------------------------------------------------

  if (live.length > 0) {

    live.forEach(match => {

      matchesBox.appendChild(
        createCard(match)
      );

    });

  }

  else {

    matchesBox.innerHTML = `

      <div class="no-live">

        🔴 No live matches available

      </div>

    `;

  }


  // ----------------------------------------------------
  // UPCOMING MATCHES
  // ----------------------------------------------------

  if (upcoming.length > 0) {

    upcoming.forEach(match => {

      upcomingBox.appendChild(
        createCard(match)
      );

    });

  }

  else {

    upcomingBox.innerHTML = `

      <div class="no-live">

        ⏰ No upcoming matches

      </div>

    `;

  }


  // ----------------------------------------------------
  // FAVORITES
  // ----------------------------------------------------

  const favoriteMatches =
    matches.filter(
      match =>
        favorites.includes(
          match.id
        )
    );


  if (favoriteMatches.length > 0) {

    favoritesSection
      .classList
      .remove("hidden");


    favoriteMatches.forEach(match => {

      favoritesBox.appendChild(
        createCard(match)
      );

    });

  }

  else {

    favoritesSection
      .classList
      .add("hidden");

  }

}


// ======================================================
// FAVORITES
// ======================================================

function toggleFavorite(id) {

  if (
    favorites.includes(id)
  ) {

    favorites =
      favorites.filter(
        item =>
          item !== id
      );

  }

  else {

    favorites.push(id);

  }


  localStorage.setItem(
    "favorites",
    JSON.stringify(favorites)
  );

}


// ======================================================
// SEARCH
// ======================================================

if (search) {

  search.addEventListener(
    "input",
    () => {

      const value =
        search.value
          .toLowerCase()
          .trim();


      if (!value) {

        render();

        return;

      }


      const filtered =
        matches.filter(match => {

          const title =
            match.title
              .toLowerCase();

          const league =
            match.league
              .toLowerCase();


          return (
            title.includes(value) ||
            league.includes(value)
          );

        });


      render(filtered);

    }
  );

}


// ======================================================
// START
// ======================================================

loadMatches();
