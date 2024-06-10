const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const { PermissionsBitField } = require('discord.js');
const { play } = require('./playerControl');
const SpotifyWebApi = require('spotify-web-api-node');
require('dotenv').config();

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

// Retrieve an access token
spotifyApi.clientCredentialsGrant().then(
    data => {
        spotifyApi.setAccessToken(data.body['access_token']);
    },
    err => {
        console.error('Error retrieving access token from Spotify', err);
    }
);

async function playSpotify(message, serverQueue, args, queue) {
    const query = args.join(' ');
    if (!query) {
        return message.channel.send('Please provide a search query.');
    }

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
        return message.channel.send('You need to be in a voice channel to play music!');
    }

    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has(PermissionsBitField.Flags.Connect) || !permissions.has(PermissionsBitField.Flags.Speak)) {
        return message.channel.send('I need the permissions to join and speak in your voice channel!');
    }

    try {
        const data = await spotifyApi.searchTracks(query);
        const tracks = data.body.tracks.items;

        if (!tracks.length) {
            return message.channel.send('No results found.');
        }

        const song = {
            title: tracks[0].name,
            url: tracks[0].external_urls.spotify,
        };

        if (!serverQueue) {
            const queueContruct = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                player: createAudioPlayer(),
                songs: [],
                playing: true,
                timeout: null
            };

            queue.set(message.guild.id, queueContruct);
            queueContruct.songs.push(song);

            try {
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: message.guild.id,
                    adapterCreator: message.guild.voiceAdapterCreator,
                });

                queueContruct.connection = connection;
                connection.subscribe(queueContruct.player);

                play(message.guild, queueContruct.songs[0], queue);
            } catch (err) {
                console.error('Error connecting to voice channel:', err.message);
                queue.delete(message.guild.id);
                return message.channel.send('There was an error connecting to the voice channel.');
            }
        } else {
            clearTimeout(serverQueue.timeout);
            serverQueue.songs.push(song);
            if (serverQueue.player.state.status === AudioPlayerStatus.Idle) {
                play(message.guild, serverQueue.songs[0], queue);
            }
            return message.channel.send(`**${song.title}** has been added to the queue!`);
        }
    } catch (error) {
        console.error('Error executing Spotify command:', error.message);
        message.channel.send(`An error occurred: ${error.message}`);
    }
}

module.exports = { playSpotify };
