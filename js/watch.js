import { db } from "../firebase.js";

import {
    doc,
    getDoc
}
from
"https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";



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









async function loadMatch(){



try{


const snap =
await getDoc(
doc(
db,
"matches",
matchId
)
);





if(!snap.exists()){

matchName.innerHTML="MATCH NOT FOUND";

return;

}




const data =
snap.data();




matchName.innerHTML =
data.matchName || "LIVE MATCH";



matchTitle.innerHTML =
data.matchTitle || "SPORTS LIVE";





const servers =
data.servers || [];





if(!servers.length){


serverList.innerHTML=
`
<p class="server-btn-play">
NO STREAM AVAILABLE
</p>
`;

return;


}




servers.forEach(

(server,index)=>{


createServer(
server,
index
);


});


}

catch(error){


console.log(error);


matchName.innerHTML=
"ERROR LOADING MATCH";


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
.forEach(
b=>b.classList.remove("active")
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









async function playStream(stream){



showLoader();


stopAll();





/* ======================
IFRAME
====================== */


if(stream.type==="iframe"){



iframeBox.style.display="block";



frame.src =
stream.url;



hideLoader();


return;


}







/* ======================
HLS / IOS
====================== */


if(stream.type==="hls"){



iosBox.style.display="block";



iosVideo.style.width="100%";

iosVideo.style.height="100%";






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




hls.on(

Hls.Events.ERROR,

(event,data)=>{


if(data.fatal){


console.log(
"HLS ERROR",
data
);


}


}

);




}

else{


iosVideo.src =
stream.url;


iosVideo.play()
.catch(()=>{});



}






iosVideo.onplaying=()=>{


hideLoader();


};




setTimeout(
hideLoader,
5000
);



return;


}









/* ======================
SHAKA DRM
====================== */


if(stream.type==="shaka"){



shakaBox.style.display="block";




try{



shaka.polyfill.installAll();





if(!player){



player =
new shaka.Player(video);



}





if(stream.key){



const keyParts =
stream.key.split(":");



if(keyParts.length===2){


player.configure({

drm:{


clearKeys:{


[keyParts[0]]:

keyParts[1]


}


}


});



}



}






await player.load(

stream.mpd

);





video.play()
.catch(()=>{});





video.onplaying=()=>{


hideLoader();


};





}

catch(error){



console.log(
"SHAKA ERROR",
error
);



loader.innerHTML =
"STREAM ERROR";



}



}



}









window.addEventListener(

"beforeunload",

()=>{


if(hls){

hls.destroy();

}



if(player){

player.destroy();

}



});






loadMatch();