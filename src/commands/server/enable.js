const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const serverManager = require("../../lib/serverManager");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["enable", "enablecmd", "cmd-enable"],
  category: "Server",
  desc: "Re-enable a command or category that was previously disabled.",

  botPermissions: ["SendMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    const isOwner = message.author.id === message.guild.ownerId;
    const isManager = message.member.permissions.has("ManageGuild") || message.member.permissions.has("Administrator");

    if (!isOwner && !isManager) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Permission Denied\n` +
            `-# *You need the Manage Server permission to enable commands.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    if (!args[0]) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Missing Arguments\n` +
            `-# *Usage: \`.enable <command | category> [channel | server]\`*\n\n` +
            `> - **Example:** \`.enable fun\` (Re-enables fun category globally)\n` +
            `> - **Example:** \`.enable play #general\` (Re-enables play in #general)`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const targetInput = args[0].toLowerCase();
    const command = client.messageCommands.get(targetInput) || client.messageCommands.find((c) => c.alias?.includes(targetInput));

    let isCategory = false;
    let resolvedName = null;

    if (command) {
      resolvedName = command.alias?.[0] || targetInput;
    } else {
      const categories = new Set(
        Array.from(client.messageCommands.values())
          .map((c) => c.category?.toLowerCase())
          .filter(Boolean),
      );
      if (categories.has(targetInput)) {
        isCategory = true;
        resolvedName = targetInput;
      }
    }

    if (!resolvedName) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Command or Category Not Found\n` +
            `-# *Could not locate command or category \`${args[0]}\`.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    let scope = "global";
    let scopeName = "Server-wide";

    if (args[1]) {
      const targetChannel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1].replace(/[<#>]/g, ""));
      if (targetChannel) {
        scope = targetChannel.id;
        scopeName = `<#${targetChannel.id}>`;
      }
    }

    serverManager.enableCommand(message.guild.id, resolvedName, scope);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ✅ ${isCategory ? "Category" : "Command"} Enabled\n` +
            `> - **Target:** \`${resolvedName}\`\n` +
            `> - **Scope:** ${scopeName}\n` +
            `-# *Users can now execute this ${isCategory ? "category" : "command"} in ${scopeName}.*`,
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
