const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const { getGuildConfig, setGuildConfig } = require("../../lib/starboardManager");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["starboardself", "sbself", "selfstar"],
  category: "Starboard",
  desc: "Toggle whether authors can star their own messages.",

  botPermissions: ["SendMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    const isPermitted =
      message.member?.permissions.has("ManageGuild") ||
      client.developer?.includes(message.author.id);

    if (!isPermitted) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Permission Denied\n` +
            `-# *You need the Manage Server permission to configure self-starring.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const config = getGuildConfig(message.guild.id);
    let nextState = !config.selfStar;

    if (args[0]) {
      const arg = args[0].toLowerCase();
      if (arg === "on" || arg === "enable" || arg === "true") nextState = true;
      else if (arg === "off" || arg === "disable" || arg === "false") nextState = false;
    }

    config.selfStar = nextState;
    setGuildConfig(message.guild.id, config);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 👤 Self-Starring ${nextState ? "Enabled" : "Disabled"}\n` +
            `> - **Status:** \`${nextState ? "Allowed" : "Blocked (Self-reactions stripped/ignored)"}\`\n` +
            `-# *${nextState ? "Authors can now star their own messages towards the threshold." : "Authors cannot count their own stars towards the starboard threshold."}*`,
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# *ASTRIXCODE™ Starboard Engine*`),
      );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });
  },
};
