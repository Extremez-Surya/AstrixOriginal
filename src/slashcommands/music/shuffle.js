const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const { updateNowPlayingMessage } = require("../../lib/musicManager.js");

module.exports = {
  name: "shuffle",
  description: "Randomize the queued tracks.",

  async execute(client, interaction) {
    const player = client.manager.players.get(interaction.guild.id);
    if (!player || player.queue.length <= 1) {
      return interaction.reply({ content: "⚠️ Queue must have at least 2 tracks to shuffle.", flags: MessageFlags.Ephemeral });
    }

    player.queue.shuffle();
    await updateNowPlayingMessage(client, player);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🔀 Queue Shuffled\n` +
          `-# *Shuffled \`${player.queue.length}\` queued tracks.*`
      )
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
