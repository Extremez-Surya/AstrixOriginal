const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  name: "previous",
  description: "Play the previous track.",

  async execute(client, interaction) {
    const player = client.manager.players.get(interaction.guild.id);
    if (!player) {
      return interaction.reply({ content: "❌ No music player running in this server.", flags: MessageFlags.Ephemeral });
    }

    const lastTrack = player.data?.get("lastTrack");
    if (!lastTrack) {
      return interaction.reply({ content: "❌ No previous track stored in memory.", flags: MessageFlags.Ephemeral });
    }

    player.queue.unshift(lastTrack);
    await player.skip();

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ⏮️ Playing Previous Track\n` +
          `> - **Track:** [${lastTrack.title}](${lastTrack.uri})`
      )
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
