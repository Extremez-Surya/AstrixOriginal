const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const prefixManager = require("../../lib/prefixManager");
const { clientPrefix } = require("../../lib/config.json");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["setprefix", "changeprefix", "newprefix"],
  category: "Server",
  desc: "Set a custom command prefix for this server or reset to default.",

  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const isOwner = message.author.id === message.guild.ownerId;
    const isAdmin = message.member.permissions.has("Administrator");
    const isDev = client.developer?.includes(message.author.id);

    if (!isOwner && !isAdmin && !isDev) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Permission Denied\n` +
            `-# *You need Administrator permissions to change the server prefix.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const currentPrefix = prefixManager.getPrefix(message.guild.id);
    const newPrefix = args[0];

    if (!newPrefix) {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ⚙️ Set Server Prefix\n` +
              `> - **Current Prefix:** \`${currentPrefix}\`\n\n` +
              `**Usage:**\n` +
              `> - \`${currentPrefix}setprefix <symbol>\` — Set custom server prefix\n` +
              `> - \`${currentPrefix}setprefix reset\` — Reset to default global prefix (\`${clientPrefix || "-"}\`)`,
          ),
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`-# *ASTRIXCODE™ Server Customization*`),
        );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    if (newPrefix.toLowerCase() === "reset") {
      prefixManager.resetPrefix(message.guild.id);

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🔄 Prefix Reset to Default\n` +
              `> - **New Prefix:** \`${clientPrefix || "-"}\`\n` +
              `-# *Server prefix has been restored to default.*`,
          ),
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`-# *ASTRIXCODE™ Server Customization*`),
        );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    if (newPrefix.length > 5) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Invalid Prefix\n` +
            `-# *Prefix must be 5 characters or less.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    if (newPrefix.includes(" ")) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Invalid Prefix\n` +
            `-# *Prefix cannot contain whitespace or spaces.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    prefixManager.setPrefix(message.guild.id, newPrefix);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🌐 Server Prefix Updated\n` +
            `> - **New Prefix:** \`${newPrefix}\`\n` +
            `> - **Example Command:** \`${newPrefix}help\`\n` +
            `-# *Updated by <@${message.author.id}>.*`,
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# *ASTRIXCODE™ Server Customization*`),
      );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });
  },
};
