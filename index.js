const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
} = require("discord.js");
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
} = require("@discordjs/voice");
const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");
const ytpl = require("ytpl");
require("dotenv").config();

const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

// Keep-alive web server
app.get("/", (req, res) => {
    res.send("Bot is running!");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const queue = new Map();

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async (message) => {
    const args = message.content.split(" ");
    const command = args.shift().toLowerCase();

    const serverQueue = queue.get(message.guild.id);

    if (command === "!play") {
        await execute(message, serverQueue, args);
    } else if (command === "!skip") {
        skip(message, serverQueue);
    } else if (command === "!stop") {
        stop(message, serverQueue);
    } else if (command === "!pause") {
        pause(message, serverQueue);
    } else if (command === "!resume") {
        resume(message, serverQueue);
    } else if (command === "!playnow") {
        await playNow(message, serverQueue, args);
    }
});

async function execute(message, serverQueue, args) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
        return message.channel.send(
            "You need to be in a voice channel to play music!",
        );
    }

    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (
        !permissions.has(PermissionsBitField.Flags.Connect) ||
        !permissions.has(PermissionsBitField.Flags.Speak)
    ) {
        return message.channel.send(
            "I need the permissions to join and speak in your voice channel!",
        );
    }

    const query = args.join(" ");
    let songs = [];

    try {
        if (ytpl.validateID(query)) {
            const playlist = await ytpl(query);
            songs = playlist.items.map((item) => ({
                title: item.title,
                url: item.shortUrl,
            }));
        } else {
            const videoResult = await ytSearch(query);
            const video =
                videoResult.videos.length > 0 ? videoResult.videos[0] : null;

            if (!video) {
                return message.channel.send("No results found.");
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

                play(message.guild, queueContruct.songs[0]);
            } catch (err) {
                console.error(
                    "Error connecting to voice channel:",
                    err.message,
                );
                queue.delete(message.guild.id);
                return message.channel.send(
                    "There was an error connecting to the voice channel.",
                );
            }
        } else {
            serverQueue.songs.push(...songs);
            return message.channel.send(
                `${songs.length} songs have been added to the queue!`,
            );
        }
    } catch (error) {
        console.error("Error executing command:", error.message);
        message.channel.send(`An error occurred: ${error.message}`);
    }
}

function skip(message, serverQueue) {
    if (!message.member.voice.channel) {
        return message.channel.send(
            "You have to be in a voice channel to stop the music!",
        );
    }
    if (!serverQueue) {
        return message.channel.send("There is no song that I could skip!");
    }
    try {
        serverQueue.player.stop();
    } catch (error) {
        console.error("Error skipping song:", error.message);
        message.channel.send(`An error occurred: ${error.message}`);
    }
}

function stop(message, serverQueue) {
    if (!message.member.voice.channel) {
        return message.channel.send(
            "You have to be in a voice channel to stop the music!",
        );
    }
    if (!serverQueue) {
        return message.channel.send("There is no song that I could stop!");
    }
    try {
        serverQueue.songs = [];
        serverQueue.player.stop();
        serverQueue.connection.destroy();
        queue.delete(message.guild.id);
    } catch (error) {
        console.error("Error stopping song:", error.message);
        message.channel.send(`An error occurred: ${error.message}`);
    }
}

function pause(message, serverQueue) {
    if (!message.member.voice.channel) {
        return message.channel.send(
            "You have to be in a voice channel to pause the music!",
        );
    }
    if (!serverQueue) {
        return message.channel.send("There is no song that I could pause!");
    }
    try {
        serverQueue.player.pause();
    } catch (error) {
        console.error("Error pausing song:", error.message);
        message.channel.send(`An error occurred: ${error.message}`);
    }
}

function resume(message, serverQueue) {
    if (!message.member.voice.channel) {
        return message.channel.send(
            "You have to be in a voice channel to resume the music!",
        );
    }
    if (!serverQueue) {
        return message.channel.send("There is no song that I could resume!");
    }
    try {
        serverQueue.player.unpause();
    } catch (error) {
        console.error("Error resuming song:", error.message);
        message.channel.send(`An error occurred: ${error.message}`);
    }
}

async function playNow(message, serverQueue, args) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
        return message.channel.send(
            "You need to be in a voice channel to play music!",
        );
    }

    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (
        !permissions.has(PermissionsBitField.Flags.Connect) ||
        !permissions.has(PermissionsBitField.Flags.Speak)
    ) {
        return message.channel.send(
            "I need the permissions to join and speak in your voice channel!",
        );
    }

    const query = args.join(" ");

    try {
        const videoResult = await ytSearch(query);
        const video =
            videoResult.videos.length > 0 ? videoResult.videos[0] : null;

        if (!video) {
            return message.channel.send("No results found.");
        }

        const song = {
            title: video.title,
            url: video.url,
        };

        if (!serverQueue) {
            const queueContruct = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                player: createAudioPlayer(),
                songs: [],
                playing: true,
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

                play(message.guild, queueContruct.songs[0]);
            } catch (err) {
                console.error(
                    "Error connecting to voice channel:",
                    err.message,
                );
                queue.delete(message.guild.id);
                return message.channel.send(
                    "There was an error connecting to the voice channel.",
                );
            }
        } else {
            serverQueue.songs.unshift(song);
            serverQueue.player.stop();
            return message.channel.send(`Now playing: **${song.title}**`);
        }
    } catch (error) {
        console.error("Error executing command:", error.message);
        message.channel.send(`An error occurred: ${error.message}`);
    }
}

async function play(guild, song) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
        serverQueue.connection.destroy();
        queue.delete(guild.id);
        return;
    }

    try {
        const stream = ytdl(song.url, { filter: "audioonly" });
        const resource = createAudioResource(stream);

        serverQueue.player.play(resource);
        serverQueue.textChannel.send(`Start playing: **${song.title}**`);

        serverQueue.player.on(AudioPlayerStatus.Idle, () => {
            serverQueue.songs.shift();
            if (serverQueue.songs.length > 0) {
                play(guild, serverQueue.songs[0]);
            } else {
                serverQueue.textChannel.send("No more songs in queue.");
            }
        });

        serverQueue.player.on("error", (error) => {
            console.error("Error:", error.message);
            serverQueue.songs.shift();
            if (serverQueue.songs.length > 0) {
                play(guild, serverQueue.songs[0]);
            } else {
                serverQueue.textChannel.send(
                    "An error occurred while playing the song.",
                );
            }
        });
    } catch (error) {
        console.error("Error playing song:", error.message);
        serverQueue.textChannel.send(
            `An error occurred while trying to play the song: ${error.message}`,
        );
        serverQueue.songs.shift();
        if (serverQueue.songs.length > 0) {
            play(guild, serverQueue.songs[0]);
        }
    }
}

client.login(process.env.TOKEN);
