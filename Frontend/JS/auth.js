/* =========================================================
   FIFO ACCOUNTING SYSTEM
   DEMO AUTHENTICATION
========================================================= */


const SESSION_KEY =
    "fifo_demo_session_v2";


/* =========================================================
   SESSION
========================================================= */

function getDemoSession() {

    const saved =
        localStorage.getItem(
            SESSION_KEY
        );


    if (!saved) {

        return null;

    }


    try {

        return JSON.parse(saved);

    } catch (error) {

        localStorage.removeItem(
            SESSION_KEY
        );

        return null;

    }

}


function saveDemoSession(
    session
) {

    localStorage.setItem(
        SESSION_KEY,
        JSON.stringify(session)
    );

}


function clearDemoSession() {

    localStorage.removeItem(
        SESSION_KEY
    );

}


/* =========================================================
   PAGE DETECTION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const path =
            window.location.pathname;


        /*
           LOGIN
        */

        if (
            path.endsWith(
                "/login.html"
            ) ||
            path.endsWith(
                "\\login.html"
            )
        ) {

            initializeLogin();

            return;

        }


        /*
           DASHBOARD
        */

        if (
            path.endsWith(
                "/dashboard.html"
            ) ||
            path.endsWith(
                "\\dashboard.html"
            )
        ) {

            initializeDashboard();

            return;

        }

    }
);


/* =========================================================
   LOGIN
========================================================= */

function initializeLogin() {

    const form =
        document.getElementById(
            "loginForm"
        );


    if (!form) {

        return;

    }


    /*
       Jika sudah punya session,
       langsung ke dashboard.
    */

    const existing =
        getDemoSession();


    if (existing) {

        window.location.href =
            "dashboard.html";

        return;

    }


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const email =
                document.getElementById(
                    "email"
                ).value.trim();


            const password =
                document.getElementById(
                    "password"
                ).value;


            if (!email) {

                showLoginMessage(
                    "Email wajib diisi.",
                    "error"
                );

                return;

            }


            if (!password) {

                showLoginMessage(
                    "Password wajib diisi.",
                    "error"
                );

                return;

            }


            /*
               DEMO LOGIN

               Tidak ada pengecekan
               Supabase Auth.
            */

            const session = {

                email: email,

                full_name:
                    createDisplayName(
                        email
                    ),

                role:
                    "System Administrator",

                login_time:
                    new Date()
                        .toISOString()

            };


            saveDemoSession(
                session
            );


            showLoginMessage(
                "Login berhasil.",
                "success"
            );


            const button =
                document.getElementById(
                    "loginButton"
                );


            if (button) {

                button.disabled =
                    true;

                button.textContent =
                    "Membuka sistem...";

            }


            /*
               Masuk dashboard
            */

            setTimeout(
                function () {

                    window.location.href =
                        "dashboard.html";

                },
                350
            );

        }
    );

}


/* =========================================================
   DASHBOARD
========================================================= */

function initializeDashboard() {

    const session =
        getDemoSession();


    /*
       Tidak punya session
       → login
    */

    if (!session) {

        window.location.href =
            "login.html";

        return;

    }


    displayUser(
        session
    );


    initializeLogout();

}


/* =========================================================
   DISPLAY USER
========================================================= */

function displayUser(
    session
) {

    const name =
        session.full_name ||
        "System User";


    const email =
        session.email ||
        "demo@email.com";


    const role =
        session.role ||
        "System Administrator";


    const userName =
        document.getElementById(
            "userName"
        );


    const userRole =
        document.getElementById(
            "userRole"
        );


    const accountName =
        document.getElementById(
            "accountName"
        );


    const accountEmail =
        document.getElementById(
            "accountEmail"
        );


    const userAvatar =
        document.getElementById(
            "userAvatar"
        );


    const profileAvatar =
        document.getElementById(
            "profileAvatar"
        );


    if (userName) {

        userName.textContent =
            name;

    }


    if (userRole) {

        userRole.textContent =
            role;

    }


    if (accountName) {

        accountName.textContent =
            name;

    }


    if (accountEmail) {

        accountEmail.textContent =
            email;

    }


    const initial =
        name
            .charAt(0)
            .toUpperCase();


    if (userAvatar) {

        userAvatar.textContent =
            initial;

    }


    if (profileAvatar) {

        profileAvatar.textContent =
            initial;

    }

}


/* =========================================================
   LOGOUT
========================================================= */

function initializeLogout() {

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (!logoutButton) {

        return;

    }


    logoutButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


            clearDemoSession();


            /*
               dashboard.html
               berada di:

               frontend/html/

               ../../index.html
               berarti:

               frontend/html
                   ↓ ..
               frontend
                   ↓ ..
               root
                   ↓
               index.html
            */

            window.location.href =
                "../../index.html";

        }
    );

}


/* =========================================================
   DISPLAY NAME
========================================================= */

function createDisplayName(
    email
) {

    const beforeAt =
        email
            .split("@")[0];


    return beforeAt
        .replace(
            /[._-]+/g,
            " "
        )
        .replace(
            /\b\w/g,
            function (letter) {

                return letter.toUpperCase();

            }
        );

}


/* =========================================================
   LOGIN MESSAGE
========================================================= */

function showLoginMessage(
    message,
    type
) {

    const messageElement =
        document.getElementById(
            "loginMessage"
        );


    if (!messageElement) {

        return;

    }


    messageElement.textContent =
        message;


    messageElement.className =
        "login-message " +
        type;

}


/* =========================================================
   GLOBAL
========================================================= */

window.getDemoSession =
    getDemoSession;

window.saveDemoSession =
    saveDemoSession;

window.clearDemoSession =
    clearDemoSession;