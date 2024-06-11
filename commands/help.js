function help(message) {
  const helpMessage = `
**Music Bot Commands:**
- \`!playyt [song name or URL]\`: Plays music from YouTube. Accepts both song names and direct URLs.
- \`!playytm [song name or URL]\`: Plays music from YouTube Music. Accepts both song names and direct URLs.
- \`!playsp [song name or URL]\`: Plays music from Spotify. Accepts both song names and direct URLs.
- \`!skip\`: Skips the currently playing song.
- \`!stop\`: Stops the music and clears the queue.
- \`!pause\`: Pauses the currently playing song.
- \`!resume\`: Resumes the paused song.
- \`!status\`: Checks if the bot is running and ready to play songs.
- \`!list\`: Lists all songs currently in the queue.
- \`!help\`: Shows all commands and their uses.
`;

  message.channel.send(helpMessage);
}

module.exports = { help };
