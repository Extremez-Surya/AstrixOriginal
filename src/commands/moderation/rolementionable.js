const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["rolementionable", "mentionablerole", "rmentionable"],
  category: "Moderation",
  desc: "Toggle whether anyone can mention a specific server role.",
  botPermissions: ["ManageRoles", "SendMessages"],
  userPermissions: ["ManageRoles"],
  devOnly: false,

  async execute(client, message, args) {
    const role = message.mentions.roles.first() || (args[0] ? message.guild.roles.cache.get(args[0]) || message.guild.roles.cache.find((r) => r.name.toLowerCase() === args[0].toLowerCase()) : null);

    if (!role) {
      return message.reply("Usage: `.rolementionable @role`");
    }

    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply("❌ That role is equal or higher than the bot's highest role.");
    }

    if (role.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
      return message.reply("❌ You cannot modify a role higher or equal to your own highest role.");
    }

    try {
      const newMentionable = !role.mentionable;
      const updated = await role.setMentionable(newMentionable, `Mentionable toggled by ${message.author.tag}`);

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 📣 **Role Mentionable Updated** ── ${updated.name}\n` +
          `-# *Mentionability setting updated*\n\n` +
          `> - **Role:** ${updated}\n` +
          `> - **Mentionable:** \`${newMentionable ? "YES (Anyone Can Mention)" : "NO (Protected)"}\`\n` +
          `> - **Moderator:** <@${message.author.id}>`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      return message.reply(`❌ Failed to update role mentionability: \`${err.message}\``);
    }
  },
};
