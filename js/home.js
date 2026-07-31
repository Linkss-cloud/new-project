import { db } from "../firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";



const matchesBox = document.getElementById("matches");
const upcomingBox = document.getElementById("upcoming");
const favoritesBox = document.getElementById("favorites");
const favoritesSection = document.getElementById("favorites-section");
const search = document.getElementById("search");



let matches = [];

let favorites =
JSON.parse(localStorage.getItem("favorites")) || [];





async function loadMatches(){


    try{


        const snapshot =
        await getDocs(
            collection(db,"matches")
        );



        matches = [];



        snapshot.forEach((doc)=>{


            const data = doc.data();



            matches.push({


                id: doc.id,


                title:
                data.matchName || "Unknown Match",


                league:
                data.matchTitle || "",


                thumbnail:
                data.posterUrl || "",


                status:
                data.status === "Live"
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


        console.log(
            "Firebase Error:",
            error
        );


        matchesBox.innerHTML =
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



const isFav =
favorites.includes(match.id);





card.innerHTML = `


<div class="card-thumb">


<img

src="${match.thumbnail}"

loading="lazy"

alt="${match.title}"

>


<div class="status-badge">


${
match.status==="LIVE"
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




<button 
class="favorite-btn"
data-id="${match.id}">


${isFav ? "★" : "☆"}


</button>



</div>





<div class="card-actions">


<a

href="watch.html?id=${match.id}"

class="btn-play">


▶ WATCH NOW


</a>


</div>



`;





const favBtn =
card.querySelector(".favorite-btn");



favBtn.onclick=()=>{


toggleFavorite(match.id);


render();


};



return card;



}









function render(list = matches){



matchesBox.innerHTML="";
upcomingBox.innerHTML="";
favoritesBox.innerHTML="";




const live =

list.filter(
item=>item.status==="LIVE"
);



const upcoming =

list.filter(
item=>item.status==="UPCOMING"
);





if(live.length){


live.forEach(match=>{


matchesBox.appendChild(
createCard(match)
);


});


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


upcoming.forEach(match=>{


upcomingBox.appendChild(
createCard(match)
);


});


}

else{


upcomingBox.innerHTML=
`
<div class="no-live">

⏰ No upcoming matches

</div>
`;

}







const favMatches =

matches.filter(
item=>
favorites.includes(item.id)
);




if(favMatches.length){


favoritesSection.classList.remove(
"hidden"
);



favMatches.forEach(match=>{


favoritesBox.appendChild(
createCard(match)
);


});


}

else{


favoritesSection.classList.add(
"hidden"
);


}



}








function toggleFavorite(id){



if(favorites.includes(id)){


favorites =
favorites.filter(
item=>item!==id
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


const value =
search.value.toLowerCase();



const filtered =

matches.filter(match=>


match.title
.toLowerCase()
.includes(value)


||

match.league
.toLowerCase()
.includes(value)


);



render(filtered);



});







loadMatches();