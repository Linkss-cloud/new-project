import { db } from "../firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const matchContainer = document.getElementById("matchContainer");

async function loadMatches() {
    matchContainer.innerHTML = `
        <p style="color: var(--text-muted); font-weight: 700; text-align: center; grid-column: 1 / -1; letter-spacing: 1px;">
            LOADING LIVE EVENTS...
        </p>
    `;

    try {
        const querySnapshot = await getDocs(collection(db, "matches"));

        if (querySnapshot.empty) {
            matchContainer.innerHTML = `
                <p style="color: var(--text-muted); font-weight: 700; text-align: center; grid-column: 1 / -1; letter-spacing: 1px;">
                    NO EVENTS ARE CURRENTLY SCHEDULED.
                </p>
            `;
            return;
        }

        let html = "";

        const liveDot = `<div style="width: 8px; height: 8px; background-color: #EF4444; border-radius: 50%;"></div>`;
        const upcomingDot = `<div style="width: 8px; height: 8px; background-color: #F59E0B; border-radius: 50%;"></div>`;
        const serverIcon = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                <line x1="6" y1="6" x2="6.01" y2="6"></line>
                <line x1="6" y1="18" x2="6.01" y2="18"></line>
            </svg>
        `;
        const playIcon = `
            <svg viewBox="0 0 24 24">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
        `;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const matchId = doc.id;
            const imgUrl = data.posterUrl || "https://via.placeholder.com/800x450/1E293B/94A3B8?text=NO+POSTER";
            const srvCount = data.servers ? data.servers.length : 0;
            const statusText = data.status || "Live";
            const badgeIcon = statusText.toLowerCase() === "live" ? liveDot : upcomingDot;

            html += `
                <div class="match-card">
                    <a href="player.html?id=${matchId}">
                        <div class="card-thumb">
                            <img src="${imgUrl}" alt="${data.matchName}">
                            <span class="status-badge">
                                ${badgeIcon}
                                ${statusText}
                            </span>
                        </div>
                        <div class="card-details">
                            <div class="card-info">
                                <h3>${data.matchName}</h3>
                                <p>${data.matchTitle}</p>
                            </div>
                            <div class="server-pill">
                                ${serverIcon}
                                <span>${srvCount} SERVERS</span>
                            </div>
                        </div>
                    </a>
                    <div class="card-actions">
                        <button class="btn-play" onclick="window.location.href='player.html?id=${matchId}'">
                            ${playIcon} WATCH STREAM
                        </button>
                    </div>
                </div>
            `;
        });

        matchContainer.innerHTML = html;

    } catch (error) {
        console.error("Error loading matches:", error);
        matchContainer.innerHTML = `
            <p style="color: var(--danger); font-weight: 700; text-align: center; grid-column: 1 / -1; letter-spacing: 1px;">
                ERROR LOADING EVENTS.
            </p>
        `;
    }
}

document.addEventListener("DOMContentLoaded", loadMatches);
