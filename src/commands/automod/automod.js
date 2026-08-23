const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");
const automodManager = require("../../lib/automodManager");
const { buildAutomodContainer } = require("../../lib/security/handleAutomodInteraction");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["automod", "am"],
  category: "Automod",
  desc: "Configure AutoMod protection filters, presets, bad words, ignore rules & logging.",
  botPermissions: ["Administrator"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      const errorContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Access Denied\n` +
            `-# You need the **Manage Server** permission to configure AutoMod settings.`
        )
      );
      return message.reply({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const guildId = message.guild.id;
    let config = automodManager.getGuildAutomod(guildId);
    const subcommand = args[0]?.toLowerCase();

    // 1. Default: Open Dashboard Container
    if (!subcommand || subcommand === "config" || subcommand === "panel" || subcommand === "wizard" || subcommand === "status") {
      const panel = buildAutomodContainer(config, message.guild, "overview");
      return message.reply({
        components: [panel],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 2. Enable master switch
    if (subcommand === "enable" || subcommand === "on") {
      automodManager.enableMaster(guildId);
      const freshConfig = automodManager.getGuildAutomod(guildId);
      const panel = buildAutomodContainer(freshConfig, message.guild, "overview");
      return message.reply({
        components: [panel],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 3. Disable master switch
    if (subcommand === "disable" || subcommand === "off") {
      automodManager.disableMaster(guildId);
      const freshConfig = automodManager.getGuildAutomod(guildId);
      const panel = buildAutomodContainer(freshConfig, message.guild, "overview");
      return message.reply({
        components: [panel],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 4. Presets Subcommand
    if (subcommand === "preset" || subcommand === "presets") {
      const presetName = args[1]?.toLowerCase();
      if (presetName && automodManager.PRESETS[presetName]) {
        automodManager.applyPreset(guildId, presetName);
      }
      const freshConfig = automodManager.getGuildAutomod(guildId);
      const panel = buildAutomodContainer(freshConfig, message.guild, "presets");
      return message.reply({
        components: [panel],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 5. Modules Subcommand
    if (subcommand === "module" || subcommand === "modules" || subcommand === "filters") {
      const modName = args[1]?.toLowerCase();
      const state = args[2]?.toLowerCase();

      if (modName && automodManager.MODULES[modName]) {
        if (state === "on" || state === "enable") {
          config = automodManager.getGuildAutomod(guildId);
          if (!config.modules[modName]) config.modules[modName] = { enabled: true, punishments: ["delete"] };
          config.modules[modName].enabled = true;
          automodManager.setGuildAutomod(guildId, config);
        } else if (state === "off" || state === "disable") {
          config = automodManager.getGuildAutomod(guildId);
          if (!config.modules[modName]) config.modules[modName] = { enabled: false, punishments: ["delete"] };
          config.modules[modName].enabled = false;
          automodManager.setGuildAutomod(guildId, config);
        } else {
          automodManager.toggleModule(guildId, modName);
        }
      }

      const freshConfig = automodManager.getGuildAutomod(guildId);
      const panel = buildAutomodContainer(freshConfig, message.guild, "modules");
      return message.reply({
        components: [panel],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 6. Badwords Subcommand
    if (subcommand === "badwords" || subcommand === "words" || subcommand === "blacklist") {
      const action = args[1]?.toLowerCase();
      const word = args.slice(2).join(" ");

      if (action === "add" && word) {
        automodManager.addBadWord(guildId, word);
      } else if ((action === "remove" || action === "delete" || action === "del") && word) {
        automodManager.removeBadWord(guildId, word);
      } else if (action === "clear" || action === "reset") {
        automodManager.clearBadWords(guildId);
      }

      const freshConfig = automodManager.getGuildAutomod(guildId);
      const panel = buildAutomodContainer(freshConfig, message.guild, "badwords");
      return message.reply({
        components: [panel],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 7. Ignore Subcommand
    if (subcommand === "ignore" || subcommand === "ignores") {
      const panel = buildAutomodContainer(config, message.guild, "ignore");
      return message.reply({
        components: [panel],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 8. Logs Subcommand
    if (subcommand === "log" || subcommand === "logs" || subcommand === "channel") {
      const panel = buildAutomodContainer(config, message.guild, "logs");
      return message.reply({
        components: [panel],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 9. Reset Subcommand
    if (subcommand === "reset") {
      automodManager.resetAutomod(guildId);
      const freshConfig = automodManager.getGuildAutomod(guildId);
      const panel = buildAutomodContainer(freshConfig, message.guild, "overview");
      return message.reply({
        components: [panel],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Fallback: Show Command Manual
    const manual = buildAutomodContainer(config, message.guild, "commands");
    return message.reply({
      components: [manual],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
