const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["rolehoist", "hoistrole", "rhoist"],
  category: "Moderation",
  desc: "Toggle whether a role is displayed separately in the server member list.",
  botPermissions: ["ManageRoles", "SendMessages"],
  userPermissions: ["ManageRoles"],
  devOnly: false,

  async execute(client, message, args) {
    const role = message.mentions.roles.first() || (args[0] ? message.guild.roles.cache.get(args[0]) || message.guild.roles.cache.find((r) => r.name.toLowerCase() === args[0].toLowerCase()) : null);

    if (!role) {
      return message.reply("Usage: `.rolehoist @role`");
    }

    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply("❌ That role is equal or higher than the bot's highest role.");
    }

    if (role.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
      return message.reply("❌ You cannot modify a role higher or equal to your own highest role.");
    }

    try {
      const newHoist = !role.hoist;
      const updated = await role.setHoist(newHoist, `Hoist toggled by ${message.author.tag}`);

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 📌 **Role Hoist Updated** ── ${updated.name}\n` +
          `-# *Display separately in member list toggled*\n\n` +
          `> - **Role:** ${updated}\n` +
          `> - **Hoisted:** \`${newHoist ? "YES (Displayed Separately)" : "NO (Merged)"}\`\n` +
          `> - **Moderator:** <@${message.author.id}>`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      return message.reply(`❌ Failed to update role hoist: \`${err.message}\``);
    }
  },
};
