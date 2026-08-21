const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["stop", "stopplay", "halt"],
  category: "Music",
  desc: "Stop playback, clear queue, and leave voice channel.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message) {
    const player = client.manager.players.get(message.guild.id);
    if (!player) {
      return message.reply({
        content: "❌ No music player active in this server.",
      });
    }

    player.queue.clear();
    await player.destroy().catch(() => null);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ⏹️ Playback Stopped\n` +
          `-# *Cleared queue and disconnected from voice channel.*`,
      ),
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
