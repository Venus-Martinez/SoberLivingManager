import {
    UserManager,
    WebStorageStateStore
} from "oidc-client-ts";


const cognitoAuthConfig = {

    authority:
        "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_gynPjdhYy",

    client_id:
        "6ke5hm2a9qqvm5entap3rmk3mn",

    redirect_uri:
        new URL(
            import.meta.env.BASE_URL,
            window.location.origin
        ).href,

    post_logout_redirect_uri:
        new URL(
            import.meta.env.BASE_URL,
            window.location.origin
        ).href,

    response_type:
        "code",

    scope:
        "openid email profile",

    userStore:
        new WebStorageStateStore({
            store: window.localStorage
        })
};


export const userManager =
    new UserManager(
        cognitoAuthConfig
    );


export async function signIn() {

    await userManager.signinRedirect();
}


export async function signOut() {

    await userManager.removeUser();

    const logoutUri =
        new URL(
            import.meta.env.BASE_URL,
            window.location.origin
        ).href;

    const cognitoDomain =
        "https://us-east-1gynpjdhyy.auth.us-east-1.amazoncognito.com";

    const clientId =
        cognitoAuthConfig.client_id;

    window.location.href =
        `${cognitoDomain}/logout` +
        `?client_id=${encodeURIComponent(clientId)}` +
        `&logout_uri=${encodeURIComponent(logoutUri)}`;
}


export async function getCurrentUser() {

    return await userManager.getUser();
}


export async function getAccessToken() {

    const user =
        await getCurrentUser();

    if (
        !user ||
        user.expired
    ) {
        return null;
    }

    return user.access_token;
}


export async function handleAuthCallback() {

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    if (
        !urlParams.has("code")
    ) {
        return null;
    }

    try {

        const user =
            await userManager
                .signinRedirectCallback();

        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );

        return user;

    } catch (error) {

        console.error(
            "Cognito callback error:",
            error
        );

        throw error;
    }
}