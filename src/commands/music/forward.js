const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["forward", "fastforward"],
  category: "Music",
  desc: "Fast forward the current playing track by specified seconds.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const player = client.manager.players.get(message.guild.id);
    if (!player || !player.queue.current) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "❌ **There is no track currently playing.**",
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    let seconds = 10;
    if (args[0]) {
      const parsed = parseInt(args[0], 10);
      if (!isNaN(parsed) && parsed > 0) seconds = parsed;
    }

    const currentTrack = player.queue.current;
    const currentPosition = player.position || 0;
    const newPosition = currentPosition + seconds * 1000;

    if (newPosition >= currentTrack.length) {
      await player.skip();
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "⏭️ **Fast-forwarded beyond song duration. Skipped to next track.**",
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    await player.seek(newPosition);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `⏩ **Fast forwarded \`${seconds}s\` to \`${formatTime(newPosition)}\` / \`${formatTime(currentTrack.length)}\`**`,
      ),
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
