const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const levelingManager = require("../../lib/levelingManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["removexp", "takexp", "delxp"],
  category: "Leveling",
  desc: "Remove experience points from a member.",
  botPermissions: ["SendMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser = message.mentions.users.first();
    const amount = parseInt(args[1], 10);

    if (!targetUser || isNaN(amount) || amount <= 0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ➖ Remove XP\n` +
          `-# *Deduct experience points from a member.*\n\n` +
          `> - **Usage:** \`.removexp @user <amount>\``
        )
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const guildId = message.guild.id;
    const memberData = levelingManager.getMemberData(guildId, targetUser.id);

    memberData.totalXp = Math.max(0, memberData.totalXp - amount);
    memberData.xp = Math.max(0, memberData.xp - amount);

    // Recalculate level if XP drops below level threshold
    while (memberData.level > 0 && memberData.xp < 0) {
      memberData.level -= 1;
      const prevNeeded = levelingManager.xpToNextLevel(memberData.level);
      memberData.xp += prevNeeded;
    }

    levelingManager.setMemberData(guildId, targetUser.id, memberData);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.success || "✅"} XP Removed\n` +
        `-# *Member experience deducted.*\n\n` +
        `> - **Target:** ${targetUser}\n` +
        `> - **XP Deducted:** \`-${amount.toLocaleString()} XP\`\n` +
        `> - **Current Level:** \`${memberData.level}\``
      )
    );

    return message
      .reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      })
      .catch(() => null);
  },
};
