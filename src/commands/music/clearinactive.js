const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["clearinactive", "ci", "cleaninactive"],
  category: "Music",
  desc: "Disconnect inactive music players or clear empty voice channel connections.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message) {
    const player = client.manager.players.get(message.guild.id);
    const botVoiceState = message.guild.members.me?.voice;

    if (!player && (!botVoiceState || !botVoiceState.channelId)) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "❌ **There is no active music player or voice connection in this server.**",
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const channelId = player?.voiceId || botVoiceState?.channelId;
    const channel = message.guild.channels.cache.get(channelId);

    if (channel) {
      const humanMembers = channel.members.filter((m) => !m.user.bot);
      if (humanMembers.size > 0 && player?.queue?.current && !player.shoukaku?.paused) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `⚠️ **Voice channel <#${channel.id}> is currently active with ${humanMembers.size} listener(s).**\n` +
              `-# *Use \`${client.prefix || "."}stop\` or \`${client.prefix || "."}leave\` if you want to end the session.*`,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
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
          `-# *Disconnected voice player and cleaned up inactive session resources.*`,
      ),
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
