const {
  ContainerBuilder,
  TextDisplayBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["voidstaff", "stripstaff", "demotestaff"],
  category: "Moderation",
  desc: "Emergency remove all administrative and staff permission roles from a compromised member.",
  botPermissions: ["ManageRoles", "SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    if (message.author.id !== message.guild.ownerId) {
      return message.reply("❌ Only the Server Owner can execute emergency `.voidstaff`.");
    }

    const targetMember = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    if (!targetMember) {
      return message.reply("Usage: `.voidstaff @user`");
    }

    const dangerousPerms = [
      PermissionFlagsBits.Administrator,
      PermissionFlagsBits.BanMembers,
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.ManageGuild,
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageRoles,
      PermissionFlagsBits.ManageWebhooks,
    ];

    const staffRoles = targetMember.roles.cache.filter((r) => {
      if (r.id === message.guild.id || r.managed) return false;
      return dangerousPerms.some((perm) => r.permissions.has(perm));
    });

    if (staffRoles.size === 0) {
      return message.reply(`ℹ️ ${targetMember.user.username} does not hold any dangerous/administrative staff roles.`);
    }

    try {
      await targetMember.roles.remove(staffRoles, `Emergency voidstaff executed by server owner`);

      const roleNames = staffRoles.map((r) => `\`${r.name}\``).join(", ");
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🛡️ **Emergency Voidstaff Executed** ── ${targetMember.user.username}\n` +
          `-# *All administrative/moderation permissions stripped instantly.*\n\n` +
          `> - **Roles Stripped (${staffRoles.size}):** ${roleNames}\n` +
          `> - **Executed By:** Server Owner (<@${message.author.id}>)`
        )
      );

      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      return message.reply(`❌ Failed to strip staff roles: \`${err.message}\``);
    }
  },
};
