const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const levelingManager = require("../../lib/levelingManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["addxp", "givexp"],
  category: "Leveling",
  desc: "Grant bonus XP to a member.",
  botPermissions: ["SendMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser = message.mentions.users.first();
    const amount = parseInt(args[1], 10);

    if (!targetUser || isNaN(amount) || amount <= 0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ➕ Add XP\n` +
          `-# *Grant experience points to a target member.*\n\n` +
          `> - **Usage:** \`.addxp @user <amount>\``
        )
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const guildId = message.guild.id;
    const config = levelingManager.getGuildLeveling(guildId);
    const memberData = levelingManager.getMemberData(guildId, targetUser.id);

    const oldLevel = memberData.level;
    const result = levelingManager.addXp(config, memberData, amount);
    levelingManager.setMemberData(guildId, targetUser.id, memberData);

    const targetMember = await message.guild.members.fetch(targetUser.id).catch(() => null);
    if (result.leveledUp && targetMember) {
      await levelingManager.applyRewards(client, guildId, memberData, targetMember);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.success || "✅"} XP Granted\n` +
        `-# *Member experience updated successfully.*\n\n` +
        `> - **Target:** ${targetUser}\n` +
        `> - **XP Added:** \`+${amount.toLocaleString()} XP\`\n` +
        `> - **Current Level:** \`${memberData.level}\`${result.leveledUp ? ` *(Leveled up from ${oldLevel}!)*` : ""}`
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
