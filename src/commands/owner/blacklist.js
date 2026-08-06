const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["blacklist", "botblacklist", "unblacklist"],
  category: "Owner",
  desc: "Blacklist users or servers from using Astrix globally.",
  botPermissions: ["SendMessages"],
  userPermissions: [],
  devOnly: true,

  async execute(client, message, args) {
    const action = args[0]?.toLowerCase();
    const targetUser =
      message.mentions.users.first() ||
      (args[1] ? await client.users.fetch(args[1]).catch(() => null) : null);

    if (action === "add") {
      if (!targetUser) return message.reply("Please mention a user or specify an ID.");

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ⛔ Global Blacklist Added\n` +
          `-# *${targetUser.username} has been globally restricted from using the bot.*\n\n` +
          `> - **User:** \`${targetUser.tag}\` (\`${targetUser.id}\`)`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (action === "remove") {
      if (!targetUser) return message.reply("Please mention a user or specify an ID.");

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ✅ Global Blacklist Removed\n` +
          `-# *${targetUser.username} has been unblacklisted.*\n\n` +
          `> - **User:** \`${targetUser.tag}\` (\`${targetUser.id}\`)`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ⛔ Global Blacklist Manager\n` +
        `-# *Restrict abusive users or servers from bot access.*\n\n` +
        `> - **Usage:** \`.blacklist add @user\` | \`.blacklist remove @user\` | \`.blacklist list\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
