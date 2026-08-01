import { db } from "../firebase.js";


import {

collection,
getDocs

}

from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";





const matchContainer =
document.getElementById("matchContainer");






async function loadMatches(){



matchContainer.innerHTML = `

<p style="
color:var(--text-muted);
font-weight:700;
text-align:center;
grid-column:1/-1;">
LOADING LIVE EVENTS...
</p>

`;



try {



const querySnapshot =
await getDocs(collection(db,"matches"));




if(querySnapshot.empty){


matchContainer.innerHTML = `

<p style="
color:var(--text-muted);
font-weight:700;
text-align:center;
grid-column:1/-1;">
NO EVENTS ARE CURRENTLY SCHEDULED.
</p>

`;


return;


}




let html = "";





const liveDot = `

<div style="
width:8px;
height:8px;
background:#EF4444;
border-radius:50%;">
</div>

`;



const upcomingDot = `

<div style="
width:8px;
height:8px;
background:#F59E0B;
border-radius:50%;">
</div>

`;






querySnapshot.forEach((doc)=>{


const data = doc.data();


const id = doc.id;



const image =
data.posterUrl ||
"https://via.placeholder.com/800x450/1E293B/94A3B8?text=NO+POSTER";



const servers =
data.servers ? data.servers.length : 0;



const status =
data.status || "Live";



const badge =
status.toLowerCase()=="live"
? liveDot
: upcomingDot;




html += `


<div class="match-card">



<a href="player.html?id=${id}">


<div class="card-thumb">


<img src="${image}"
alt="${data.matchName}">



<span class="status-badge">

${badge}

${status}

</span>


</div>





<div class="card-details">


<div class="card-info">


<h3>
${data.matchName}
</h3>


<p>
${data.matchTitle}
</p>


</div>





<div class="server-pill">

${servers} SERVERS

</div>



</div>


</a>





<div class="card-actions">


<button class="btn-play"
onclick="window.location.href='player.html?id=${id}'">

▶ WATCH STREAM

</button>


</div>



</div>



`;



});



matchContainer.innerHTML = html;



}

catch(error){


console.error(error);


matchContainer.innerHTML = `

<p style="
color:red;
text-align:center;
grid-column:1/-1;">
ERROR LOADING EVENTS.
</p>

`;

}


}









// ===============================
// POPUNDER AD SYSTEM
// ===============================


let clickCounter = 0;




function activatePopunder(){



if(typeof aclib !== "undefined"){



aclib.runPop({

zoneId:'11800802'

});


}



}







// Telegram Popup

document.addEventListener("DOMContentLoaded",()=>{


const popup =
document.getElementById("popup");



const close =
document.getElementById("popup-close");




// Show popup instantly

popup.classList.add("active");





close.addEventListener("click",()=>{


popup.classList.remove("active");



// activate on close

activatePopunder();



});





popup.addEventListener("click",(e)=>{


if(e.target === popup){

popup.classList.remove("active");

}


});



});








// Every 2 clicks popunder


document.addEventListener("click",(e)=>{



if(e.target.id === "popup-close"){

return;

}



clickCounter++;



if(clickCounter >= 2){


activatePopunder();


clickCounter = 0;


}



});








loadMatches();
