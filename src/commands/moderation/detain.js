const {
  ContainerBuilder,
  TextDisplayBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} = require("discord.js");
const moderationManager = require("../../lib/moderationManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["detain", "quarantine", "isolate"],
  category: "Moderation",
  desc: "Isolate and quarantine a member, removing their roles and locking them into detention.",
  botPermissions: ["ManageRoles", "ManageChannels", "SendMessages"],
  userPermissions: ["ModerateMembers", "ManageRoles"],
  devOnly: false,

  async execute(client, message, args) {
    const targetMember = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    const reason = args.slice(1).join(" ") || "Detained by moderator";

    if (!targetMember) {
      return message.reply("Usage: `.detain @user [reason]`");
    }

    const check = moderationManager.canModerate(message.member, targetMember, message.guild.members.me);
    if (!check.allowed) {
      return message.reply(`❌ Action Denied: ${check.reason}`);
    }

    // 1. Get or Create Detain Role
    let detainRole = message.guild.roles.cache.find((r) => r.name.toLowerCase() === "detained");
    if (!detainRole) {
      try {
        detainRole = await message.guild.roles.create({
          name: "Detained",
          color: 0x808080,
          reason: "Created automatic Detained role for quarantine isolation",
        });
      } catch (e) {
        return message.reply("❌ Failed to create Detained role. Ensure bot has Manage Roles permission.");
      }
    }

    // 2. Save previous roles (excluding @everyone and managed roles)
    const prevRoleIds = targetMember.roles.cache
      .filter((r) => r.id !== message.guild.id && !r.managed)
      .map((r) => r.id);

    moderationManager.detainMember(message.guild.id, targetMember.id, prevRoleIds, reason, message.author.id);

    // 3. Strip previous roles and assign Detained role
    try {
      if (prevRoleIds.length > 0) {
        await targetMember.roles.remove(prevRoleIds, "Quarantine isolation (Detain)").catch(() => null);
      }
      await targetMember.roles.add(detainRole.id, `Detained by ${message.author.tag}`).catch(() => null);
    } catch (e) {}

    const caseData = moderationManager.addCase(message.guild.id, {
      action: "DETAIN",
      targetId: targetMember.id,
      targetTag: targetMember.user.username,
      moderatorId: message.author.id,
      moderatorTag: message.author.username,
      reason,
    });

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🚨 **Member Detained & Quarantined**\n` +
        `-# *Case #${caseData.caseId} recorded*\n\n` +
        `> - **Target:** \`${targetMember.user.username}\` (\`${targetMember.id}\`)\n` +
        `> - **Roles Stripped:** \`${prevRoleIds.length}\` role(s) saved for auto-restore\n` +
        `> - **Reason:** \`${reason}\`\n` +
        `> - **Moderator:** <@${message.author.id}>\n\n` +
        `-# *Tip: Use \`.release @user\` to restore previous roles.*`
      )
    );

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
