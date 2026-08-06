const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const { updateNowPlayingMessage } = require("../../lib/musicManager.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["shuffle", "shuff"],
  category: "Music",
  desc: "Randomize the queued tracks.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message) {
    const player = client.manager.players.get(message.guild.id);
    if (!player || player.queue.length <= 1) {
      return message.reply({
        content: "⚠️ Queue must have at least 2 tracks to shuffle.",
      });
    }

    player.queue.shuffle();
    await updateNowPlayingMessage(client, player);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🔀 Queue Shuffled\n` +
          `-# *Shuffled \`${player.queue.length}\` queued tracks.*`,
      ),
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
