const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["autorole", "joinrole"],
  category: "Utility",
  desc: "Automatically assign roles to new members or bots when they join the server.",
  botPermissions: ["ManageRoles"],
  userPermissions: ["ManageRoles"],
  devOnly: false,

  async execute(client, message, args) {
    const role = message.mentions.roles.first() || (args[0] ? message.guild.roles.cache.get(args[0]) : null);

    if (!role) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔧 Auto-Role Configuration\n` +
          `-# *Automatically assign roles on member entry.*\n\n` +
          `> - **Usage:** \`.autorole @Role\` or \`.autorole reset\`\n` +
          `> - **Current Auto-Role:** \`None configured\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ✅ Auto-Role Updated\n` +
        `-# *New members will receive ${role.name} on join.*\n\n` +
        `> - **Role Assigned:** ${role} (\`${role.id}\`)`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
