const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");
const antinukeManager = require("../../lib/antinukeManager");
const { buildAntinukeContainer } = require("../../lib/security/handleAntiNukeInteraction");
const EMOJIS = require("../../lib/emojis");

function buildSuccessNotice(title, description) {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${EMOJIS.ticky_red || "✅"} ${title}`)
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(description));
}

function buildErrorNotice(title, description) {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${EMOJIS.cross || "❌"} ${title}`)
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(description));
}

module.exports = {
  name: "antinuke",
  category: "Anti Nuke",
  description: "Configure Anti-Nuke defense modules, auto-reversion, punishment policies & extra owners.",
  type: ApplicationCommandType.ChatInput,
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  options: [
    {
      name: "config",
      description: "View and open the interactive Anti-Nuke control dashboard.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "enable",
      description: "Enable master Anti-Nuke protection system.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "disable",
      description: "Disable master Anti-Nuke protection system.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "punishment",
      description: "Set Anti-Nuke punishment action.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "action",
          description: "Punishment action for unauthorized nukers.",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            { name: "Ban", value: "ban" },
            { name: "Kick", value: "kick" },
            { name: "Strip Roles", value: "strip" },
            { name: "Timeout (28 days)", value: "timeout" },
          ],
        },
      ],
    },
    {
      name: "revert",
      description: "Toggle auto-reversion of deleted channels and roles.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "whitelist",
      description: "Manage Anti-Nuke bypass whitelist.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "action",
          description: "Whitelist action.",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            { name: "Add User", value: "add" },
            { name: "Remove User", value: "remove" },
            { name: "View Directory", value: "view" },
            { name: "Clear Directory", value: "clear" },
          ],
        },
        {
          name: "user",
          description: "Target user (for add/remove).",
          type: ApplicationCommandOptionType.User,
          required: false,
        },
      ],
    },
    {
      name: "extraowner",
      description: "Manage immune Extra Owners.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "action",
          description: "Extra Owner action.",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            { name: "Add Extra Owner", value: "add" },
            { name: "Remove Extra Owner", value: "remove" },
            { name: "View Directory", value: "view" },
          ],
        },
        {
          name: "user",
          description: "Target user (for add/remove).",
          type: ApplicationCommandOptionType.User,
          required: false,
        },
      ],
    },
    {
      name: "log",
      description: "Set Anti-Nuke audit log channel.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "channel",
          description: "Text channel for logging alerts.",
          type: ApplicationCommandOptionType.Channel,
          required: false,
        },
        {
          name: "disable",
          description: "Turn off audit logging.",
          type: ApplicationCommandOptionType.Boolean,
          required: false,
        },
      ],
    },
    {
      name: "reset",
      description: "Reset Anti-Nuke settings for this server to defaults.",
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],

  async execute(client, interaction) {
    if (!interaction.guild) return;

    const isOwner = interaction.guild.ownerId === interaction.user.id;
    const config = antinukeManager.getGuildAntinuke(interaction.guild.id);
    const isExtraOwner = (config.extraOwners || []).includes(interaction.user.id);
    const isDev = client.developer && Array.isArray(client.developer) && client.developer.includes(interaction.user.id);

    if (!isOwner && !isExtraOwner && !isDev) {
      return interaction.reply({
        components: [
          buildErrorNotice(
            "Access Denied",
            "Only the **Guild Owner** or designated **Extra Owners** can configure Anti-Nuke settings."
          ),
        ],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const guildId = interaction.guild.id;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "config") {
      const panel = buildAntinukeContainer(config);
      return interaction.reply({
        components: [panel],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (subcommand === "enable") {
      antinukeManager.enableMaster(guildId);
      return interaction.reply({
        components: [buildSuccessNotice("Anti-Nuke Activated", "Master Anti-Nuke system is now **ENABLED**.")],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (subcommand === "disable") {
      antinukeManager.disableMaster(guildId);
      return interaction.reply({
        components: [buildSuccessNotice("Anti-Nuke Deactivated", "Master Anti-Nuke system is now **DISABLED**.")],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (subcommand === "punishment") {
      const action = interaction.options.getString("action");
      config.punishment = action;
      antinukeManager.setGuildAntinuke(guildId, config);
      return interaction.reply({
        components: [buildSuccessNotice("Punishment Updated", `Anti-Nuke punishment action set to \`${action.toUpperCase()}\`.`)],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (subcommand === "revert") {
      config.autoRevert = !config.autoRevert;
      antinukeManager.setGuildAntinuke(guildId, config);
      return interaction.reply({
        components: [buildSuccessNotice("Auto-Revert Updated", `Auto-Revert is now \`${config.autoRevert ? "ENABLED" : "DISABLED"}\`.`)],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (subcommand === "whitelist") {
      const action = interaction.options.getString("action");
      const targetUser = interaction.options.getUser("user");

      if (action === "view") {
        const list = (config.whitelist || []).map((id, i) => `\`${i + 1}.\` <@${id}> (\`${id}\`)`).join("\n") || "*No whitelisted users.*";
        return interaction.reply({
          components: [buildSuccessNotice("Anti-Nuke Whitelist Directory", list)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      if (action === "clear") {
        antinukeManager.clearWhitelist(guildId);
        return interaction.reply({
          components: [buildSuccessNotice("Whitelist Cleared", "All users removed from whitelist.")],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      if (!targetUser) {
        return interaction.reply({
          components: [buildErrorNotice("User Required", "Please specify a target user.")],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      if (action === "add") {
        const added = antinukeManager.addWhitelist(guildId, targetUser.id);
        return interaction.reply({
          components: [
            added
              ? buildSuccessNotice("User Whitelisted", `<@${targetUser.id}> added to whitelist.`)
              : buildErrorNotice("Already Whitelisted", `<@${targetUser.id}> is already whitelisted.`),
          ],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      if (action === "remove") {
        const removed = antinukeManager.removeWhitelist(guildId, targetUser.id);
        return interaction.reply({
          components: [
            removed
              ? buildSuccessNotice("User Removed", `<@${targetUser.id}> removed from whitelist.`)
              : buildErrorNotice("Not Whitelisted", `<@${targetUser.id}> is not whitelisted.`),
          ],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }
    }

    if (subcommand === "extraowner") {
      const action = interaction.options.getString("action");
      const targetUser = interaction.options.getUser("user");

      if (action === "view") {
        const list = (config.extraOwners || []).map((id, i) => `\`${i + 1}.\` <@${id}> (\`${id}\`)`).join("\n") || "*No extra owners.*";
        return interaction.reply({
          components: [buildSuccessNotice("Extra Owners Directory", list)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      if (!targetUser) {
        return interaction.reply({
          components: [buildErrorNotice("User Required", "Please specify a target user.")],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      if (action === "add") {
        const added = antinukeManager.addExtraOwner(guildId, targetUser.id);
        return interaction.reply({
          components: [
            added
              ? buildSuccessNotice("Extra Owner Added", `<@${targetUser.id}> added as Extra Owner.`)
              : buildErrorNotice("Already Extra Owner", `<@${targetUser.id}> is already an Extra Owner.`),
          ],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      if (action === "remove") {
        const removed = antinukeManager.removeExtraOwner(guildId, targetUser.id);
        return interaction.reply({
          components: [
            removed
              ? buildSuccessNotice("Extra Owner Removed", `<@${targetUser.id}> removed from Extra Owners.`)
              : buildErrorNotice("Not Extra Owner", `<@${targetUser.id}> is not an Extra Owner.`),
          ],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }
    }

    if (subcommand === "log") {
      const channel = interaction.options.getChannel("channel");
      const disable = interaction.options.getBoolean("disable");

      if (disable) {
        config.logChannel = null;
        antinukeManager.setGuildAntinuke(guildId, config);
        return interaction.reply({
          components: [buildSuccessNotice("Logging Disabled", "Anti-Nuke audit logging disabled.")],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      if (!channel || !channel.isTextBased()) {
        return interaction.reply({
          components: [buildErrorNotice("Invalid Channel", "Please specify a text channel.")],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      config.logChannel = channel.id;
      antinukeManager.setGuildAntinuke(guildId, config);
      return interaction.reply({
        components: [buildSuccessNotice("Log Channel Set", `Anti-Nuke audit alerts will be logged to <#${channel.id}>.`)],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (subcommand === "reset") {
      antinukeManager.resetAntinuke(guildId);
      return interaction.reply({
        components: [buildSuccessNotice("Config Reset", "Anti-Nuke settings reset to defaults.")],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }
  },
};
