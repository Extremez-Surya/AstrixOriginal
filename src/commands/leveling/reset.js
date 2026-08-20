const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const levelingManager = require("../../lib/levelingManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["resetleveling", "resetlevel", "resetxp"],
  category: "Leveling",
  desc: "Reset leveling data for a member or the entire server.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser = message.mentions.users.first();
    const guildId = message.guild.id;

    if (targetUser) {
      levelingManager.resetLevelingData(guildId, targetUser.id);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.success || "✅"} Member Data Reset\n` +
          `-# *Leveling data cleared for target member.*\n\n` +
          `> - **User:** ${targetUser}`
        )
      );
      return message
        .reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        })
        .catch(() => null);
    }

    if (args[0]?.toLowerCase() === "all" || args[0]?.toLowerCase() === "server") {
      levelingManager.resetLevelingData(guildId);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.success || "✅"} Server Leveling Reset\n` +
          `-# *All leveling configs and XP progress for this server have been reset.*`
        )
      );
      return message
        .reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        })
        .catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ⚠️ Leveling Reset Help\n` +
        `-# *Clear leveling records for a member or the server.*\n\n` +
        `> - **Reset Member:** \`.resetleveling @user\`\n` +
        `> - **Reset Server:** \`.resetleveling server\``
      )
    );

    return message
      .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
      .catch(() => null);
  },
};
