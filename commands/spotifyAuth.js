const SpotifyWebApi = require("spotify-web-api-node");
require("dotenv").config();

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

async function getAccessToken() {
    try {
        const data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body["access_token"]);
        return data.body["access_token"];
    } catch (error) {
        console.error(
            "Error retrieving access token from Spotify:",
            error.message,
        );
        throw new Error("Failed to retrieve access token");
    }
}

async function refreshAccessToken() {
    try {
        const data = await spotifyApi.refreshAccessToken();
        spotifyApi.setAccessToken(data.body["access_token"]);
        return data.body["access_token"];
    } catch (error) {
        console.error(
            "Error refreshing access token from Spotify:",
            error.message,
        );
        throw new Error("Failed to refresh access token");
    }
}

module.exports = {
    spotifyApi,
    getAccessToken,
    refreshAccessToken,
};
