const { createAudioPlayer, createAudioResource, AudioPlayerStatus, joinVoiceChannel } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const prism = require('prism-media');

function play(guild, song, queue) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const stream = ytdl(song.url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25, // Increase buffer size if needed
    });

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

module.exports = { play };
