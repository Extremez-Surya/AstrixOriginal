const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  name: "clear",
  description: "Clear all queued tracks from the music player.",

  async execute(client, interaction) {
    const player = client.manager.players.get(interaction.guild.id);
    if (!player || !player.queue.current) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent("❌ **There is no active music player running.**")
      );
      return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }

    if (player.queue.length === 0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent("⚠️ **The queue is already empty.**")
      );
      return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }

    const count = player.queue.length;
    player.queue.clear();

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`🗑️ **Cleared \`${count}\` track(s) from the server queue.**`)
    );

    return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
