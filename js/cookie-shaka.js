console.log("COOKIE SHAKA FILE LOADED");


let cookiePlayer = null;


window.loadCookieShaka = async function(stream){

    console.log("COOKIE STREAM RECEIVED:", stream);


    const video = document.getElementById("videoPlayer");


    const loader = document.getElementById("loader");



    try{


        shaka.polyfill.installAll();



        if(!shaka.Player.isBrowserSupported()){

            console.error("SHAKA NOT SUPPORTED");

            return;

        }




        if(!cookiePlayer){


            cookiePlayer = new shaka.Player();


            await cookiePlayer.attach(video);


        }
        else{


            try{

                await cookiePlayer.unload();

            }
            catch(e){}



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


            const keyParts =
            stream.key.split(":");



            const kid =
            keyParts[0]
            .trim()
            .toLowerCase();



            const key =
            keyParts[1]
            .trim()
            .toLowerCase();




            console.log(
                "CLEAR KEY:",
                kid
            );




            cookiePlayer.configure({

                drm:{

                    clearKeys:{


                        [kid]:key


                    }

                }

            });


        }









        /*
            COOKIE REQUEST
        */


        cookiePlayer.getNetworkingEngine()
        .registerRequestFilter(

            (type, request)=>{


                console.log(
                    "REQUEST BEFORE:",
                    request.uris[0]
                );



                if(
                    stream.cookie &&
                    stream.cookie.trim() !== ""
                ){



                    /*
                        ADD TOKEN IN URL
                    */


                    if(

                        !request.uris[0]
                        .includes("__hdnea")

                        &&

                        !request.uris[0]
                        .includes("hdnts")

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

                        stream.cookie;



                    }



                }




                console.log(
                    "REQUEST AFTER:",
                    request.uris[0]
                );



            }

        );









        console.log(
            "LOADING:",
            stream.mpd || stream.url
        );




        await cookiePlayer.load(

            stream.mpd ||
            stream.url

        );





        video.play()
        .catch(()=>{});





        video.onplaying = ()=>{


            if(loader){

                loader.style.display="none";

            }


        };



        console.log(
            "COOKIE SHAKA PLAYING"
        );



    }

    catch(error){


        console.error(
            "COOKIE SHAKA ERROR:",
            error
        );



        if(loader){

            loader.innerHTML =
            "STREAM ERROR";

        }



    }


};
