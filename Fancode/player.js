const matchNameEl = document.getElementById("matchName");
const matchTitleEl = document.getElementById("matchTitle");
const serverListEl = document.getElementById("serverList");
const videoElement = document.getElementById("videoPlayer");
const videoContainer = document.getElementById("videoContainer");

const JSON_URL = "https://raw.githubusercontent.com/doctor-8trange/zyphx8/refs/heads/main/data/fancode.json";

let player;
let ui;
let qualitiesData = [];

const urlParams = new URLSearchParams(window.location.search);
const matchId = urlParams.get("id");


// ===============================
// FIXED QUALITY SETTINGS
// ===============================
// Yaha match id aur required quality likho

const fixedQualities = {
    
};


// ===============================
// INIT PLAYER
// ===============================

async function initPlayer() {

    try {

        shaka.polyfill.installAll();

        if (!shaka.Player.isBrowserSupported()) {
            alert("Browser not supported");
            return;
        }


        player = new shaka.Player();

        await player.attach(videoElement);


        ui = new shaka.ui.Overlay(
            player,
            videoContainer,
            videoElement
        );


        ui.configure({

            controlPanelElements: [
                "play_pause",
                "time_and_duration",
                "mute",
                "volume",
                "spacer",
                "quality",
                "picture_in_picture",
                "fullscreen"
            ]

        });


        player.addEventListener(
            "error",
            event => {
                console.error(
                    "Shaka Error:",
                    event.detail
                );
            }
        );


    } catch(error){

        console.error(
            "Player Init Error:",
            error
        );

    }

}



// ===============================
// LOAD STREAM
// ===============================

window.loadStream = async function(index){

    if(!qualitiesData[index]) return;


    const streamUrl = qualitiesData[index].url;


    document
    .querySelectorAll(".server-btn-play")
    .forEach((btn,i)=>{

        btn.classList.toggle(
            "active",
            i === index
        );

    });



    try{


        await player.unload();


        await player.load(streamUrl);


        await videoElement.play();


    }
    catch(error){


        console.error(
            "Stream Error:",
            error
        );


        videoElement.src = streamUrl;

        await videoElement.play();

    }

};



// ===============================
// FETCH MATCH DATA
// ===============================


async function fetchMatchData(){


    if(!matchId) return;


    try{


        const response = await fetch(JSON_URL);

        const data = await response.json();


        const matches =
        Array.isArray(data)
        ? data
        : data.matches || [];



        const match = matches.find(
            m => String(m.match_id) === String(matchId)
        );



        if(!match){

            matchNameEl.innerText =
            "MATCH NOT FOUND";

            return;

        }



        matchNameEl.innerText =
        match.title || "Live Match";


        matchTitleEl.innerText =
        match.tournament || "FanCode Event";



        qualitiesData = [];



        // Check fixed quality

        const selectedQuality =
        fixedQualities[String(matchId)];



        const autoPlaylist =
        match.auto_streams?.[0]?.auto;



        if(autoPlaylist){


            const lines =
            autoPlaylist.split("\n");



            for(let i=0;i<lines.length;i++){


                if(
                    lines[i].includes("#EXT-X-STREAM-INF")
                ){


                    const resolution =
                    lines[i].match(
                        /RESOLUTION=\d+x(\d+)/
                    );



                    const quality =
                    resolution
                    ? resolution[1]+"p"
                    : "STREAM";



                    const url =
                    lines[i+1]?.trim();



                    if(
                        url &&
                        url.startsWith("http")
                    ){


                        // =========================
                        // FIXED QUALITY FILTER
                        // =========================

                        if(selectedQuality){


                            if(
                                quality === selectedQuality
                            ){

                                qualitiesData.push({
                                    quality,
                                    url
                                });

                            }


                        }
                        else{


                            qualitiesData.push({
                                quality,
                                url
                            });


                        }


                    }


                }


            }


        }



        if(!qualitiesData.length){


            serverListEl.innerHTML =
            `
            <p style="
            color:gray;
            text-align:center;
            ">
            Selected quality not available
            </p>
            `;


            return;

        }




        serverListEl.innerHTML =
        qualitiesData.map(
        (q,index)=>{


            return `

            <button 
            class="server-btn-play"
            onclick="loadStream(${index})">

            ${q.quality}

            </button>

            `;


        }).join("");



        // Start first quality

        loadStream(0);



    }
    catch(error){


        console.error(
            "JSON ERROR:",
            error
        );


        matchNameEl.innerText =
        "ERROR LOADING MATCH";


    }


}



// ===============================
// START
// ===============================


document.addEventListener(
"DOMContentLoaded",
async()=>{


    await initPlayer();

    await fetchMatchData();


});
