const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["previous", "prev"],
  category: "Music",
  desc: "Play the previous track.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message) {
    const player = client.manager.players.get(message.guild.id);
    if (!player) {
      return message.reply({
        content: "❌ No music player running in this server.",
      });
    }

    const lastTrack = player.data?.get("lastTrack");
    if (!lastTrack) {
      return message.reply({
        content: "❌ No previous track stored in memory.",
      });
    }

    player.queue.unshift(lastTrack);
    await player.skip();

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ⏮️ Playing Previous Track\n` +
          `> - **Track:** [${lastTrack.title}](${lastTrack.uri})`,
      ),
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
