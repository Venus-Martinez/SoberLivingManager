import {
    signIn,
    signOut,
    getCurrentUser,
    handleAuthCallback
} from "./authService.js";


async function initializeAuthUi() {

    try {

        await handleAuthCallback();

        const user =
            await getCurrentUser();

        const loggedOutView =
            document.getElementById(
                "logged-out-view"
            );

        const loggedInView =
            document.getElementById(
                "logged-in-view"
            );

        const signedInUser =
            document.getElementById(
                "signed-in-user"
            );

        if (
            user &&
            !user.expired
        ) {

            loggedOutView
                .classList
                .add("hidden");

            loggedInView
                .classList
                .remove("hidden");

            document
                .getElementById("protected-app")
                .classList
                .remove("hidden");

            signedInUser.textContent =
                user.profile?.email ??
                "Signed in";

        } else {

            loggedOutView
                .classList
                .remove("hidden");

            loggedInView
                .classList
                .add("hidden");

            document
                .getElementById("protected-app")
                .classList
                .add("hidden");
        }

    } catch (error) {

        console.error(
            "Authentication UI error:",
            error
        );
    }
}


document
    .getElementById(
        "sign-in-button"
    )
    .addEventListener(
        "click",
        async () => {

            await signIn();
        }
    );


document
    .getElementById(
        "sign-out-button"
    )
    .addEventListener(
        "click",
        async () => {

            await signOut();
        }
    );


initializeAuthUi();