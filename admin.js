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

let serverCount = 0;

let editId = null;

let matchesData = {};

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

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    await signInWithEmailAndPassword(
      auth,

      adminEmail.value,

      adminPassword.value,
    );
  } catch (error) {
    loginError.innerText = "INVALID LOGIN";
  }
});

logoutBtn.onclick = () => {
  signOut(auth);
};

addServerBtn.onclick = () => {
  addServerField();
};

window.addServerField = function (
  name = "",

  type = "shaka",

  url = "",

  key = "",

  cookie = "",
) {
  serverCount++;

  let div = document.createElement("div");

  div.className = "server-block";

  div.id = "server_" + serverCount;
  div.innerHTML = `


<button

type="button"

class="btn-delete-server"

onclick="removeServerField('${div.id}')">

REMOVE

</button>





<div class="input-group">

<label>
SERVER NAME
</label>


<input

class="srv-name"

value="${name}"

required>

</div>







<div class="input-group">

<label>
STREAM TYPE
</label>



<select class="srv-type">



<option value="shaka"
${type === "shaka" ? "selected" : ""}>

SHAKA DRM

</option>



<option value="cookie"
${type === "cookie" ? "selected" : ""}>

COOKIE SHAKA

</option>



<option value="hls"
${type === "hls" ? "selected" : ""}>

HLS / IOS

</option>




<option value="fancode"
${type === "fancode" ? "selected" : ""}>

FANCODE

</option>




<option value="iframe"
${type === "iframe" ? "selected" : ""}>

IFRAME

</option>


</select>

</div>








<div class="input-group">

<label>
STREAM URL
</label>


<input

class="srv-url"

value="${url}"

placeholder="MPD / M3U8 / IFRAME"

oninput="detectStreamType(this)">


</div>








<div class="input-group">

<label>
DRM KEY (kid:key)
</label>


<input

class="srv-key"

value="${key}">


</div>








<div class="input-group">

<label>
COOKIE

</label>


<input

class="srv-cookie"

value="${cookie}">


</div>



`;

  serverContainer.appendChild(div);
};

window.detectStreamType = function (input) {
  let block = input.closest(".server-block");

  let type = block.querySelector(".srv-type");

  let url = input.value.toLowerCase();

  if (url.includes("fancode") || url.includes("cloudfront.net")) {
    type.value = "fancode";
  } else if (url.includes(".m3u8")) {
    type.value = "hls";
  } else if (url.includes(".mpd")) {
    type.value = "cookie";
  }
};

window.removeServerField = function (id) {
  document.getElementById(id).remove();
};

addServerField();

matchForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  let payload = {
    matchName: document.getElementById("matchName").value,

    matchTitle: document.getElementById("matchTitle").value,

    posterUrl: document.getElementById("posterUrl").value,

    status: document.getElementById("matchStatus").value,

    servers: [],

    updatedAt: new Date().toISOString(),
  };

  document

    .querySelectorAll(".server-block")

    .forEach((block) => {
      payload.servers.push({
        channelName: block.querySelector(".srv-name").value,

        type: block.querySelector(".srv-type").value,

        url: block.querySelector(".srv-url").value,

        mpd: block.querySelector(".srv-url").value,

        key: block.querySelector(".srv-key").value,

        cookie: block.querySelector(".srv-cookie").value,
      });
    });

  if (editId) {
    await updateDoc(
      doc(db, "matches", editId),

      payload,
    );
  } else {
    await addDoc(
      collection(db, "matches"),

      payload,
    );
  }

  resetForm();

  loadMatches();
});

async function loadMatches() {
  matchList.innerHTML = "Loading...";

  const snap = await getDocs(collection(db, "matches"));

  matchesData = {};

  let html = "";

  snap.forEach((item) => {
    let data = item.data();

    matchesData[item.id] = data;

    html += `



<div class="match-item">



<img src="${data.posterUrl}">



<h3>

${data.matchName}

</h3>



<p>

${data.matchTitle}

</p>




<button onclick="editMatch('${item.id}')">

EDIT

</button>




<button onclick="deleteMatch('${item.id}')">

DELETE

</button>



</div>



`;
  });

  matchList.innerHTML = html;
}

window.editMatch = function (id) {
  let data = matchesData[id];

  editId = id;

  formTitle.innerText = "EDIT MATCH";

  cancelEditBtn.style.display = "block";

  matchName.value = data.matchName;

  matchTitle.value = data.matchTitle;

  posterUrl.value = data.posterUrl;

  matchStatus.value = data.status;

  serverContainer.innerHTML = "";

  data.servers.forEach((server) => {
    addServerField(
      server.channelName,

      server.type,

      server.url || server.mpd,

      server.key,

      server.cookie,
    );
  });
};

cancelEditBtn.onclick = () => {
  resetForm();
};

function resetForm() {
  editId = null;

  formTitle.innerText = "CREATE MATCH";

  cancelEditBtn.style.display = "none";

  matchForm.reset();

  serverContainer.innerHTML = "";

  addServerField();
}

window.deleteMatch = async function (id) {
  if (confirm("Delete Match?")) {
    await deleteDoc(doc(db, "matches", id));

    loadMatches();
  }
};
