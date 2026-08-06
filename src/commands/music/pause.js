const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const { updateNowPlayingMessage } = require("../../lib/musicManager.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["pause"],
  category: "Music",
  desc: "Pause playback.",

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

    if (player.shoukaku.paused) {
      return message.reply({
        content: "⚠️ Playback is already paused. Use `.resume` to continue.",
      });
    }

    await player.pause(true);
    await updateNowPlayingMessage(client, player, true);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ⏸️ Playback Paused\n` +
          `-# *Track playback paused by <@${message.author.id}>.*`,
      ),
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
