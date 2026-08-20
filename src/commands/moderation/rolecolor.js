const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["rolecolor", "setrolecolor", "rcolor"],
  category: "Moderation",
  desc: "Set the hex color for a server role.",
  botPermissions: ["ManageRoles", "SendMessages"],
  userPermissions: ["ManageRoles"],
  devOnly: false,

  async execute(client, message, args) {
    const role = message.mentions.roles.first() || (args[0] ? message.guild.roles.cache.get(args[0]) || message.guild.roles.cache.find((r) => r.name.toLowerCase() === args[0].toLowerCase()) : null);
    const hexInput = message.mentions.roles.first() ? args[1] : args[1] || args[0];

    if (!role || !hexInput) {
      return message.reply("Usage: `.rolecolor @role <#HexCode | default>`");
    }

    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply("❌ That role is equal or higher than the bot's highest role.");
    }

    if (role.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
      return message.reply("❌ You cannot modify a role higher or equal to your own highest role.");
    }

    const cleanHex = hexInput.toLowerCase() === "default" ? null : hexInput.replace("#", "");

    try {
      const updated = await role.setColor(cleanHex ? `#${cleanHex}` : null, `Color changed by ${message.author.tag}`);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🎨 **Role Color Updated** ── ${updated.name}\n` +
          `-# *Role visual appearance updated successfully*\n\n` +
          `> - **Role:** ${updated}\n` +
          `> - **New Color:** \`${cleanHex ? `#${cleanHex.toUpperCase()}` : "Default (None)"}\`\n` +
          `> - **Moderator:** <@${message.author.id}>`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      return message.reply(`❌ Failed to set role color: \`${err.message}\``);
    }
  },
};
