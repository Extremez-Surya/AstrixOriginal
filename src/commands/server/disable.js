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
  alias: ["disable", "disablecmd", "cmd-disable"],
  category: "Server",
  desc: "Disable a command or entire category server-wide or in a specific channel.",

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
            `-# *You need the Manage Server permission to disable commands.*`,
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
            `-# *Usage: \`.disable <command | category> [channel | server]\`*\n\n` +
            `> - **Example:** \`.disable fun\` (Disables fun category globally)\n` +
            `> - **Example:** \`.disable play #general\` (Disables play in #general)`,
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
      const cmdName = command.alias?.[0] || targetInput;
      if (cmdName === "disable" || cmdName === "enable") {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:red_star:1539875482680696834> Core Command Protection\n` +
              `-# *You cannot disable the enable or disable management commands.*`,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }
      resolvedName = cmdName;
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

    serverManager.disableCommand(message.guild.id, resolvedName, scope);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🚫 ${isCategory ? "Category" : "Command"} Disabled\n` +
            `> - **Target:** \`${resolvedName}\`\n` +
            `> - **Scope:** ${scopeName}\n` +
            `-# *Users will not be able to execute this ${isCategory ? "category" : "command"} in ${scopeName}.*`,
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
