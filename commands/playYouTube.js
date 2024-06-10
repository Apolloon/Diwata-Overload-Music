const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const ytpl = require('ytpl');
const { PermissionsBitField } = require('discord.js');
const { play } = require('./playerControl');

async function playYouTube(message, serverQueue, args, queue) {
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

    let songs = [];

    try {
        if (ytpl.validateID(query)) {
            const playlist = await ytpl(query);
            songs = playlist.items.map(item => ({
                title: item.title,
                url: item.shortUrl,
            }));
        } else if (ytdl.validateURL(query)) {
            const info = await ytdl.getInfo(query);
            songs.push({
                title: info.videoDetails.title,
                url: info.videoDetails.video_url,
            });
        } else {
            const videoResult = await ytSearch(query);
            const video = videoResult.videos.length > 0 ? videoResult.videos[0] : null;

            if (!video) {
                return message.channel.send('No results found.');
            }

            songs.push({
                title: video.title,
                url: video.url,
            });
        }

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
            queueContruct.songs.push(...songs);

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
            serverQueue.songs.push(...songs);
            if (serverQueue.player.state.status === AudioPlayerStatus.Idle) {
                play(message.guild, serverQueue.songs[0], queue);
            }
            return message.channel.send(`${songs.length} songs have been added to the queue!`);
        }
    } catch (error) {
        console.error('Error executing command:', error.message);
        message.channel.send(`An error occurred: ${error.message}`);
    }
}

module.exports = { playYouTube };
