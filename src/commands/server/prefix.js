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
  alias: ["prefix", "showprefix", "currentprefix"],
  category: "Server",
  desc: "Display the server's active command prefix and global settings.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const currentPrefix = prefixManager.getPrefix(message.guild.id);
    const isCustom = currentPrefix !== (clientPrefix || ".");

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🌐 Server Prefix • ${message.guild.name}\n` +
            `> - **Active Prefix:** \`${currentPrefix}\`\n` +
            `> - **Type:** \`${isCustom ? "🔧 Custom (Server)" : "🌐 Global Default"}\`\n\n` +
            `-# *Use \`${currentPrefix}setprefix <symbol>\` to change the prefix, or \`${currentPrefix}help\` to browse all commands.*`,
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
