const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["customroledelete", "crdelete", "crdel"],
  category: "Utility",
  desc: "Delete a custom vanity role.",
  botPermissions: ["ManageRoles"],
  userPermissions: ["ManageRoles"],
  devOnly: false,

  async execute(client, message, args) {
    const role = message.mentions.roles.first() || (args[0] ? message.guild.roles.cache.get(args[0]) : null);
    if (!role) return message.reply("Specify role to delete: `.crdel @Role`");

    await role.delete().catch(() => null);
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🎨 Custom Role Deleted\n> - **Deleted Role:** \`${role.name}\``)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
