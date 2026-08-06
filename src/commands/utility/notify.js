const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["notify", "notification"],
  category: "Utility",
  desc: "Subscribe or unsubscribe from server notification ping roles.",
  botPermissions: ["ManageRoles"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🔔 Notification Roles\n` +
        `-# *Toggle announcement & update ping preferences.*\n\n` +
        `> - **Usage:** \`.notify updates\` | \`.notify giveaways\` | \`.notify events\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
