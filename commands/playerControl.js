const { createAudioPlayer, createAudioResource, AudioPlayerStatus, joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const prism = require('prism-media');

function play(guild, song, queue) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.connection.destroy(); // Properly disconnect the bot
        queue.delete(guild.id);
        return;
    }

    const stream = ytdl(song.url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25,
    }).pipe(new prism.FFmpeg({
        args: [
            '-analyzeduration', '0',
            '-loglevel', '0',
            '-f', 's16le',
            '-ar', '48000',
            '-ac', '2',
        ],
    }));

    const resource = createAudioResource(stream, {
        inputType: stream.type,
    });

    serverQueue.player.play(resource);

    serverQueue.player.on(AudioPlayerStatus.Idle, () => {
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0], queue);
    });

    serverQueue.player.on('error', error => {
        console.error('Error:', error.message);
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0], queue);
    });

    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}

function skip(message, serverQueue) {
    if (!serverQueue) {
        return message.channel.send('There is no song to skip!');
    }
    serverQueue.player.stop();
}

function stop(message, serverQueue, queue) {
    if (!serverQueue) {
        return message.channel.send('There is no song to stop!');
    }
    serverQueue.songs = [];
    serverQueue.player.stop();
    serverQueue.connection.destroy();
    queue.delete(message.guild.id);
}

function pause(message, serverQueue) {
    if (!serverQueue || !serverQueue.player) {
        return message.channel.send('There is no song to pause!');
    }
    serverQueue.player.pause();
    message.channel.send('Paused the music.');
}

function resume(message, serverQueue) {
    if (!serverQueue || !serverQueue.player) {
        return message.channel.send('There is no song to resume!');
    }
    serverQueue.player.unpause();
    message.channel.send('Resumed the music.');
}

function status(message) {
    message.channel.send('Bot is running and ready to play songs.');
}

function listSongs(message, serverQueue) {
    if (!serverQueue || !serverQueue.songs.length) {
        return message.channel.send('No songs in the queue.');
    }

    let songList = 'Current queue:\n';
    serverQueue.songs.forEach((song, index) => {
        songList += `${index + 1}. ${song.title}\n`;
    });

    message.channel.send(songList);
}

module.exports = { play, skip, stop, pause, resume, status, listSongs };
