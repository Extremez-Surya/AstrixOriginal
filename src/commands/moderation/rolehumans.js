const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["rolehumans", "rolehuman", "roleallhumans"],
  category: "Moderation",
  desc: "Mass assign or remove a role for all human members in the server.",
  botPermissions: ["ManageRoles", "SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const action = args[0]?.toLowerCase();
    const roleArg = args.slice(1).join(" ");
    const role = message.mentions.roles.first() || (roleArg ? message.guild.roles.cache.get(roleArg) || message.guild.roles.cache.find((r) => r.name.toLowerCase() === roleArg.toLowerCase()) : null);

    if (!role || (action !== "add" && action !== "remove")) {
      return message.reply("Usage: `.rolehumans <add|remove> @role`");
    }

    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply("❌ That role is equal or higher than the bot's highest role.");
    }

    if (role.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
      return message.reply("❌ You cannot manage a role higher or equal to your own highest role.");
    }

    const members = await message.guild.members.fetch();
    const humanMembers = members.filter((m) => !m.user.bot);

    const progressMsg = await message.reply(`⏳ Processing ${action.toUpperCase()} for \`${humanMembers.size}\` human members...`);

    let count = 0;
    for (const [, member] of humanMembers) {
      try {
        if (action === "add" && !member.roles.cache.has(role.id)) {
          await member.roles.add(role.id, `Rolehumans add by ${message.author.tag}`);
          count++;
        } else if (action === "remove" && member.roles.cache.has(role.id)) {
          await member.roles.remove(role.id, `Rolehumans remove by ${message.author.tag}`);
          count++;
        }
      } catch (e) {}
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.tick || "✅"} **Role Humans Operation Completed**\n` +
        `-# *Processed \`${humanMembers.size}\` total human members*\n\n` +
        `> - **Action:** \`${action.toUpperCase()}\`\n` +
        `> - **Role:** ${role} (\`${role.name}\`)\n` +
        `> - **Members Modified:** \`${count}\`\n` +
        `> - **Moderator:** <@${message.author.id}>`
      )
    );

    return progressMsg.edit({ content: null, components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
