const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");
const antiraidManager = require("../../lib/antiraidManager");
const { buildAntiraidContainer } = require("../../lib/security/handleAntiRaidInteraction");
const EMOJIS = require("../../lib/emojis");

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2).toLowerCase();
      const val = args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : "true";
      flags[key] = val;
      if (val !== "true") i++;
    }
  }
  return flags;
}

function buildSuccessNotice(title, description) {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.ticky_red || "✅"} ${title}`
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(description)
    );
  return container;
}

function buildErrorNotice(title, description) {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.cross || "❌"} ${title}`
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(description)
    );
  return container;
}

module.exports = {
  alias: ["antiraid", "raiddefense", "raidguard"],
  category: "Anti Raid",
  desc: "Configure Anti-Raid defense modules, mass join limits, name filters, emergency raid mode & whitelists.",
  botPermissions: ["Administrator"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({
        components: [
          buildErrorNotice("Permission Denied", "You need **Manage Server** permissions to execute this command."),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    const guildId = message.guild.id;
    let config = antiraidManager.getGuildAntiraid(guildId);
    const subcommand = args[0]?.toLowerCase();

    // Default: Show Dashboard Container
    if (!subcommand || subcommand === "config" || subcommand === "panel" || subcommand === "status") {
      const panel = buildAntiraidContainer(config);
      return message.reply({
        components: [panel],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Enable master switch
    if (subcommand === "enable" || subcommand === "on") {
      antiraidManager.enableMaster(guildId);
      return message.reply({
        components: [
          buildSuccessNotice("Anti-Raid Fortress Activated", "Master anti-raid protection system is now **ENABLED**."),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Disable master switch
    if (subcommand === "disable" || subcommand === "off") {
      antiraidManager.disableMaster(guildId);
      return message.reply({
        components: [
          buildSuccessNotice("Anti-Raid Fortress Deactivated", "Master anti-raid protection system is now **DISABLED**."),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Name Pattern & Spam Filter Subcommand
    if (subcommand === "namefilter" || subcommand === "regex" || subcommand === "name") {
      const setting = args[1]?.toLowerCase();
      const flags = parseFlags(args.slice(2));

      if (!config.namefilter) {
        config.namefilter = { enabled: false, action: "ban", patterns: [] };
      }

      if (setting === "on" || setting === "enable") {
        config.namefilter.enabled = true;
      } else if (setting === "off" || setting === "disable") {
        config.namefilter.enabled = false;
      }

      if (flags.do) {
        const action = flags.do.toLowerCase();
        if (["kick", "ban"].includes(action)) {
          config.namefilter.action = action;
        }
      }

      if (flags.add) {
        if (!config.namefilter.patterns.includes(flags.add)) {
          config.namefilter.patterns.push(flags.add);
        }
      }

      if (flags.remove) {
        config.namefilter.patterns = config.namefilter.patterns.filter((p) => p !== flags.remove);
      }

      antiraidManager.setGuildAntiraid(guildId, config);
      return message.reply({
        components: [
          buildSuccessNotice(
            "Name Pattern & Regex Spam Filter Updated",
            `> - **Status:** \`${config.namefilter.enabled ? "ENABLED" : "DISABLED"}\`\n` +
              `> - **Action:** \`${(config.namefilter.action || "ban").toUpperCase()}\`\n` +
              `> - **Active Regex Patterns:** \`${config.namefilter.patterns.length}\` pattern(s)`
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Mass Join Module
    if (subcommand === "massjoin") {
      const setting = args[1]?.toLowerCase();
      const flags = parseFlags(args.slice(2));

      if (setting === "on" || setting === "enable") {
        config.massjoin.enabled = true;
      } else if (setting === "off" || setting === "disable") {
        config.massjoin.enabled = false;
      }

      if (flags.threshold) {
        const t = parseInt(flags.threshold, 10);
        if (!isNaN(t) && t >= 2 && t <= 30) {
          config.massjoin.threshold = t;
        }
      }

      if (flags.do) {
        const action = flags.do.toLowerCase();
        if (["kick", "ban"].includes(action)) {
          config.massjoin.action = action;
        }
      }

      if (flags.lock !== undefined) {
        config.massjoin.lockChannels = flags.lock === "true" || flags.lock === true;
      }

      antiraidManager.setGuildAntiraid(guildId, config);
      return message.reply({
        components: [
          buildSuccessNotice(
            "Mass Join Policy Updated",
            `> - **Status:** \`${config.massjoin.enabled ? "ENABLED" : "DISABLED"}\`\n` +
              `> - **Threshold:** \`${config.massjoin.threshold}\` joins / 10s\n` +
              `> - **Action:** \`${config.massjoin.action.toUpperCase()}\`\n` +
              `> - **Auto-Lockdown:** \`${config.massjoin.lockChannels ? "YES" : "NO"}\``
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Default Avatar Module
    if (subcommand === "avatar") {
      const setting = args[1]?.toLowerCase();
      const flags = parseFlags(args.slice(2));

      if (setting === "on" || setting === "enable") {
        config.avatar.enabled = true;
      } else if (setting === "off" || setting === "disable") {
        config.avatar.enabled = false;
      }

      if (flags.do) {
        const action = flags.do.toLowerCase();
        if (["kick", "ban"].includes(action)) {
          config.avatar.action = action;
        }
      }

      antiraidManager.setGuildAntiraid(guildId, config);
      return message.reply({
        components: [
          buildSuccessNotice(
            "Default Avatar Check Updated",
            `> - **Status:** \`${config.avatar.enabled ? "ENABLED" : "DISABLED"}\`\n` +
              `> - **Action:** \`${config.avatar.action.toUpperCase()}\``
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // New Accounts Filter Module
    if (subcommand === "newaccounts" || subcommand === "age") {
      const setting = args[1]?.toLowerCase();
      const flags = parseFlags(args.slice(2));

      if (setting === "on" || setting === "enable") {
        config.newaccounts.enabled = true;
      } else if (setting === "off" || setting === "disable") {
        config.newaccounts.enabled = false;
      }

      if (flags.threshold) {
        const t = parseInt(flags.threshold, 10);
        if (!isNaN(t) && t >= 1 && t <= 90) {
          config.newaccounts.threshold = t;
        }
      }

      if (flags.do) {
        const action = flags.do.toLowerCase();
        if (["kick", "ban"].includes(action)) {
          config.newaccounts.action = action;
        }
      }

      antiraidManager.setGuildAntiraid(guildId, config);
      return message.reply({
        components: [
          buildSuccessNotice(
            "New Account Filter Updated",
            `> - **Status:** \`${config.newaccounts.enabled ? "ENABLED" : "DISABLED"}\`\n` +
              `> - **Minimum Account Age:** \`${config.newaccounts.threshold}\` days\n` +
              `> - **Action:** \`${config.newaccounts.action.toUpperCase()}\``
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // State / Emergency Raid Mode Toggle
    if (subcommand === "state" || subcommand === "raidmode") {
      config.raidState = !config.raidState;
      if (config.raidState) {
        antiraidManager.incrementStats(guildId, "raidsDetected");
      }
      antiraidManager.setGuildAntiraid(guildId, config);

      if (config.raidState) {
        return message.reply({
          components: [
            buildErrorNotice(
              "🚨 EMERGENCY RAID MODE ACTIVATED",
              `Server is now in active Raid Mode.\n` +
                `• All newly joining members will be automatically banned/kicked on entry.\n` +
                `• Run \`.antiraid state\` or \`.raidmode off\` to deactivate.`
            ),
          ],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      } else {
        return message.reply({
          components: [
            buildSuccessNotice("Raid Mode Deactivated", "Server has returned to normal operation state."),
          ],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }
    }

    // Whitelist subcommand
    if (subcommand === "whitelist") {
      const action = args[1]?.toLowerCase();

      if (action === "view" || action === "show" || action === "list") {
        const whitelist = config.whitelist || [];
        if (whitelist.length === 0) {
          return message.reply({
            components: [
              buildSuccessNotice("Whitelist Empty", "No users are currently whitelisted for anti-raid bypass."),
            ],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { repliedUser: false },
          }).catch(() => null);
        }

        const wlList = whitelist.map((id, i) => `\`${i + 1}.\` <@${id}> (\`${id}\`)`).join("\n");
        return message.reply({
          components: [
            buildSuccessNotice("Anti-Raid Whitelist Directory", wlList),
          ],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      if (action === "clear") {
        antiraidManager.clearWhitelist(guildId);
        return message.reply({
          components: [
            buildSuccessNotice("Whitelist Cleared", "All users have been removed from the anti-raid whitelist."),
          ],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const targetArg = action === "add" || action === "remove" ? args[2] : args[1];
      const targetUser =
        message.mentions.users.first() ||
        (targetArg ? await client.users.fetch(targetArg).catch(() => null) : null);

      if (!targetUser) {
        return message.reply({
          components: [
            buildErrorNotice("Invalid User", "Please mention a valid user or provide a user ID.\n*Usage:* `.antiraid whitelist <add|remove|view|clear> [user]`"),
          ],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      if (action === "remove") {
        const removed = antiraidManager.removeWhitelist(guildId, targetUser.id);
        if (!removed) {
          return message.reply({
            components: [
              buildErrorNotice("Not Whitelisted", `<@${targetUser.id}> is not on the anti-raid whitelist.`),
            ],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { repliedUser: false },
          }).catch(() => null);
        }
        return message.reply({
          components: [
            buildSuccessNotice("User Removed from Whitelist", `<@${targetUser.id}> has been removed from anti-raid whitelist.`),
          ],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      // Default: Add user
      const added = antiraidManager.addWhitelist(guildId, targetUser.id);
      if (!added) {
        return message.reply({
          components: [
            buildErrorNotice("Already Whitelisted", `<@${targetUser.id}> is already on the anti-raid whitelist.`),
          ],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      return message.reply({
        components: [
          buildSuccessNotice("User Whitelisted", `<@${targetUser.id}> has been added to the anti-raid whitelist bypass list.`),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Audit Log Channel Setup
    if (subcommand === "log" || subcommand === "logs" || subcommand === "channel") {
      const arg = args[1]?.toLowerCase();
      if (arg === "off" || arg === "none" || arg === "disable") {
        config.logChannel = null;
        antiraidManager.setGuildAntiraid(guildId, config);
        return message.reply({
          components: [
            buildSuccessNotice("Anti-Raid Logging Disabled", "Audit logging for anti-raid events has been disabled."),
          ],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const targetChan =
        message.mentions.channels.first() ||
        (args[1] ? message.guild.channels.cache.get(args[1]) : null);

      if (!targetChan || !targetChan.isTextBased()) {
        return message.reply({
          components: [
            buildErrorNotice("Invalid Channel", "Please mention a valid text channel or use `.antiraid log off` to disable."),
          ],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      config.logChannel = targetChan.id;
      antiraidManager.setGuildAntiraid(guildId, config);
      return message.reply({
        components: [
          buildSuccessNotice("Log Channel Set", `Anti-raid alerts will now be logged to <#${targetChan.id}>.`),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Reset Config
    if (subcommand === "reset") {
      antiraidManager.resetAntiraid(guildId);
      return message.reply({
        components: [
          buildSuccessNotice("Anti-Raid Config Reset", "Anti-Raid settings for this server have been reset to factory defaults."),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Fallback Command Usage Help
    const helpContainer = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.rshield || "🛡️"} HARDENED ANTI-RAID COMMAND REFERENCE\n` +
            `> - \`.antiraid config\` - Open main interactive control dashboard\n` +
            `> - \`.antiraid enable/disable\` - Toggle anti-raid master system\n` +
            `> - \`.antiraid namefilter <on|off> [--do kick|ban] [--add regex]\` - Name & spam regex filter\n` +
            `> - \`.antiraid massjoin <on|off> [--threshold N] [--do kick|ban] [--lock]\` - Mass join detection\n` +
            `> - \`.antiraid avatar <on|off> [--do kick|ban]\` - Default avatar filter\n` +
            `> - \`.antiraid newaccounts <on|off> [--threshold N] [--do kick|ban]\` - New account filter\n` +
            `> - \`.antiraid state\` - Toggle emergency raid mode\n` +
            `> - \`.antiraid whitelist <add|remove|view|clear> [user]\` - Manage bypass whitelist\n` +
            `> - \`.antiraid log <#channel|off>\` - Set audit log channel\n` +
            `> - \`.antiraid reset\` - Reset configuration`
        )
      );

    return message.reply({
      components: [helpContainer],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
