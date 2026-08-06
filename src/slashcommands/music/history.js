const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  name: "history",
  description: "Display recent playback history for this server.",

  async execute(client, interaction) {
    const player = client.manager.players.get(interaction.guild.id);
    if (!player) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "❌ **There is no active music player running.**"
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const previousTrack = player.data?.get("lastTrack");
    const currentTrack = player.queue.current;

    let content = `### 📜 Server Audio History\n`;

    if (currentTrack) {
      content += `> - **Now Playing:** [${currentTrack.title}](${currentTrack.uri}) - \`${currentTrack.author}\`\n\n`;
    }

    if (previousTrack) {
      content += `> - **Previously Played:** [${previousTrack.title}](${previousTrack.uri}) - \`${previousTrack.author}\``;
    } else {
      content += `-# *No previous tracks recorded in history yet.*`;
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(content)
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
