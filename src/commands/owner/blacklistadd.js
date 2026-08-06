const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["blacklistadd", "bladd", "bl-add"],
  category: "Owner",
  desc: "Blacklist a user or server globally from using Astrix.",
  botPermissions: ["SendMessages"],
  userPermissions: [],
  devOnly: true,

  async execute(client, message, args) {
    const targetUser = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!targetUser) return message.reply("Mention user: `.bladd @user`");

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ⛔ Global Blacklist Added\n> - **User:** ${targetUser} (\`${targetUser.id}\`)`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
