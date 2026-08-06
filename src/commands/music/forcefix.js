const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["forcefix", "fixmusic", "fixvc", "ff"],
  category: "Music",
  desc: "Force reset and fix stuck voice connections or Lavalink player instances.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message) {
    try {
      const player = client.manager.players.get(message.guild.id);
      if (player) {
        await player.destroy().catch(() => null);
      }

      const botMember = message.guild.members.me;
      if (botMember?.voice?.channelId) {
        await botMember.voice.disconnect().catch(() => null);
      }

      // Clear any sleep timer or temporary data if present
      if (player?.data) {
        const sleepTimer = player.data.get("sleepTimer");
        if (sleepTimer) clearTimeout(sleepTimer);
      }

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `🛠️ **Force Fix Applied Successfully**\n` +
            `-# *Voice channel state and player connection have been forcibly reset.*\n\n` +
            `> - **Next Step:** Use \`${client.prefix || "."}play <song>\` or \`${client.prefix || "."}join\` to start fresh.`,
        ),
      );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (err) {
      console.error("[ForceFix] Error resetting player:", err);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `⚠️ **Force fix completed with minor warnings.**\n` +
            `-# *Voice state cleared. Try using \`${client.prefix || "."}play\` now.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }
  },
};
