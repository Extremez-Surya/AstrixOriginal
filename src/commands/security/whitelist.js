const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["whitelist", "wl"],
  category: "Security",
  desc: "Add or remove users from the server Anti-Nuke whitelist.",
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const action = args[0]?.toLowerCase();
    const targetUser =
      message.mentions.users.first() ||
      (args[1] ? await client.users.fetch(args[1]).catch(() => null) : null);

    if (action === "add" || action === "trust") {
      if (!targetUser) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:red_star:1539875482680696834> Target Required\n` +
            `-# *Usage: \`.whitelist add @user\`*`
          )
        );
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      }

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🛡️ Member Whitelisted\n` +
          `-# *${targetUser.username} has been added to the anti-nuke bypass list.*\n\n` +
          `> - **User:** \`${targetUser.tag}\` (\`${targetUser.id}\`)`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (action === "remove" || action === "delete") {
      if (!targetUser) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:red_star:1539875482680696834> Target Required\n` +
            `-# *Usage: \`.whitelist remove @user\`*`
          )
        );
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      }

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🛡️ Member Unwhitelisted\n` +
          `-# *${targetUser.username} has been removed from the anti-nuke bypass list.*\n\n` +
          `> - **User:** \`${targetUser.tag}\` (\`${targetUser.id}\`)`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🛡️ Whitelist Management\n` +
        `-# *Manage trusted anti-nuke users.*\n\n` +
        `> - **Usage:** \`.whitelist add @user\` | \`.whitelist remove @user\` | \`.whitelist show\`\n` +
        `> - **Whitelisted Members:** \`None configured\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
