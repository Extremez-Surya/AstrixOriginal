const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const { updateNowPlayingMessage } = require("../../lib/musicManager.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["resume", "r"],
  category: "Music",
  desc: "Resume paused playback.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message) {
    const player = client.manager.players.get(message.guild.id);
    if (!player || !player.queue.current) {
      return message.reply({
        content: "❌ There is no track currently playing.",
      });
    }

    if (!player.shoukaku.paused) {
      return message.reply({ content: "⚠️ Playback is already active." });
    }

    await player.pause(false);
    await updateNowPlayingMessage(client, player, false);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ▶️ Playback Resumed\n` +
          `-# *Track playback resumed by <@${message.author.id}>.*`,
      ),
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
