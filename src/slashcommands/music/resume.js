const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const { updateNowPlayingMessage } = require("../../lib/musicManager.js");

module.exports = {
  name: "resume",
  description: "Resume paused playback.",

  async execute(client, interaction) {
    const player = client.manager.players.get(interaction.guild.id);
    if (!player || !player.queue.current) {
      return interaction.reply({ content: "❌ There is no track currently playing.", flags: MessageFlags.Ephemeral });
    }

    if (!player.shoukaku.paused) {
      return interaction.reply({ content: "⚠️ Playback is already active.", flags: MessageFlags.Ephemeral });
    }

    await player.pause(false);
    await updateNowPlayingMessage(client, player, false);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ▶️ Playback Resumed\n` +
          `-# *Track playback resumed by <@${interaction.user.id}>.*`
      )
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
