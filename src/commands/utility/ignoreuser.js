const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["ignoreuser", "ignore-user"],
  category: "Utility",
  desc: "Ignore bot commands for a specific user.",
  botPermissions: ["ManageGuild"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser = message.mentions.users.first();
    if (!targetUser) return message.reply("Mention user to ignore: `.ignoreuser @user`");

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🚫 User Ignored\n> - **Ignored User:** ${targetUser} (\`${targetUser.id}\`)`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
