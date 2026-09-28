/* =========================================================
   FIFO ACCOUNTING SYSTEM
   SPLASH.JS
========================================================= */


const DEMO_SESSION_KEY =
    "fifo_demo_session_v2";


document.addEventListener(
    "DOMContentLoaded",
    function () {

        startSplash();

    }
);


/* =========================================================
   START SPLASH
========================================================= */

function startSplash() {

    const session =
        getSession();


    /*
       Beri sedikit waktu supaya
       splash terasa seperti aplikasi.
    */

    setTimeout(
        function () {

            if (session) {

                /*
                   SUDAH LOGIN
                   → DASHBOARD
                */

                window.location.replace(
                    "index.html"
                );

            } else {

                /*
                   BELUM LOGIN
                   → LOGIN
                */

                window.location.replace(
                    "login.html"
                );

            }

        },
        1200
    );

}


/* =========================================================
   GET SESSION
========================================================= */

function getSession() {

    try {

        const data =
            localStorage.getItem(
                DEMO_SESSION_KEY
            );


        if (!data) {

            return null;

        }


        return JSON.parse(data);

    } catch (error) {

        return null;

    }

}