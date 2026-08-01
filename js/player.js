import { db } from "../firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const params =
new URLSearchParams(location.search);


const matchId =
params.get("id");



const matchName =
document.getElementById("matchName");


const matchTitle =
document.getElementById("matchTitle");


const serverList =
document.getElementById("serverList");


const loader =
document.getElementById("loader");



const shakaBox =
document.getElementById("shaka-container");


const iosBox =
document.getElementById("ios-container");


const iframeBox =
document.getElementById("iframe-container");



const video =
document.getElementById("videoPlayer");


const iosVideo =
document.getElementById("ios-video");


const frame =
document.getElementById("stream-frame");



let player=null;

let hls=null;







function showLoader(){

    loader.style.display="block";

}



function hideLoader(){

    loader.style.display="none";

}







function stopAll(){


    if(hls){

        hls.destroy();

        hls=null;

    }



    if(player){

        player.unload()
        .catch(()=>{});

    }



    video.pause();

    iosVideo.pause();



    frame.src="";



    shakaBox.style.display="none";

    iosBox.style.display="none";

    iframeBox.style.display="none";


}







async function loadCookiePlayer(stream){


    if(
        typeof window.loadCookieShaka === "function"
    ){

        await window.loadCookieShaka(stream);

    }

    else{

        console.error(
            "cookie-shaka.js not loaded"
        );

    }


}

async function playStream(stream){


    showLoader();


    stopAll();





    /*
        IFRAME PLAYER
    */


    if(stream.type==="iframe"){


        iframeBox.style.display="block";


        frame.src =
        stream.url;


        hideLoader();


        return;


    }







    /*
        COOKIE SHAKA PLAYER
    */


    if(stream.type==="cookie"){


        shakaBox.style.display="block";


        await loadCookiePlayer(stream);


        hideLoader();


        return;


    }








    /*
        FANCODE / NATIVE VIDEO
    */


    if(

        stream.type==="fancode"

        ||

        stream.url?.toLowerCase()
        .includes("fancode")

    ){



        iosBox.style.display="block";



        iosVideo.src =
        stream.url;



        iosVideo.play()
        .catch(()=>{});



        iosVideo.onplaying =
        hideLoader;



        setTimeout(
            hideLoader,
            5000
        );



        return;


    }









    /*
        HLS PLAYER
    */


    if(stream.type==="hls"){



        iosBox.style.display="block";




        if(Hls.isSupported()){



            hls =
            new Hls({

                enableWorker:true,

                lowLatencyMode:true

            });





            hls.loadSource(
                stream.url
            );



            hls.attachMedia(
                iosVideo
            );





            hls.on(

                Hls.Events.MANIFEST_PARSED,

                ()=>{


                    iosVideo.play()
                    .catch(()=>{});


                }

            );



        }

        else{


            iosVideo.src =
            stream.url;


            iosVideo.play()
            .catch(()=>{});


        }





        iosVideo.onplaying =
        hideLoader;



        setTimeout(
            hideLoader,
            5000
        );



        return;


    }









    /*
        NORMAL SHAKA DRM
    */



    if(stream.type==="shaka"){



        shakaBox.style.display="block";



        try{



            shaka.polyfill.installAll();




            if(!player){



                player =
                new shaka.Player();



                await player.attach(video);


            }

            else{


                await player.unload();


            }







            player.configure({

                drm:{

                    clearKeys:{}

                }

            });





            player.getNetworkingEngine()
            .clearAllRequestFilters();








            if(stream.key){



                const key =
                stream.key.split(":");



                if(key.length===2){



                    player.configure({

                        drm:{


                            clearKeys:{


                                [key[0].trim()]:

                                key[1].trim()


                            }


                        }


                    });



                }


            }






            await player.load(

                stream.url || stream.mpd

            );



            video.play()
            .catch(()=>{});



            video.onplaying =
            hideLoader;



        }


        catch(err){


            console.error(
                "SHAKA ERROR",
                err
            );


            loader.innerHTML =
            "STREAM ERROR";


        }



    }



}









function createServer(server,index){



    const btn =
    document.createElement("button");



    btn.className =
    "server-btn-play";



    btn.innerHTML =
    server.channelName ||
    "SERVER "+(index+1);




    btn.onclick=()=>{



        document
        .querySelectorAll(".server-btn-play")
        .forEach(b=>

            b.classList.remove("active")

        );



        btn.classList.add("active");



        playStream(server);



    };



    serverList.appendChild(btn);




    if(index===0){


        btn.classList.add("active");


        playStream(server);


    }



}








async function loadMatch(){


    const snap =
    await getDoc(

        doc(db,"matches",matchId)

    );



    if(!snap.exists()){


        matchName.innerText =
        "MATCH NOT FOUND";


        return;


    }





    const data =
    snap.data();



    matchName.innerText =
    data.matchName;



    matchTitle.innerText =
    data.matchTitle;




    serverList.innerHTML="";



    (data.servers || [])
    .forEach(

        (server,index)=>{

            createServer(
                server,
                index
            );

        }

    );



}









window.addEventListener(
"beforeunload",
()=>{


    if(hls)
        hls.destroy();



    if(player)
        player.destroy();



});





loadMatch();
