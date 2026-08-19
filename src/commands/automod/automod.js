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
  alias: ["automod", "am"],
  category: "Automod",
  desc: "Configure AutoMod protection filters, presets, bad words, ignore rules & logging.",
  botPermissions: ["Administrator"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({
        components: [
          buildErrorNotice(
            "Access Denied",
            "You need the **Manage Server** permission to configure AutoMod settings."
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const guildId = message.guild.id;
    const config = automodManager.getGuildAutomod(guildId);
    const subcommand = args[0]?.toLowerCase();

    // Default: Open Dashboard Container
    if (!subcommand || subcommand === "config" || subcommand === "panel" || subcommand === "wizard" || subcommand === "status") {
      const panel = buildAutomodContainer(config);
      return message.reply({
        components: [panel],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Enable master switch
    if (subcommand === "enable" || subcommand === "on") {
      automodManager.enableMaster(guildId);
      return message.reply({
        components: [
          buildSuccessNotice("AutoMod Activated", "Master AutoMod message moderation system is now **ENABLED**."),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Disable master switch
    if (subcommand === "disable" || subcommand === "off") {
      automodManager.disableMaster(guildId);
      return message.reply({
        components: [
          buildSuccessNotice("AutoMod Deactivated", "Master AutoMod message moderation system is now **DISABLED**."),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Preset Subcommand
    if (subcommand === "preset") {
      const presetName = args[1]?.toLowerCase();
      if (!presetName || !automodManager.PRESETS[presetName]) {
        let text = `### ⚖️ **AUTOMOD PRESETS**\n\n`;
        for (const [key, p] of Object.entries(automodManager.PRESETS)) {
          text += `> - **${p.name}** (\`.automod preset ${key}\`): ${p.description}\n`;
        }
        return message.reply({
          components: [buildSuccessNotice("Available Presets", text)],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      automodManager.applyPreset(guildId, presetName);
      return message.reply({
        components: [
          buildSuccessNotice(
            `${automodManager.PRESETS[presetName].name} Preset Applied`,
            `AutoMod is now **ENABLED** with the **${automodManager.PRESETS[presetName].name}** protection preset!`
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Module Subcommand
    if (subcommand === "module" || subcommand === "toggle") {
      const modName = args[1]?.toLowerCase();
      const state = args[2]?.toLowerCase();

      if (!modName || !automodManager.MODULES[modName]) {
        let text = `Available modules: \`${Object.keys(automodManager.MODULES).join("`, `")}\``;
        return message.reply({
          components: [buildErrorNotice("Invalid Module", text)],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      if (!config.modules) config.modules = {};
      if (!config.modules[modName]) config.modules[modName] = { enabled: false, punishments: ["delete"] };

      if (state === "on" || state === "enable") config.modules[modName].enabled = true;
      else if (state === "off" || state === "disable") config.modules[modName].enabled = false;
      else config.modules[modName].enabled = !config.modules[modName].enabled;

      automodManager.setGuildAutomod(guildId, config);
      return message.reply({
        components: [
          buildSuccessNotice(
            "Module Updated",
            `Module **${automodManager.MODULES[modName].name}** is now \`${config.modules[modName].enabled ? "ENABLED" : "DISABLED"}\`.`
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Bad Words Subcommand
    if (subcommand === "words" || subcommand === "badwords") {
      const action = args[1]?.toLowerCase();
      const wordArg = args.slice(2).join(" ");

      if (action === "add" && wordArg) {
        automodManager.addBadWord(guildId, wordArg);
        return message.reply({
          components: [buildSuccessNotice("Bad Word Added", `Added \`||${wordArg}||` + "` to banned words list.")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      if (action === "remove" && wordArg) {
        automodManager.removeBadWord(guildId, wordArg);
        return message.reply({
          components: [buildSuccessNotice("Bad Word Removed", `Removed \`||${wordArg}||` + "` from banned words list.")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      if (action === "clear") {
        automodManager.clearBadWords(guildId);
        return message.reply({
          components: [buildSuccessNotice("Bad Words Cleared", "Cleared all banned words.")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const words = config.modules?.badwords?.words || [];
      const listText = words.length > 0 ? words.map((w, i) => `\`${i + 1}.\` ||${w}||`).join("\n") : "*No banned words configured.*";
      return message.reply({
        components: [buildSuccessNotice(`Banned Words Directory (${words.length})`, listText)],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Log Channel Subcommand
    if (subcommand === "log" || subcommand === "logs" || subcommand === "logchannel") {
      const arg = args[1]?.toLowerCase();
      if (arg === "off" || arg === "disable") {
        config.logChannel = null;
        automodManager.setGuildAutomod(guildId, config);
        return message.reply({
          components: [buildSuccessNotice("Logging Disabled", "AutoMod audit logging disabled.")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const targetChan = message.mentions.channels.first() || (args[1] ? message.guild.channels.cache.get(args[1]) : null);
      if (!targetChan || !targetChan.isTextBased()) {
        return message.reply({
          components: [buildErrorNotice("Invalid Channel", "Please mention a text channel or use `.automod log off`.")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      config.logChannel = targetChan.id;
      automodManager.setGuildAutomod(guildId, config);
      return message.reply({
        components: [buildSuccessNotice("Log Channel Set", `AutoMod audit alerts will be logged to <#${targetChan.id}>.`)],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Reset Subcommand
    if (subcommand === "reset") {
      automodManager.resetAutomod(guildId);
      return message.reply({
        components: [buildSuccessNotice("Config Reset", "AutoMod settings reset to factory defaults.")],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Help Fallback
    const helpContainer = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.automod || "🤖"} AUTOMOD COMMAND REFERENCE\n` +
          `> - \`.automod config\` - Open interactive control dashboard\n` +
          `> - \`.automod enable/disable\` - Toggle master automod system\n` +
          `> - \`.automod preset <strict|moderate|light>\` - Apply protection preset\n` +
          `> - \`.automod module <name> [on|off]\` - Toggle specific module\n` +
          `> - \`.automod words add/remove/list/clear [word]\` - Manage bad words\n` +
          `> - \`.automod log <#channel|off>\` - Set audit log channel\n` +
          `> - \`.automod reset\` - Reset settings`
      )
    );

    return message.reply({
      components: [helpContainer],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
