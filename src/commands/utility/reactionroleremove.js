const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["reactionroleremove", "rrremove", "rrdel"],
  category: "Utility",
  desc: "Remove a reaction role binding from a message.",
  botPermissions: ["ManageRoles"],
  userPermissions: ["ManageRoles"],
  devOnly: false,

  async execute(client, message, args) {
    const msgId = args[0];
    const emoji = args[1];

    if (!msgId || !emoji) return message.reply("Usage: `.rrdel <message_id> <emoji>`");

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🎭 Reaction Role Removed\n> - **Message ID:** \`${msgId}\` \n> - **Emoji:** ${emoji}`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
