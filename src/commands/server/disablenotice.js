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
  alias: ["disablenotice", "disablemsg", "quietmode"],
  category: "Server",
  desc: "Toggle whether the bot sends an alert when a disabled command is used.",

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
            `-# *You need the Manage Server permission to change disabled command alert settings.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const currentSetting = serverManager.getDisableNotice(message.guild.id);
    let nextState = !currentSetting;

    if (args[0]) {
      const arg = args[0].toLowerCase();
      if (arg === "on" || arg === "enable" || arg === "true") nextState = true;
      else if (arg === "off" || arg === "disable" || arg === "false") nextState = false;
    }

    serverManager.setDisableNotice(message.guild.id, nextState);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔔 Disabled Command Notice Updated\n` +
            `> - **Status:** \`${nextState ? "Enabled (Bot replies with notice)" : "Quiet Mode (Bot silently ignores)"}\`\n` +
            `-# *${nextState ? "The bot will inform users when they run a disabled command." : "The bot will silently ignore disabled command triggers."}*`,
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
