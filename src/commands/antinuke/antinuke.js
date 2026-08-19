const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
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
  alias: ["antinuke", "an"],
  category: "Anti Nuke",
  desc: "Configure Anti-Nuke defense modules, auto-reversion, punishment policies & extra owners.",
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    // Strict Permission Check: Only Guild Owner, Extra Owners, or Developers can configure Anti-Nuke
    const isOwner = message.guild.ownerId === message.author.id;
    const config = antinukeManager.getGuildAntinuke(message.guild.id);
    const isExtraOwner = (config.extraOwners || []).includes(message.author.id);
    const isDev = client.developer && Array.isArray(client.developer) && client.developer.includes(message.author.id);

    if (!isOwner && !isExtraOwner && !isDev) {
      return message.reply({
        components: [
          buildErrorNotice(
            "Access Denied",
            "Only the **Guild Owner** or designated **Extra Owners** can configure Anti-Nuke settings."
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const guildId = message.guild.id;
    const subcommand = args[0]?.toLowerCase();

    // Default: Open Dashboard Container
    if (!subcommand || subcommand === "config" || subcommand === "panel" || subcommand === "status") {
      const panel = buildAntinukeContainer(config);
      return message.reply({
        components: [panel],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Enable master switch
    if (subcommand === "enable" || subcommand === "on") {
      antinukeManager.enableMaster(guildId);
      return message.reply({
        components: [
          buildSuccessNotice("Anti-Nuke Activated", "Master Anti-Nuke protection system is now **ENABLED**."),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Disable master switch
    if (subcommand === "disable" || subcommand === "off") {
      antinukeManager.disableMaster(guildId);
      return message.reply({
        components: [
          buildSuccessNotice("Anti-Nuke Deactivated", "Master Anti-Nuke protection system is now **DISABLED**."),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Punishment Action Config
    if (subcommand === "punishment" || subcommand === "action") {
      const action = args[1]?.toLowerCase();
      if (!["ban", "kick", "strip", "timeout"].includes(action)) {
        return message.reply({
          components: [
            buildErrorNotice(
              "Invalid Punishment Action",
              "Valid actions are: `ban`, `kick`, `strip` (roles), or `timeout`."
            ),
          ],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      config.punishment = action;
      antinukeManager.setGuildAntinuke(guildId, config);
      return message.reply({
        components: [
          buildSuccessNotice(
            "Punishment Action Updated",
            `Anti-Nuke punishment policy set to \`${action.toUpperCase()}\`.`
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Module Toggles
    if (subcommand === "module" || subcommand === "toggle") {
      const modName = args[1]?.toLowerCase();
      const state = args[2]?.toLowerCase();

      const validMods = ["channel", "role", "ban", "kick", "webhook", "botAdd", "guildUpdate", "emoji", "permissions"];
      if (!validMods.includes(modName)) {
        return message.reply({
          components: [
            buildErrorNotice(
              "Invalid Module Name",
              `Available modules: \`${validMods.join("`, `")}\``
            ),
          ],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      if (!config.modules) config.modules = {};
      if (state === "on" || state === "enable") config.modules[modName] = true;
      else if (state === "off" || state === "disable") config.modules[modName] = false;
      else config.modules[modName] = !config.modules[modName];

      antinukeManager.setGuildAntinuke(guildId, config);
      return message.reply({
        components: [
          buildSuccessNotice(
            "Module Toggled",
            `Module \`${modName}\` is now \`${config.modules[modName] ? "ENABLED" : "DISABLED"}\`.`
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Auto-Revert Toggle
    if (subcommand === "revert" || subcommand === "autorevert") {
      config.autoRevert = !config.autoRevert;
      antinukeManager.setGuildAntinuke(guildId, config);
      return message.reply({
        components: [
          buildSuccessNotice(
            "Auto-Revert Updated",
            `Automatic channel & role restoration is now \`${config.autoRevert ? "ENABLED" : "DISABLED"}\`.`
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Extra Owners Subcommand
    if (subcommand === "extraowner" || subcommand === "extraowners") {
      const action = args[1]?.toLowerCase();
      const targetUser = message.mentions.users.first() || (args[2] ? await client.users.fetch(args[2]).catch(() => null) : null);

      if (action === "view" || action === "list") {
        const list = (config.extraOwners || []).map((id, i) => `\`${i + 1}.\` <@${id}> (\`${id}\`)`).join("\n") || "*No extra owners designated.*";
        return message.reply({
          components: [buildSuccessNotice("Extra Owners Directory", list)],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      if (!targetUser) {
        return message.reply({
          components: [buildErrorNotice("User Required", "Usage: `.antinuke extraowner <add|remove|view> [user]`")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      if (action === "add") {
        const added = antinukeManager.addExtraOwner(guildId, targetUser.id);
        return message.reply({
          components: [
            added
              ? buildSuccessNotice("Extra Owner Added", `<@${targetUser.id}> is now an immune Extra Owner.`)
              : buildErrorNotice("Already Designated", `<@${targetUser.id}> is already an Extra Owner.`),
          ],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      if (action === "remove") {
        const removed = antinukeManager.removeExtraOwner(guildId, targetUser.id);
        return message.reply({
          components: [
            removed
              ? buildSuccessNotice("Extra Owner Removed", `<@${targetUser.id}> removed from Extra Owners.`)
              : buildErrorNotice("Not Found", `<@${targetUser.id}> is not an Extra Owner.`),
          ],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }
    }

    // Whitelist Subcommand
    if (subcommand === "whitelist") {
      const action = args[1]?.toLowerCase();
      const targetUser = message.mentions.users.first() || (args[2] ? await client.users.fetch(args[2]).catch(() => null) : null);

      if (action === "view" || action === "list") {
        const list = (config.whitelist || []).map((id, i) => `\`${i + 1}.\` <@${id}> (\`${id}\`)`).join("\n") || "*No whitelisted users.*";
        return message.reply({
          components: [buildSuccessNotice("Anti-Nuke Whitelist Directory", list)],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      if (action === "clear") {
        antinukeManager.clearWhitelist(guildId);
        return message.reply({
          components: [buildSuccessNotice("Whitelist Cleared", "All users removed from anti-nuke whitelist.")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      if (!targetUser) {
        return message.reply({
          components: [buildErrorNotice("User Required", "Usage: `.antinuke whitelist <add|remove|view|clear> [user]`")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      if (action === "add") {
        const added = antinukeManager.addWhitelist(guildId, targetUser.id);
        return message.reply({
          components: [
            added
              ? buildSuccessNotice("User Whitelisted", `<@${targetUser.id}> added to anti-nuke whitelist.`)
              : buildErrorNotice("Already Whitelisted", `<@${targetUser.id}> is already whitelisted.`),
          ],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      if (action === "remove") {
        const removed = antinukeManager.removeWhitelist(guildId, targetUser.id);
        return message.reply({
          components: [
            removed
              ? buildSuccessNotice("User Removed", `<@${targetUser.id}> removed from whitelist.`)
              : buildErrorNotice("Not Found", `<@${targetUser.id}> is not whitelisted.`),
          ],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }
    }

    // Log Channel Subcommand
    if (subcommand === "log" || subcommand === "logs") {
      const arg = args[1]?.toLowerCase();
      if (arg === "off" || arg === "disable") {
        config.logChannel = null;
        antinukeManager.setGuildAntinuke(guildId, config);
        return message.reply({
          components: [buildSuccessNotice("Logging Disabled", "Anti-Nuke audit logging disabled.")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const targetChan = message.mentions.channels.first() || (args[1] ? message.guild.channels.cache.get(args[1]) : null);
      if (!targetChan || !targetChan.isTextBased()) {
        return message.reply({
          components: [buildErrorNotice("Invalid Channel", "Please mention a text channel or use `.antinuke log off`.")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      config.logChannel = targetChan.id;
      antinukeManager.setGuildAntinuke(guildId, config);
      return message.reply({
        components: [buildSuccessNotice("Log Channel Set", `Anti-Nuke audit alerts will be logged to <#${targetChan.id}>.`)],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Reset Subcommand
    if (subcommand === "reset") {
      antinukeManager.resetAntinuke(guildId);
      return message.reply({
        components: [buildSuccessNotice("Config Reset", "Anti-Nuke settings reset to factory defaults.")],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Fallback Usage Help
    const helpContainer = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.antinuke || "🔒"} ANTI-NUKE COMMAND REFERENCE\n` +
          `> - \`.antinuke config\` - Open interactive control dashboard\n` +
          `> - \`.antinuke enable/disable\` - Toggle anti-nuke master system\n` +
          `> - \`.antinuke punishment <ban|kick|strip|timeout>\` - Set punishment action\n` +
          `> - \`.antinuke module <name> <on|off>\` - Toggle specific protection module\n` +
          `> - \`.antinuke revert\` - Toggle auto-reversion of deleted channels/roles\n` +
          `> - \`.antinuke extraowner <add|remove|view> [user]\` - Manage immune extra owners\n` +
          `> - \`.antinuke whitelist <add|remove|view|clear> [user]\` - Manage immune whitelist\n` +
          `> - \`.antinuke log <#channel|off>\` - Set audit log channel\n` +
          `> - \`.antinuke reset\` - Reset settings`
      )
    );

    return message.reply({
      components: [helpContainer],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
