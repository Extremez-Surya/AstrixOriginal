const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const welcomeManager = require("../../lib/welcomeManager");

module.exports = {
  alias: ["autoroleset", "setautorole", "joinroleset"],
  category: "Utility",
  desc: "Set the role automatically assigned to joining members.",
  botPermissions: ["ManageRoles"],
  userPermissions: ["ManageRoles"],
  devOnly: false,

  async execute(client, message, args) {
    const role = message.mentions.roles.first() || (args[0] ? message.guild.roles.cache.get(args[0]) : null);
    if (!role) return message.reply("Please mention a role: `.autoroleset @Member`");

    welcomeManager.updateGuildWelcome(message.guild.id, {
      autoRoleId: role.id,
    });

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🔧 Auto-Role Saved\n` +
        `-# *New members will automatically receive ${role.name} on join.*\n\n` +
        `> - **Assigned Role:** ${role} (\`${role.id}\`)`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
