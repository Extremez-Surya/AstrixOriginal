const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const levelingManager = require("../../lib/levelingManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["setxp"],
  category: "Leveling",
  desc: "Set exact experience points for a member.",
  botPermissions: ["SendMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser = message.mentions.users.first();
    const amount = parseInt(args[1], 10);

    if (!targetUser || isNaN(amount) || amount < 0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ⚙️ Set Member XP\n` +
          `-# *Set exact experience points for a target member.*\n\n` +
          `> - **Usage:** \`.setxp @user <amount>\``
        )
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const guildId = message.guild.id;
    const memberData = levelingManager.getMemberData(guildId, targetUser.id);

    memberData.xp = amount;
    memberData.totalXp = amount;
    memberData.level = 0;

    // Calculate level based on total XP
    while (true) {
      const needed = levelingManager.xpToNextLevel(memberData.level);
      if (memberData.xp < needed) break;
      memberData.xp -= needed;
      memberData.level += 1;
    }

    levelingManager.setMemberData(guildId, targetUser.id, memberData);

    const targetMember = await message.guild.members.fetch(targetUser.id).catch(() => null);
    if (targetMember) {
      await levelingManager.applyRewards(client, guildId, memberData, targetMember);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.success || "✅"} Member XP Set\n` +
        `-# *Member XP profile recalculated.*\n\n` +
        `> - **Target:** ${targetUser}\n` +
        `> - **New XP:** \`${amount.toLocaleString()} XP\`\n` +
        `> - **Calculated Level:** \`${memberData.level}\``
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
