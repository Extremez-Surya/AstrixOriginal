const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["customrolecreate", "crcreate", "cr-create"],
  category: "Utility",
  desc: "Create a new custom vanity role.",
  botPermissions: ["ManageRoles"],
  userPermissions: ["ManageRoles"],
  devOnly: false,

  async execute(client, message, args) {
    const name = args.join(" ");
    if (!name) return message.reply("Please specify role name: `.crcreate Custom VIP`");

    const role = await message.guild.roles.create({ name }).catch(() => null);
    if (!role) return message.reply("Failed to create role.");

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🎨 Custom Role Created\n> - **Role:** ${role} (\`${role.id}\`)`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
