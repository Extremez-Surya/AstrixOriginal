const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["vanityroles", "vanityrole", "vanity"],
  category: "Booster",
  desc: "Automatically assign roles to members who include server vanity URL in their custom status.",
  botPermissions: ["ManageRoles"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const role = message.mentions.roles.first();
    const vanityString = args[1];

    if (!role || !vanityString) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ✨ Vanity Status Role Setup\n` +
          `-# *Reward members who support your server by adding your invite link to their status.*\n\n` +
          `> - **Usage:** \`.vanityrole @Role .gg/yourvanity\`\n` +
          `> - **Usage:** \`.vanityrole status\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ✨ Vanity Status Role Configured\n` +
        `-# *Members with \`${vanityString}\` in status will receive ${role.name}.*\n\n` +
        `> - **Role:** ${role} (\`${role.id}\`)\n` +
        `> - **Vanity String:** \`${vanityString}\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
