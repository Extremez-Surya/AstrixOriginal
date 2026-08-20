const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const moderationManager = require("../../lib/moderationManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["temprole", "trole", "temporaryrole"],
  category: "Moderation",
  desc: "Assign a role to a member with an automated expiration timer.",
  botPermissions: ["ManageRoles", "SendMessages"],
  userPermissions: ["ManageRoles"],
  devOnly: false,

  async execute(client, message, args) {
    const targetMember = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    const targetRole = message.mentions.roles.first() || (args[1] ? message.guild.roles.cache.get(args[1]) || message.guild.roles.cache.find((r) => r.name.toLowerCase() === args[1].toLowerCase()) : null);
    const durationStr = args[2];

    if (!targetMember || !targetRole || !durationStr) {
      return message.reply("Usage: `.temprole @user @role <duration: 10m|1h|7d>`");
    }

    if (targetRole.position >= message.guild.members.me.roles.highest.position) {
      return message.reply("❌ That role is equal or higher than the bot's highest role.");
    }

    if (targetRole.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
      return message.reply("❌ You cannot assign a role higher or equal to your own highest role.");
    }

    const durationMs = moderationManager.parseDuration(durationStr);
    if (!durationMs || durationMs < 10000) {
      return message.reply("❌ Invalid duration. Use e.g. `10m`, `1h`, `1d`, `7d` (min 10s).");
    }

    try {
      await targetMember.roles.add(targetRole.id, `Temprole: ${durationStr} by ${message.author.tag}`);
      const expiresAt = Date.now() + durationMs;
      moderationManager.addTemprole(client, message.guild.id, targetMember.id, targetRole.id, expiresAt);

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ⏳ **Temporary Role Assigned**\n` +
          `-# *Role will be automatically removed upon expiration*\n\n` +
          `> - **Target:** \`${targetMember.user.username}\`\n` +
          `> - **Role:** ${targetRole} (\`${targetRole.name}\`)\n` +
          `> - **Duration:** \`${durationStr}\` (Expires <t:${Math.floor(expiresAt / 1000)}:R>)\n` +
          `> - **Moderator:** <@${message.author.id}>`
        )
      );

      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      return message.reply(`❌ Failed to assign temprole: \`${err.message}\``);
    }
  },
};
