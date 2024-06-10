const { Client, GatewayIntentBits } = require('discord.js');
const { playYouTube } = require('./commands/playYouTube');
const { playSpotify } = require('./commands/playSpotify');
const { play, skip, stop, pause, resume, status, listSongs } = require('./commands/playerControl');
const { help } = require('./commands/help');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const queue = new Map();

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    const args = message.content.split(' ');
    const command = args.shift().toLowerCase();

    const serverQueue = queue.get(message.guild.id);

    if (command === '!playyt') {
        await playYouTube(message, serverQueue, args, queue);
    } else if (command === '!playsp') {
        await playSpotify(message, serverQueue, args, queue);
    } else if (command === '!skip') {
        skip(message, serverQueue);
    } else if (command === '!stop') {
        stop(message, serverQueue, queue);
    } else if (command === '!pause') {
        pause(message, serverQueue);
    } else if (command === '!resume') {
        resume(message, serverQueue);
    } else if (command === '!status') {
        status(message);
    } else if (command === '!list') {
        listSongs(message, serverQueue);
    } else if (command === '!help') {
        help(message);
    }
});

client.login(process.env.TOKEN);
