import { db } from "../firebase.js";


import {

collection,
getDocs

}

from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";





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




let matches=[];


let favorites =
JSON.parse(localStorage.getItem("favorites")) || [];







async function loadMatches(){


try{


const snap =
await getDocs(
collection(db,"matches")
);



matches=[];



snap.forEach(doc=>{


const data =
doc.data();



matches.push({


id:doc.id,


title:
data.matchName || "Unknown Match",


league:
data.matchTitle || "",


thumbnail:
data.posterUrl || "",


status:
data.status==="Live"
?
"LIVE"
:
"UPCOMING",


servers:
data.servers || []


});


});



render();


}

catch(error){


console.log(error);


matchesBox.innerHTML=

`

<div class="no-live">

Database connection error

</div>

`;

}



}









function createCard(match){



const card =
document.createElement("div");


card.className="match-card";



const fav =
favorites.includes(match.id);



card.innerHTML=


`

<div class="card-thumb">


<img

src="${match.thumbnail}"

loading="lazy"

alt="${match.title}"

>


<div class="status-badge">

${match.status==="LIVE"
?
"🔴 LIVE"
:
"⏰ UPCOMING"
}

</div>


</div>




<div class="card-details">


<div class="card-info">


<h3>

${match.title}

</h3>


<p>

${match.league}

</p>


</div>




<button class="favorite-btn">

${fav ? "★":"☆"}

</button>



</div>




<div class="card-actions">


<a href="watch.html?id=${match.id}"

class="btn-play">

▶ WATCH NOW

</a>


</div>

`;






card.querySelector(".favorite-btn").onclick=()=>{


toggleFavorite(match.id);


render();


};



return card;


}









function render(list=matches){


matchesBox.innerHTML="";

upcomingBox.innerHTML="";

favoritesBox.innerHTML="";



let live =
list.filter(
m=>m.status==="LIVE"
);



let upcoming =
list.filter(
m=>m.status==="UPCOMING"
);




if(live.length){


live.forEach(m=>

matchesBox.appendChild(
createCard(m)
)

);


}

else{


matchesBox.innerHTML=

`
<div class="no-live">

🔴 No live matches available

</div>
`;

}




if(upcoming.length){


upcoming.forEach(m=>

upcomingBox.appendChild(
createCard(m)
)

);


}

else{


upcomingBox.innerHTML=

`
<div class="no-live">

⏰ No upcoming matches

</div>

`;

}




let favMatches =
matches.filter(
m=>favorites.includes(m.id)
);



if(favMatches.length){


favoritesSection.classList.remove("hidden");


favMatches.forEach(m=>

favoritesBox.appendChild(
createCard(m)
)

);


}

else{


favoritesSection.classList.add("hidden");


}



}









function toggleFavorite(id){


if(favorites.includes(id)){


favorites =
favorites.filter(
x=>x!==id
);


}

else{


favorites.push(id);


}



localStorage.setItem(

"favorites",

JSON.stringify(favorites)

);


}









search.addEventListener(
"input",
()=>{


let value =
search.value.toLowerCase();



let filtered =
matches.filter(m=>

m.title.toLowerCase().includes(value)

||

m.league.toLowerCase().includes(value)

);



render(filtered);


});






loadMatches();
