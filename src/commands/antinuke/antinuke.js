const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
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

function buildCommandDirectoryContainer() {
  const container = new ContainerBuilder();

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `### 🛡️ **Antinuke Commands**\n\n` +
      `🛡️ **Core Antinuke**\n` +
      `\`antinuke\` , \`antinuke enable\` , \`antinuke disable\` , \`antinuke info\` , \`antinuke settings\` , \`autosetup\` , \`setantinukelogs\` , \`setmodlogs\` , \`wallroles\` , \`wallrole_add\` , \`wallrole_remove\` , \`verify_permissions\`\n\n` +
      `> \`antinuke\` **aliases -** \`an\`\n\n` +
      `🚀 **Whitelist**\n` +
      `\`antinuke whitelist add <user>\` , \`antinuke whitelist remove <user>\` , \`antinuke whitelist reset <user>\` , \`antinuke whitelist show\`\n\n` +
      `> \`antinuke\` **aliases -** \`an\`\n` +
      `> \`whitelist\` **aliases -** \`wl\`\n\n` +
      `• \`Note:\` \`Both antinuke and superantinuke have their own separate whitelist systems.\`\n\n` +
      `Use the commands above to manage all antinuke features.`
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  const btnPanel = new ButtonBuilder()
    .setCustomId("antinuke_nav_overview")
    .setLabel("Control Center")
    .setEmoji("🛡️")
    .setStyle(ButtonStyle.Primary);

  const btnAutoSetup = new ButtonBuilder()
    .setCustomId("antinuke_nav_autosetup")
    .setLabel("Auto Setup")
    .setEmoji("🚀")
    .setStyle(ButtonStyle.Success);

  const btnWhitelist = new ButtonBuilder()
    .setCustomId("antinuke_nav_trust")
    .setLabel("Whitelist")
    .setEmoji("📋")
    .setStyle(ButtonStyle.Secondary);

  const btnSettings = new ButtonBuilder()
    .setCustomId("antinuke_nav_settings")
    .setLabel("Settings")
    .setEmoji("⚙️")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(btnPanel, btnAutoSetup, btnWhitelist, btnSettings);
  container.addActionRowComponents(row);

  return container;
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

    // Default: Open Command Directory Menu (Matches Image 1)
    if (!subcommand || subcommand === "help" || subcommand === "cmds" || subcommand === "commands") {
      const dirContainer = buildCommandDirectoryContainer();
      return message.reply({
        components: [dirContainer],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Dashboard Container panel
    if (subcommand === "config" || subcommand === "panel" || subcommand === "status" || subcommand === "info" || subcommand === "settings") {
      const panel = buildAntinukeContainer(config, message.guild);
      return message.reply({
        components: [panel],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Enable master switch (Shows recommendation prompt matching Image 2)
    if (subcommand === "enable" || subcommand === "on") {
      const { buildEnableRecommendationContainer } = require("../../lib/security/handleAutoSetup");
      const promptContainer = buildEnableRecommendationContainer(message.guild, message.author);
      return message.reply({
        components: [promptContainer],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Auto Setup Subcommand (Matches Image 3)
    if (subcommand === "autosetup" || subcommand === "setup") {
      const { buildAutoSetupWallSelectionContainer } = require("../../lib/security/handleAutoSetup");
      const view = buildAutoSetupWallSelectionContainer(message.guild, message.author);
      return message.reply({
        components: [view],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Disable master switch & purge all created assets
    if (subcommand === "disable" || subcommand === "off" || subcommand === "cleanup" || subcommand === "reset") {
      const { executeAutoCleanup } = require("../../lib/security/handleAutoSetup");
      const initNotice = buildLoadingNotice("Deactivating Anti-Nuke", "Purging all security roles, log channels, and resetting protection...");
      const msg = await message.reply({
        components: [initNotice],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
      if (msg) {
        await executeAutoCleanup(message.guild, message.author, msg);
      }
      return;
    }

    // Punishment Action Config
    if (subcommand === "punishment" || subcommand === "action") {
      const action = args[1]?.toLowerCase();
      if (!["ban", "kick", "strip", "timeout"].includes(action)) {
        return message.reply({
          components: [
            buildErrorNotice(
              "Invalid Punishment Action",
              "Valid actions are: `ban`, `kick`, `strip` (roles), or `timeout` (28 days)."
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

    // Threshold Action Limit Config
    if (subcommand === "threshold" || subcommand === "limit") {
      const limit = parseInt(args[1], 10);
      if (isNaN(limit) || limit < 1 || limit > 10) {
        return message.reply({
          components: [
            buildErrorNotice(
              "Invalid Threshold Limit",
              "Please provide a valid number between `1` and `10` (e.g. `.antinuke threshold 3`)."
            ),
          ],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      config.threshold = limit;
      antinukeManager.setGuildAntinuke(guildId, config);
      return message.reply({
        components: [
          buildSuccessNotice(
            "Threshold Limit Updated",
            `Anti-Nuke action strike threshold set to \`${limit}\` action${limit > 1 ? "s" : ""} per 60 seconds.`
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

      const validMods = ["channel", "role", "ban", "kick", "webhook", "botAdd", "guildUpdate", "emoji", "permissions", "prune"];
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
            `Automatic channel, role & ban restoration is now \`${config.autoRevert ? "ENABLED" : "DISABLED"}\`.`
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Whitelist Subcommand (.antinuke whitelist <add|remove|reset|show> [user])
    if (subcommand === "whitelist" || subcommand === "wl") {
      const wlCmd = require("./antinukewhitelist");
      return wlCmd.execute(client, message, args.slice(1));
    }

    // Set Antinuke Logs
    if (subcommand === "setantinukelogs" || subcommand === "setanlogs" || subcommand === "logchannel") {
      const logsCmd = require("./setantinukelogs");
      return logsCmd.execute(client, message, args.slice(1));
    }

    // Set Mod Logs
    if (subcommand === "setmodlogs" || subcommand === "setmodlog" || subcommand === "modlogs") {
      const modCmd = require("./setmodlogs");
      return modCmd.execute(client, message, args.slice(1));
    }

    // Wall Roles
    if (subcommand === "wallroles" || subcommand === "wallrole") {
      const wallCmd = require("./wallroles");
      return wallCmd.execute(client, message, args.slice(1));
    }

    if (subcommand === "wallrole_add" || subcommand === "wallroleadd" || subcommand === "addwallrole") {
      const wallAddCmd = require("./wallroleadd");
      return wallAddCmd.execute(client, message, args.slice(1));
    }

    if (subcommand === "wallrole_remove" || subcommand === "wallroleremove" || subcommand === "removewallrole") {
      const wallRemCmd = require("./wallroleremove");
      return wallRemCmd.execute(client, message, args.slice(1));
    }

    // Verify Permissions
    if (subcommand === "verify_permissions" || subcommand === "verifypermissions" || subcommand === "verify") {
      const verifyCmd = require("./verifypermissions");
      return verifyCmd.execute(client, message, args.slice(1));
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
          `> - \`.antinuke threshold <1-10>\` - Set action strike threshold limit\n` +
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
