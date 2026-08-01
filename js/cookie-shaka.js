console.log("COOKIE SHAKA FILE LOADED");


let cookiePlayer = null;


window.loadCookieShaka = async function(stream){


    console.log(
        "COOKIE STREAM RECEIVED:",
        stream
    );



    const video =
    document.getElementById("videoPlayer");



    const loader =
    document.getElementById("loader");



    const box =
    document.getElementById("shaka-container");



    try{


        if(box){

            box.style.display="block";

        }



        shaka.polyfill.installAll();



        if(
            !shaka.Player.isBrowserSupported()
        ){

            console.error(
                "SHAKA NOT SUPPORTED"
            );

            return;

        }






        if(!cookiePlayer){


            cookiePlayer =
            new shaka.Player();



            await cookiePlayer.attach(
                video
            );


        }
        else{


            await cookiePlayer.unload();


        }






        cookiePlayer.configure({

            drm:{

                clearKeys:{}

            }

        });




        cookiePlayer.getNetworkingEngine()
        .clearAllRequestFilters();






        /*
            CLEAR KEY
        */


        if(
            stream.key &&
            stream.key.includes(":")
        ){


            const key =
            stream.key.split(":");


            const kid =
            key[0]
            .trim()
            .toLowerCase();


            const value =
            key[1]
            .trim()
            .toLowerCase();



            console.log(
                "CLEAR KEY:",
                kid
            );



            cookiePlayer.configure({

                drm:{

                    clearKeys:{


                        [kid]:value


                    }

                }

            });


        }








        /*
            COOKIE REQUEST
        */


        const token =
        stream.cookie.trim();




        cookiePlayer.getNetworkingEngine()
        .registerRequestFilter(

        (type,request)=>{


            console.log(
                "REQUEST:",
                request.uris[0]
            );



            if(token){



                /*
                  Header
                */


                request.headers["Referer"] =
                "https://www.jiotv.com/";



                request.headers["User-Agent"] =
                "plaYtv/7.1.5 (Linux;Android 13) ExoPlayerLib/2.11.6";




                /*
                  URL TOKEN
                */


                if(
                    request.uris[0]
                    .startsWith("https://")
                    &&
                    !request.uris[0]
                    .includes("__hdnea__")
                ){


                    request.uris[0] +=

                    (
                        request.uris[0]
                        .includes("?")
                        ?
                        "&"
                        :
                        "?"
                    )

                    +
                    token;


                }



            }



        });








        const url =
        stream.mpd ||
        stream.url;




        console.log(
            "LOADING:",
            url
        );



        await cookiePlayer.load(
            url
        );




        console.log(
            "COOKIE SHAKA PLAYING"
        );



        video.muted=false;


        video.play()
        .catch(err=>{

            console.log(
                "PLAY BLOCKED",
                err
            );

        });





        video.onplaying=()=>{


            console.log(
                "VIDEO STARTED"
            );


            if(loader)
                loader.style.display="none";


        };



        cookiePlayer.addEventListener(
        "error",
        e=>{


            console.error(
                "SHAKA ERROR",
                e.detail
            );


        });



    }


    catch(error){


        console.error(
            "COOKIE SHAKA ERROR",
            error
        );


        if(loader){

            loader.innerHTML =
            "STREAM ERROR";

        }


    }



};
