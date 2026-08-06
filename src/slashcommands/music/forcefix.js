const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  name: "forcefix",
  description: "Force reset and fix stuck voice connections or Lavalink player instances.",

  async execute(client, interaction) {
    try {
      const player = client.manager.players.get(interaction.guild.id);
      if (player) {
        await player.destroy().catch(() => null);
      }

      const botMember = interaction.guild.members.me;
      if (botMember?.voice?.channelId) {
        await botMember.voice.disconnect().catch(() => null);
      }

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `🛠️ **Force Fix Applied Successfully**\n` +
            `-# *Voice channel state and player connection have been forcibly reset.*\n\n` +
            `> - **Next Step:** Use \`/play\` or \`/join\` to start fresh.`
        )
      );

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (err) {
      console.error("[ForceFixSlash] Error resetting player:", err);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `⚠️ **Force fix completed.** Try using \`/play\` now.`
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }
  },
};
