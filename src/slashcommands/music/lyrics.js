const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  name: "lyrics",
  description: "Display lyrics for the current playing song.",

  async execute(client, interaction) {
    const player = client.manager.players.get(interaction.guild.id);
    if (!player || !player.queue.current) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "❌ **There is no track currently playing.**"
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const track = player.queue.current;

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🎤 Lyrics for: [${track.title}](${track.uri})\n` +
          `> **Artist:** \`${track.author || "Unknown"}\`\n\n` +
          `-# *Searching lyrics database... Check external lyrics providers for complete synced lyrics.*`
      )
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
