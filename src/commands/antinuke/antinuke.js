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
      new TextDisplayBuilder().setContent(`### ${EMOJIS.ticky_red || "✅"} **${title}**`)
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(description))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Protection Enforced`));
}

function buildErrorNotice(title, description) {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${EMOJIS.cross || "❌"} **${title}**`)
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(description))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Protection Enforced`));
}



function buildListOverviewContainer(config, guild) {
  const isEnabled = Boolean(config.enabled);
  const mods = config.modules || {};
  const statusEmoji = isEnabled ? "🟢 Active & Enforced" : "🔴 Inactive (Standby)";

  const moduleList = [
    { key: "channel", label: "channel", on: mods.channel !== false },
    { key: "role", label: "role", on: mods.role !== false },
    { key: "ban", label: "ban", on: mods.ban !== false },
    { key: "kick", label: "kick", on: mods.kick !== false },
    { key: "webhook", label: "webhook", on: mods.webhook !== false },
    { key: "emoji", label: "emoji", on: mods.emoji !== false },
    { key: "botAdd", label: "botadd", on: mods.botAdd !== false },
    { key: "guildUpdate", label: "vanity", on: mods.guildUpdate !== false },
    { key: "prune", label: "prune", on: mods.prune !== false },
    { key: "permissions", label: "permissions", on: mods.permissions !== false },
  ];

  const modLines = moduleList.map((m) => `${m.on ? "🟢" : "🔴"} \`${m.label}\``).join(" • ");

  const protocolCount = Object.keys(config.protocolUsers || {}).length;

  const content =
    `### 🛡️ **Astrix Anti-Nuke • Overview & Status**\n` +
    `-# Real-time server security telemetry and module enforcement status.\n\n` +
    `> **System Status:** \`${statusEmoji}\`\n` +
    `> **Punishment Policy:** \`${(config.punishment || "ban").toUpperCase()}\`\n` +
    `> **Action Threshold:** \`${config.threshold || 3} actions / 60s\`\n` +
    `> **Auto-Revert:** \`${config.autoRevert !== false ? "ENABLED" : "DISABLED"}\`\n` +
    `> **Log Channel:** ${config.logChannel ? `<#${config.logChannel}>` : "`None Configured`"}\n\n` +
    `**🧩 Modules Enforcement:**\n` +
    `> ${modLines}\n\n` +
    `**👥 Access & Quarantine Directory:**\n` +
    `> • **Extra Owners:** \`${(config.extraOwners || []).length}\` users\n` +
    `> • **Trusted Admins:** \`${(config.superWhitelist || []).length}\` users\n` +
    `> • **Antinuke Admins:** \`${(config.admins || []).length}\` users\n` +
    `> • **Whitelisted Users:** \`${(config.whitelist || []).length}\` users\n` +
    `> • **Protocol Quarantined:** \`${protocolCount}\` users`;

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("antinuke_nav_overview")
      .setLabel("Control Center")
      .setEmoji("🛡️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("antinuke_nav_settings")
      .setLabel("Settings")
      .setEmoji("⚙️")
      .setStyle(ButtonStyle.Secondary)
  );

  container.addActionRowComponents(row);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Telemetry Active`));
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

    // Strict Permission Check: Guild Owner, Extra Owners, or Developers
    const isOwner = message.guild.ownerId === message.author.id;
    const config = antinukeManager.getGuildAntinuke(message.guild.id);
    const isExtraOwner = (config.extraOwners || []).includes(message.author.id);
    const isDev = client.developer && Array.isArray(client.developer) && client.developer.includes(message.author.id);
    const noprefixManager = require("../../lib/noprefixManager");
    const isNoprefix = noprefixManager.isOwner(message.author.id, client);

    if (!isOwner && !isExtraOwner && !isDev && !isNoprefix) {
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

    // ─────────────────────────────────────────────────────────────────────────
    // 1. HOME & HELP DIRECTORY
    // ─────────────────────────────────────────────────────────────────────────
    if (!subcommand) {
      const homeView = buildAntinukeContainer(config, message.guild, "home");
      return message.reply({
        components: [homeView],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    if (subcommand === "help" || subcommand === "cmds" || subcommand === "commands") {
      const helpView = buildAntinukeContainer(config, message.guild, "help");
      return message.reply({
        components: [helpView],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. CORE COMMANDS: ON / OFF / SETUP / LIST / CONFIG
    // ─────────────────────────────────────────────────────────────────────────
    if (subcommand === "on" || subcommand === "enable") {
      if (config.enabled) {
        const alreadyActiveContainer = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### 🛡️ **Anti-Nuke Defense Already Active**\n` +
              `> 🟢 Master Anti-Nuke shield and all **10 security modules** are already active and guarding **${message.guild.name}**.\n\n` +
              `-# If you want to reconfigure settings or roles, access the **Control Center** below.`
            )
          )
          .addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
          );

        const cpBtn = new ButtonBuilder()
          .setCustomId("antinuke_nav_overview")
          .setLabel("Control Center")
          .setEmoji("🛡️")
          .setStyle(ButtonStyle.Primary);

        const guideBtn = new ButtonBuilder()
          .setCustomId("antinuke_nav_menu")
          .setLabel("Help & Guide")
          .setEmoji("📜")
          .setStyle(ButtonStyle.Secondary);

        alreadyActiveContainer.addActionRowComponents(new ActionRowBuilder().addComponents(cpBtn, guideBtn));
        alreadyActiveContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Security • Active & Enforced`)
        );

        return message.reply({
          components: [alreadyActiveContainer],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const { buildEnableRecommendationContainer } = require("../../lib/security/handleAutoSetup");
      const view = buildEnableRecommendationContainer(message.guild, message.author);
      return message.reply({
        components: [view],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    if (subcommand === "setup" || subcommand === "autosetup") {
      const { buildEnableRecommendationContainer } = require("../../lib/security/handleAutoSetup");
      const view = buildEnableRecommendationContainer(message.guild, message.author);
      return message.reply({
        components: [view],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    if (subcommand === "off" || subcommand === "disable") {
      const { executeAutoCleanup } = require("../../lib/security/handleAutoSetup");
      const loadingContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🛑 **Deactivating Anti-Nuke...**\n` +
              `-# Purging security roles, log channels, category, and resetting configuration.`
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );

      const msg = await message.reply({
        components: [loadingContainer],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);

      if (msg) {
        await executeAutoCleanup(message.guild, message.author, msg);
      }
      return;
    }

    if (subcommand === "list" || subcommand === "status" || subcommand === "overview" || subcommand === "info") {
      const listView = buildListOverviewContainer(config, message.guild);
      return message.reply({
        components: [listView],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    if (subcommand === "config" || subcommand === "panel" || subcommand === "settings") {
      const panel = buildAntinukeContainer(config, message.guild);
      return message.reply({
        components: [panel],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. PERMISSION MANAGEMENT: ADMIN / TRUSTEDADMIN / EXTRAOWNER / WHITELIST
    // ─────────────────────────────────────────────────────────────────────────
    if (subcommand === "admin" || subcommand === "admins") {
      let targetUser = message.mentions.users.first();
      let action = args[1]?.toLowerCase();

      if (action === "list" || action === "view") {
        const list = (config.admins || []).map((id, i) => `\`${i + 1}.\` <@${id}> (\`${id}\`)`).join("\n") || "*No antinuke admins designated.*";
        return message.reply({
          components: [buildSuccessNotice("Antinuke Admins Directory", list)],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      if (action === "add" || action === "remove") {
        targetUser = message.mentions.users.first() || (args[2] ? await client.users.fetch(args[2]).catch(() => null) : null);
      } else if (!targetUser && args[1]) {
        targetUser = await client.users.fetch(args[1]).catch(() => null);
      }

      if (!targetUser) {
        return message.reply({
          components: [buildErrorNotice("User Required", "Usage: `.antinuke admin @user` or `.antinuke admin list`")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const added = antinukeManager.toggleAdmin(guildId, targetUser.id);
      return message.reply({
        components: [
          buildSuccessNotice(
            added ? "Admin Added" : "Admin Removed",
            `<@${targetUser.id}> has been ${added ? "**added to**" : "**removed from**"} the Anti-Nuke admin list.`
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    if (subcommand === "trustedadmin" || subcommand === "trusted" || subcommand === "superwhitelist" || subcommand === "superwl") {
      let targetUser = message.mentions.users.first();
      let action = args[1]?.toLowerCase();

      if (action === "list" || action === "view") {
        const list = (config.superWhitelist || []).map((id, i) => `\`${i + 1}.\` <@${id}> (\`${id}\`)`).join("\n") || "*No trusted admins designated.*";
        return message.reply({
          components: [buildSuccessNotice("Trusted Admins Directory (Super Whitelist)", list)],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      if (action === "add" || action === "remove") {
        targetUser = message.mentions.users.first() || (args[2] ? await client.users.fetch(args[2]).catch(() => null) : null);
      } else if (!targetUser && args[1]) {
        targetUser = await client.users.fetch(args[1]).catch(() => null);
      }

      if (!targetUser) {
        return message.reply({
          components: [buildErrorNotice("User Required", "Usage: `.antinuke trustedadmin @user` or `.antinuke trustedadmin list`")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const added = antinukeManager.toggleTrustedAdmin(guildId, targetUser.id);
      return message.reply({
        components: [
          buildSuccessNotice(
            added ? "Trusted Admin Added" : "Trusted Admin Removed",
            `<@${targetUser.id}> is now ${added ? "**granted super-immunity**" : "**removed from trusted admins**"}.`
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    if (subcommand === "extraowner" || subcommand === "extraowners") {
      let targetUser = message.mentions.users.first();
      let action = args[1]?.toLowerCase();

      if (action === "list" || action === "view") {
        const list = (config.extraOwners || []).map((id, i) => `\`${i + 1}.\` <@${id}> (\`${id}\`)`).join("\n") || "*No extra owners designated.*";
        return message.reply({
          components: [buildSuccessNotice("Extra Owners Directory", list)],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      if (action === "add" || action === "remove") {
        targetUser = message.mentions.users.first() || (args[2] ? await client.users.fetch(args[2]).catch(() => null) : null);
      } else if (!targetUser && args[1]) {
        targetUser = await client.users.fetch(args[1]).catch(() => null);
      }

      if (!targetUser) {
        return message.reply({
          components: [buildErrorNotice("User Required", "Usage: `.antinuke extraowner @user` or `.antinuke extraowner list`")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const added = antinukeManager.toggleExtraOwner(guildId, targetUser.id);
      return message.reply({
        components: [
          buildSuccessNotice(
            added ? "Extra Owner Added" : "Extra Owner Removed",
            `<@${targetUser.id}> is now ${added ? "**designated as an Extra Owner**" : "**removed from Extra Owners**"}.`
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    if (subcommand === "whitelist" || subcommand === "wl") {
      let targetUser = message.mentions.users.first();
      let action = args[1]?.toLowerCase();

      if (action === "list" || action === "view" || action === "show") {
        const list = (config.whitelist || []).map((id, i) => `\`${i + 1}.\` <@${id}> (\`${id}\`)`).join("\n") || "*No whitelisted users.*";
        return message.reply({
          components: [buildSuccessNotice("Anti-Nuke Whitelist Directory", list)],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      if (action === "clear" || action === "reset") {
        antinukeManager.clearWhitelist(guildId);
        return message.reply({
          components: [buildSuccessNotice("Whitelist Cleared", "All users removed from anti-nuke whitelist.")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      if (action === "add" || action === "remove") {
        targetUser = message.mentions.users.first() || (args[2] ? await client.users.fetch(args[2]).catch(() => null) : null);
      } else if (!targetUser && args[1]) {
        targetUser = await client.users.fetch(args[1]).catch(() => null);
      }

      if (!targetUser) {
        return message.reply({
          components: [buildErrorNotice("User Required", "Usage: `.antinuke whitelist @user` or `.antinuke whitelist list`")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const added = antinukeManager.toggleWhitelist(guildId, targetUser.id);
      return message.reply({
        components: [
          buildSuccessNotice(
            added ? "User Whitelisted" : "User Removed from Whitelist",
            `<@${targetUser.id}> is now ${added ? "**added to**" : "**removed from**"} the whitelist.`
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. EMERGENCY PROTOCOL: PROTOCOL / UNPROTOCOL / PROTOCOL-LIST
    // ─────────────────────────────────────────────────────────────────────────
    if (subcommand === "protocol") {
      const targetUser = message.mentions.users.first() || (args[1] ? await client.users.fetch(args[1]).catch(() => null) : null);
      if (!targetUser) {
        return message.reply({
          components: [buildErrorNotice("User Required", "Usage: `.antinuke protocol @user` (Applies role strip + 28d timeout)")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
      if (!member) {
        return message.reply({
          components: [buildErrorNotice("Member Not Found", "Target user is not currently in this server.")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const res = await antinukeManager.applyProtocol(message.guild, member, message.author.id);
      return message.reply({
        components: [
          buildSuccessNotice(
            "Protocol Enforcement Active",
            `> • **Target:** <@${member.id}> (\`${member.id}\`)\n` +
            `> • **Roles Stripped:** \`${res.strippedCount}\` roles removed\n` +
            `> • **Timeout:** \`28 Days Lockdown\`\n` +
            `> • **Status:** Registered in Emergency Protocol Quarantine.`
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    if (subcommand === "unprotocol") {
      const targetUser = message.mentions.users.first() || (args[1] ? await client.users.fetch(args[1]).catch(() => null) : null);
      if (!targetUser) {
        return message.reply({
          components: [buildErrorNotice("User Required", "Usage: `.antinuke unprotocol @user`")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
      if (!member) {
        return message.reply({
          components: [buildErrorNotice("Member Not Found", "Target user is not in this server.")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const res = await antinukeManager.removeProtocol(message.guild, member, message.author.id);
      if (!res.success) {
        return message.reply({
          components: [buildErrorNotice("Protocol Status", `<@${member.id}> is not registered in the protocol quarantine.`)],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      return message.reply({
        components: [
          buildSuccessNotice(
            "Protocol Lifted",
            `> • **Target:** <@${member.id}>\n` +
            `> • **Timeout:** \`Removed\`\n` +
            `> • **Roles Restored:** \`${res.restoredCount}\` roles restored\n` +
            `> • **Status:** Successfully restored to normal standing.`
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    if (subcommand === "protocol-list" || subcommand === "protocollist") {
      const protocols = antinukeManager.getProtocolList(guildId);
      const entries = Object.entries(protocols);

      if (entries.length === 0) {
        return message.reply({
          components: [buildSuccessNotice("Protocol Directory", "No users currently under emergency protocol quarantine.")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const listText = entries
        .map(([uId, data], i) => `\`${i + 1}.\` <@${uId}> (\`${uId}\`) — Locked by <@${data.appliedBy}> <t:${Math.floor(data.timestamp / 1000)}:R>`)
        .join("\n");

      return message.reply({
        components: [buildSuccessNotice("Protocol Quarantined Users", listText)],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. MODULE CONFIGURATION: PUNISHMENT / THRESHOLD / INDIVIDUAL MODULES
    // ─────────────────────────────────────────────────────────────────────────
    if (subcommand === "punishment" || subcommand === "action") {
      const action = args[1]?.toLowerCase();
      const valid = ["ban", "kick", "strip", "timeout", "quarantine"];
      if (!valid.includes(action)) {
        return message.reply({
          components: [
            buildErrorNotice(
              "Invalid Punishment Action",
              "Valid actions are: `ban`, `kick`, `strip`, `timeout`, or `quarantine`."
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
            "Punishment Updated",
            `Anti-Nuke default enforcement policy set to \`${action.toUpperCase()}\`.`
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    if (subcommand === "threshold" || subcommand === "limit") {
      const limit = parseInt(args[1], 10);
      if (isNaN(limit) || limit < 1 || limit > 20) {
        return message.reply({
          components: [
            buildErrorNotice(
              "Invalid Threshold Limit",
              "Please provide a valid number between `1` and `20` (e.g. `.antinuke threshold 3`)."
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
            `Anti-Nuke strike threshold set to \`${limit}\` action${limit > 1 ? "s" : ""} per 60 seconds.`
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Direct module toggle check: e.g. .antinuke ban on, .antinuke role off, .antinuke vanity on
    const canonicalMod = antinukeManager.MODULE_ALIASES[subcommand];
    if (canonicalMod) {
      const state = args[1]?.toLowerCase();
      if (!config.modules) config.modules = {};

      if (state === "on" || state === "enable") config.modules[canonicalMod] = true;
      else if (state === "off" || state === "disable") config.modules[canonicalMod] = false;
      else config.modules[canonicalMod] = !config.modules[canonicalMod];

      antinukeManager.setGuildAntinuke(guildId, config);
      return message.reply({
        components: [
          buildSuccessNotice(
            "Module Updated",
            `Module \`${subcommand}\` (\`${canonicalMod}\`) is now **${config.modules[canonicalMod] ? "ENABLED 🟢" : "DISABLED 🔴"}**.`
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Generic .antinuke module <name> <on|off>
    if (subcommand === "module" || subcommand === "toggle") {
      const modName = args[1]?.toLowerCase();
      const state = args[2]?.toLowerCase();
      const realMod = antinukeManager.MODULE_ALIASES[modName];

      if (!realMod) {
        return message.reply({
          components: [
            buildErrorNotice(
              "Invalid Module Name",
              "Available modules: `ban`, `kick`, `role`, `channel`, `webhook`, `emoji`, `botadd`, `vanity`, `prune`, `permissions`."
            ),
          ],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      if (!config.modules) config.modules = {};
      if (state === "on" || state === "enable") config.modules[realMod] = true;
      else if (state === "off" || state === "disable") config.modules[realMod] = false;
      else config.modules[realMod] = !config.modules[realMod];

      antinukeManager.setGuildAntinuke(guildId, config);
      return message.reply({
        components: [
          buildSuccessNotice(
            "Module Updated",
            `Module \`${modName}\` is now **${config.modules[realMod] ? "ENABLED 🟢" : "DISABLED 🔴"}**.`
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. OTHER INTEGRATED SUBCOMMANDS (WALLROLES, LOGS, REVERT, RESET)
    // ─────────────────────────────────────────────────────────────────────────
    if (subcommand === "wallroles" || subcommand === "wallrole" || subcommand === "securitywall") {
      const wallCmd = require("./wallroles");
      return wallCmd.execute(client, message, args.slice(1));
    }

    if (subcommand === "verify_permissions" || subcommand === "verifypermissions" || subcommand === "verify") {
      const verifyCmd = require("./verifypermissions");
      return verifyCmd.execute(client, message, args.slice(1));
    }

    if (subcommand === "revert" || subcommand === "autorevert") {
      config.autoRevert = !config.autoRevert;
      antinukeManager.setGuildAntinuke(guildId, config);
      return message.reply({
        components: [
          buildSuccessNotice(
            "Auto-Revert Updated",
            `Automatic restoration of deleted channels/roles is now **${config.autoRevert ? "ENABLED 🟢" : "DISABLED 🔴"}**.`
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    if (subcommand === "log" || subcommand === "logs" || subcommand === "setantinukelogs") {
      const logsCmd = require("./setantinukelogs");
      return logsCmd.execute(client, message, args.slice(1));
    }

    if (subcommand === "modlog" || subcommand === "modlogs" || subcommand === "setmodlogs") {
      const modCmd = require("./setmodlogs");
      return modCmd.execute(client, message, args.slice(1));
    }

    if (subcommand === "reset") {
      antinukeManager.resetAntinuke(guildId);
      return message.reply({
        components: [buildSuccessNotice("Config Reset", "Anti-Nuke settings reset to factory defaults.")],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Fallback: Show Help Container
    const fallbackHelp = buildAntinukeContainer(config, message.guild, "help");
    return message.reply({
      components: [fallbackHelp],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
