const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  name: "clearinactive",
  description: "Disconnect inactive music players or clear empty voice channel connections.",

  async execute(client, interaction) {
    const player = client.manager.players.get(interaction.guild.id);
    const botVoiceState = interaction.guild.members.me?.voice;

    if (!player && (!botVoiceState || !botVoiceState.channelId)) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "❌ **There is no active music player or voice connection in this server.**"
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const channelId = player?.voiceId || botVoiceState?.channelId;
    const channel = interaction.guild.channels.cache.get(channelId);

    if (channel) {
      const humanMembers = channel.members.filter((m) => !m.user.bot);
      if (humanMembers.size > 0 && player?.queue?.current && !player.shoukaku?.paused) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `⚠️ **Voice channel <#${channel.id}> is currently active with ${humanMembers.size} listener(s).**`
          )
        );
        return interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }
    }

    if (player) {
      await player.destroy();
    }
    if (botVoiceState && botVoiceState.channelId) {
      await botVoiceState.disconnect().catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `🧹 **Cleared Inactive Player Session**\n` +
          `-# *Disconnected voice player and cleaned up inactive session resources.*`
      )
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
