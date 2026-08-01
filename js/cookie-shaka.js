let cookiePlayer = null;


window.loadCookieShaka = async function(stream){


    const video =
    document.getElementById("videoPlayer");



    try{


        shaka.polyfill.installAll();



        if(
            !shaka.Player.isBrowserSupported()
        ){

            console.error(
                "Shaka not supported"
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
            CLEAR KEY DRM
        */


        if(
            stream.key &&
            stream.key.includes(":")
        ){



            const parts =
            stream.key.split(":");



            const kid =
            parts[0].trim()
            .toLowerCase();



            const key =
            parts[1].trim()
            .toLowerCase();





            cookiePlayer.configure({

                drm:{

                    clearKeys:{


                        [kid]:key


                    }

                }

            });



        }









        /*
            COOKIE HEADER
        */



        cookiePlayer.getNetworkingEngine()
        .registerRequestFilter(

            (type,request)=>{



                if(
                    stream.cookie &&
                    stream.cookie !== ""
                ){



                    request.headers["Referer"] =
                    "https://www.jiotv.com/";



                    request.headers["User-Agent"] =
                    "plaYtv/7.1.5 (Linux;Android 13) ExoPlayerLib/2.11.6";



                    request.headers["Cookie"] =
                    stream.cookie;





                    if(

                        !request.uris[0]
                        .includes("__hdnea=")

                        &&

                        !request.uris[0]
                        .includes("hdnts=")

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



            }

        );









        await cookiePlayer.load(

            stream.mpd ||
            stream.url

        );





        video.play()
        .catch(()=>{});




        video.onplaying=()=>{


            const loader =
            document.getElementById("loader");


            if(loader)
                loader.style.display="none";


        };




    }


    catch(error){


        console.error(

            "COOKIE SHAKA ERROR",

            error

        );


        const loader =
        document.getElementById("loader");



        if(loader)

            loader.innerHTML =
            "STREAM ERROR";



    }



};
