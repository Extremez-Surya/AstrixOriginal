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
  alias: ["starboardchannel", "sbchannel", "starchannel", "starboardset"],
  category: "Starboard",
  desc: "Set or clear the designated starboard showcase channel.",

  botPermissions: ["SendMessages", "EmbedLinks"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    const isPermitted =
      message.member?.permissions.has("ManageGuild") ||
      client.developer?.includes(message.author.id);

    if (!isPermitted) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Permission Denied\n` +
            `-# *You need the Manage Server permission to change the Starboard channel.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const config = getGuildConfig(message.guild.id);

    if (!args[0]) {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ⭐ Starboard Channel Settings\n` +
              `> - **Current Channel:** ${config.channelId ? `<#${config.channelId}>` : "`Not Set`"}\n` +
              `> - **Status:** \`${config.enabled ? "Active" : "Disabled"}\`\n\n` +
              `**Usage:**\n` +
              `> - \`.sbchannel #channel\` — Designate starboard channel\n` +
              `> - \`.sbchannel clear\` — Disable and remove starboard channel`,
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
    }

    if (args[0].toLowerCase() === "clear" || args[0].toLowerCase() === "disable") {
      config.channelId = null;
      config.enabled = false;
      setGuildConfig(message.guild.id, config);

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔴 Starboard Channel Cleared\n` +
            `-# *Starboard has been deactivated and the channel unlinked.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const targetChannel =
      message.mentions.channels.first() ||
      message.guild.channels.cache.get(args[0].replace(/[<#>]/g, ""));

    if (!targetChannel || !targetChannel.isTextBased()) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Invalid Channel\n` +
            `-# *Please mention a valid text channel for starboard showcases.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    config.channelId = targetChannel.id;
    config.enabled = true;
    setGuildConfig(message.guild.id, config);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ⭐ Starboard Channel Configured\n` +
            `> - **Designated Channel:** <#${targetChannel.id}>\n` +
            `> - **Status:** 🟢 \`Active & Enabled\`\n` +
            `-# *Messages reaching the reaction threshold will now be showcased in <#${targetChannel.id}>.*`,
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
