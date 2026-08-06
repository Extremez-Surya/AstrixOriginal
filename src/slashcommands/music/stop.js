const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  name: "stop",
  description: "Stop playback, clear queue, and leave voice channel.",

  async execute(client, interaction) {
    const player = client.manager.players.get(interaction.guild.id);
    if (!player) {
      return interaction.reply({ content: "❌ No music player active in this server.", flags: MessageFlags.Ephemeral });
    }

    player.queue.clear();
    await player.destroy().catch(() => null);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ⏹️ Playback Stopped\n` +
          `-# *Cleared queue and disconnected from voice channel.*`
      )
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
