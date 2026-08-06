const { ApplicationCommandOptionType, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const { updateNowPlayingMessage } = require("../../lib/musicManager.js");

module.exports = {
  name: "seek",
  description: "Seek to a specific timestamp in seconds.",
  options: [
    {
      name: "seconds",
      description: "Target position in seconds",
      type: ApplicationCommandOptionType.Integer,
      required: true,
      min_value: 0,
    },
  ],

  async execute(client, interaction) {
    const player = client.manager.players.get(interaction.guild.id);
    if (!player || !player.queue.current) {
      return interaction.reply({ content: "❌ There is no track currently playing.", flags: MessageFlags.Ephemeral });
    }

    const seconds = interaction.options.getInteger("seconds");
    const targetMs = seconds * 1000;

    if (targetMs > player.queue.current.length) {
      return interaction.reply({ content: "⚠️ Timestamp exceeds track duration.", flags: MessageFlags.Ephemeral });
    }

    await player.seek(targetMs);
    await updateNowPlayingMessage(client, player);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ⏩ Playback Seeked\n` +
          `> - **Jumped To:** \`${seconds} seconds\``
      )
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
