const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const { updateNowPlayingMessage } = require("../../lib/musicManager.js");

module.exports = {
  name: "pause",
  description: "Pause playback.",

  async execute(client, interaction) {
    const player = client.manager.players.get(interaction.guild.id);
    if (!player || !player.queue.current) {
      return interaction.reply({ content: "❌ There is no track currently playing.", flags: MessageFlags.Ephemeral });
    }

    if (player.shoukaku.paused) {
      return interaction.reply({ content: "⚠️ Playback is already paused. Use `/resume` to continue.", flags: MessageFlags.Ephemeral });
    }

    await player.pause(true);
    await updateNowPlayingMessage(client, player, true);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ⏸️ Playback Paused\n` +
          `-# *Track playback paused by <@${interaction.user.id}>.*`
      )
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
