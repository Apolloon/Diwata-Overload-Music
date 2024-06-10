const { AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');

async function play(guild, song, queue) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
        serverQueue.timeout = setTimeout(() => {
            if (serverQueue.connection && serverQueue.connection.state.status !== VoiceConnectionStatus.Destroyed) {
                serverQueue.connection.destroy();
                queue.delete(guild.id);
                serverQueue.textChannel.send('Leaving the voice channel due to inactivity.');
            }
        }, 60000); // 1 minute delay before leaving
        return;
    }

    try {
        const stream = ytdl(song.url, { filter: 'audioonly' });
        const resource = createAudioResource(stream);

        serverQueue.player.play(resource);
        serverQueue.textChannel.send(`Start playing: **${song.title}**`);

        serverQueue.player.on(AudioPlayerStatus.Idle, () => {
            serverQueue.songs.shift();
            if (serverQueue.songs.length > 0) {
                play(guild, serverQueue.songs[0], queue);
            } else {
                serverQueue.textChannel.send('No more songs in queue.');
                serverQueue.timeout = setTimeout(() => {
                    if (serverQueue.connection && serverQueue.connection.state.status !== VoiceConnectionStatus.Destroyed) {
                        serverQueue.connection.destroy();
                        queue.delete(guild.id);
                        serverQueue.textChannel.send('Leaving the voice channel due to inactivity.');
                    }
                }, 60000); // 1 minute delay before leaving
            }
        });

        serverQueue.player.on('error', error => {
            console.error('Error:', error.message);
            serverQueue.songs.shift();
            if (serverQueue.songs.length > 0) {
                play(guild, serverQueue.songs[0], queue);
            } else {
                serverQueue.textChannel.send('An error occurred while playing the song.');
                serverQueue.timeout = setTimeout(() => {
                    if (serverQueue.connection && serverQueue.connection.state.status !== VoiceConnectionStatus.Destroyed) {
                        serverQueue.connection.destroy();
                        queue.delete(guild.id);
                        serverQueue.textChannel.send('Leaving the voice channel due to inactivity.');
                    }
                }, 60000); // 1 minute delay before leaving
            }
        });
    } catch (error) {
        console.error('Error playing song:', error.message);
        serverQueue.textChannel.send(`An error occurred while trying to play the song: ${error.message}`);
        serverQueue.songs.shift();
        if (serverQueue.songs.length > 0) {
            play(guild, serverQueue.songs[0], queue);
        } else {
            serverQueue.timeout = setTimeout(() => {
                if (serverQueue.connection && serverQueue.connection.state.status !== VoiceConnectionStatus.Destroyed) {
                    serverQueue.connection.destroy();
                    queue.delete(guild.id);
                    serverQueue.textChannel.send('Leaving the voice channel due to inactivity.');
                }
            }, 60000); // 1 minute delay before leaving
        }
    }
}

module.exports = { play };
