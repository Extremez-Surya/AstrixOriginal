const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["reactionroleadd", "rradd", "rr-add"],
  category: "Utility",
  desc: "Bind a reaction emoji to a role on a target message.",
  botPermissions: ["ManageRoles", "AddReactions"],
  userPermissions: ["ManageRoles"],
  devOnly: false,

  async execute(client, message, args) {
    const msgId = args[0];
    const emoji = args[1];
    const role = message.mentions.roles.first();

    if (!msgId || !emoji || !role) return message.reply("Usage: `.rradd <message_id> <emoji> <@Role>`");

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🎭 Reaction Role Bound\n> - **Message ID:** \`${msgId}\` \n> - **Emoji:** ${emoji} \n> - **Role:** ${role}`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
