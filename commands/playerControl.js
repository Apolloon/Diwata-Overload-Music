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

function skip(message, serverQueue) {
    if (!message.member.voice.channel) {
        return message.channel.send('You have to be in a voice channel to stop the music!');
    }
    if (!serverQueue) {
        return message.channel.send('There is no song that I could skip!');
    }
    try {
        serverQueue.player.stop();
        serverQueue.textChannel.send('Skipping the current song.');
    } catch (error) {
        console.error('Error skipping song:', error.message);
        message.channel.send(`An error occurred: ${error.message}`);
    }
}

function stop(message, serverQueue) {
    if (!message.member.voice.channel) {
        return message.channel.send('You have to be in a voice channel to stop the music!');
    }
    if (!serverQueue) {
        return message.channel.send('There is no song that I could stop!');
    }
    try {
        clearTimeout(serverQueue.timeout);
        serverQueue.songs = [];
        serverQueue.player.stop();
        if (serverQueue.connection && serverQueue.connection.state.status !== VoiceConnectionStatus.Destroyed) {
            serverQueue.connection.destroy();
        }
        queue.delete(message.guild.id);
    } catch (error) {
        console.error('Error stopping song:', error.message);
        message.channel.send(`An error occurred: ${error.message}`);
    }
}

function pause(message, serverQueue) {
    if (!message.member.voice.channel) {
        return message.channel.send('You have to be in a voice channel to pause the music!');
    }
    if (!serverQueue) {
        return message.channel.send('There is no song that I could pause!');
    }
    try {
        serverQueue.player.pause();
    } catch (error) {
        console.error('Error pausing song:', error.message);
        message.channel.send(`An error occurred: ${error.message}`);
    }
}

function resume(message, serverQueue) {
    if (!message.member.voice.channel) {
        return message.channel.send('You have to be in a voice channel to resume the music!');
    }
    if (!serverQueue) {
        return message.channel.send('There is no song that I could resume!');
    }
    try {
        serverQueue.player.unpause();
    } catch (error) {
        console.error('Error resuming song:', error.message);
        message.channel.send(`An error occurred: ${error.message}`);
    }
}

function status(message) {
    message.channel.send('The bot is running and ready to play songs!');
}

function listSongs(message, serverQueue) {
    if (!serverQueue) {
        return message.channel.send('There are no songs in the queue.');
    }

    let songList = 'Current queue:\n';
    serverQueue.songs.forEach((song, index) => {
        songList += `${index + 1}. ${song.title}\n`;
    });

    message.channel.send(songList);
}

module.exports = { play, skip, stop, pause, resume, status, listSongs };
