const matchContainer = document.getElementById("matchContainer");


const JSON_URL =
"https://raw.githubusercontent.com/doctor-8trange/zyphx8/refs/heads/main/data/fancode.json";



async function loadMatches(){


    if(!matchContainer) return;



    matchContainer.innerHTML = `

    <p style="
    color:#94A3B8;
    font-weight:700;
    text-align:center;
    grid-column:1/-1;">
    LOADING LIVE MATCHES...
    </p>

    `;



    try {


        const response = await fetch(JSON_URL);



        if(!response.ok){

            throw new Error("JSON loading failed");

        }



        const data = await response.json();



        const matches = Array.isArray(data)
        ? data
        : data.matches || [];





        const liveMatches = matches.filter(match=>{


            const streams =
            match.auto_streams || [];


            const streamStatus =
            match.streamingStatus || "";


            const status =
            match.status || "";



            return (

                streams.length > 0 ||

                streamStatus.toUpperCase()=="STARTED" ||

                status.toUpperCase()=="LIVE"

            );


        });






        if(liveMatches.length===0){


            matchContainer.innerHTML = `

            <p style="
            color:#94A3B8;
            font-weight:700;
            text-align:center;
            grid-column:1/-1;">
            NO LIVE MATCHES AVAILABLE
            </p>

            `;


            return;


        }





        let html="";




        liveMatches.forEach((match,index)=>{



            const id =
            match.match_id || index;



            const title =
            match.title || "LIVE MATCH";



            const tournament =
            match.tournament || "FanCode Event";



            const image =
            match.image ||
            "https://via.placeholder.com/800x450";



            const language =
            match.language || "ENGLISH";



            const time =
            match.startTime || "LIVE NOW";





            html += `


            <div class="match-card">


            <a href="player.html?id=${id}">


            <div class="card-thumb">


            <img src="${image}"
            alt="${title}"
            loading="lazy">



            <span class="status-badge">

            🔴 LIVE

            </span>



            </div>





            <div class="card-details">


            <div class="card-info">


            <h3>${title}</h3>


            <p>${tournament}</p>



            <div style="
            display:flex;
            gap:8px;
            margin-top:10px;
            flex-wrap:wrap;">


            <div class="time-pill">

            ⏱ ${time}

            </div>


            <div class="time-pill">

            🌐 ${language}

            </div>



            </div>


            </div>


            </div>



            </a>





            <div class="card-actions">


            <button class="btn-play"
            onclick="location.href='player.html?id=${id}'">

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
        color:#EF4444;
        font-weight:700;
        text-align:center;">
        ERROR LOADING LIVE DATA
        </p>

        `;


    }



}







// ======================
// POPUP CONTROL
// ======================


function setupPopup(){



    const popup =
    document.getElementById("popup");



    const close =
    document.getElementById("popup-close");



    if(!popup || !close){

        return;

    }





    setTimeout(()=>{


        popup.classList.add("show");


    },2000);






    close.addEventListener("click",()=>{


        popup.classList.remove("show");


    });







    popup.addEventListener("click",(e)=>{


        if(e.target===popup){


            popup.classList.remove("show");


        }


    });



}






// ======================
// START
// ======================


document.addEventListener("DOMContentLoaded",()=>{


    loadMatches();


    setupPopup();



    setInterval(()=>{


        loadMatches();


    },60000);



});
