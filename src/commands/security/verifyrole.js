const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["verifyrole", "verify-role", "setverifyrole"],
  category: "Security",
  desc: "Set the role awarded to verified members.",
  botPermissions: ["ManageRoles"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const role = message.mentions.roles.first() || (args[0] ? message.guild.roles.cache.get(args[0]) : null);
    if (!role) return message.reply("Please mention a role: `.verifyrole @Verified`");

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ✅ Verified Role Set\n` +
        `-# *Role assigned upon verification completion.*\n\n` +
        `> - **Role:** ${role} (\`${role.id}\`)`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
