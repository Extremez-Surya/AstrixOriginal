const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["blacklistremove", "blremove", "bldel"],
  category: "Owner",
  desc: "Remove a user or server from the global blacklist.",
  botPermissions: ["SendMessages"],
  userPermissions: [],
  devOnly: true,

  async execute(client, message, args) {
    const targetUser = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!targetUser) return message.reply("Mention user: `.bldel @user`");

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ✅ Global Blacklist Removed\n> - **User:** ${targetUser} (\`${targetUser.id}\`)`)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
