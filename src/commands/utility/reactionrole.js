const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["reactionrole", "rr"],
  category: "Utility",
  desc: "Set up reaction role menus for member self-role assignment.",
  botPermissions: ["ManageRoles", "AddReactions"],
  userPermissions: ["ManageRoles"],
  devOnly: false,

  async execute(client, message, args) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🎭 Reaction Role Setup\n` +
        `-# *Allow users to pick roles by clicking emoji reactions.*\n\n` +
        `> - **Usage:** \`.rr add <message_id> <emoji> <@Role>\` \n` +
        `> - **Usage:** \`.rr remove <message_id> <emoji>\`\n` +
        `> - **Usage:** \`.rr list\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
