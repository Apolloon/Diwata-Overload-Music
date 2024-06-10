function help(message) {
  const helpMessage = `
**Available Commands:**
- \`!playyt [query]\`: Plays music from YouTube based on the search query or playlist URL.
- \`!playytm [query]\`: Plays music from YouTube Music based on the search query or playlist URL.
- \`!playnowyt [query]\`: Immediately plays the specified song from YouTube, interrupting the current playback.
- \`!playnowytm [query]\`: Immediately plays the specified song from YouTube Music, interrupting the current playback.
- \`!playsp [query]\`: Plays music from Spotify based on the search query.
- \`!playnowsp [query]\`: Immediately plays the specified song from Spotify, interrupting the current playback.
- \`!skip\`: Skips the currently playing song.
- \`!stop\`: Stops the music and clears the queue.
- \`!pause\`: Pauses the currently playing song.
- \`!resume\`: Resumes a paused song.
- \`!status\`: Checks if the bot is running and ready to play songs.
- \`!list\`: Lists all the songs in the queue.
- \`!help\`: Shows this help message.
  `;
  message.channel.send(helpMessage);
}

module.exports = { help };
