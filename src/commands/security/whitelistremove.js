const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["whitelistremove", "wlremove", "wl-remove", "unwl"],
  category: "Security",
  desc: "Remove a member from the Anti-Nuke whitelist.",
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!targetUser) return message.reply("Please mention a user to remove from whitelist: `.wlremove @user`");

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🛡️ Member Unwhitelisted\n` +
        `-# *Removed from anti-nuke bypass registry.*\n\n` +
        `> - **User:** ${targetUser} (\`${targetUser.id}\`)`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
