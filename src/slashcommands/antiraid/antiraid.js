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
const antiraidManager = require("../../lib/antiraidManager");
const { buildAntiraidContainer } = require("../../lib/security/handleAntiRaidInteraction");
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
  name: "antiraid",
  category: "Anti Raid",
  description: "Configure Anti-Raid defense modules, mass join limits, name filters & emergency raid mode.",
  type: ApplicationCommandType.ChatInput,
  botPermissions: ["Administrator"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  options: [
    {
      name: "config",
      description: "View and open the interactive Anti-Raid control dashboard.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "enable",
      description: "Enable master Anti-Raid protection system.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "disable",
      description: "Disable master Anti-Raid protection system.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "massjoin",
      description: "Configure mass join rate-limit detection policy.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "state",
          description: "Enable or disable mass join detection.",
          type: ApplicationCommandOptionType.String,
          required: false,
          choices: [
            { name: "Enable", value: "enable" },
            { name: "Disable", value: "disable" },
          ],
        },
        {
          name: "threshold",
          description: "Number of joins in 10s to trigger raid mode (2-30).",
          type: ApplicationCommandOptionType.Integer,
          required: false,
        },
        {
          name: "action",
          description: "Punishment action for raiders.",
          type: ApplicationCommandOptionType.String,
          required: false,
          choices: [
            { name: "Ban", value: "ban" },
            { name: "Kick", value: "kick" },
          ],
        },
        {
          name: "lockdown",
          description: "Auto-lock text channels on mass join detection.",
          type: ApplicationCommandOptionType.Boolean,
          required: false,
        },
      ],
    },
    {
      name: "namefilter",
      description: "Configure name pattern and regex spam filter.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "state",
          description: "Enable or disable name filter.",
          type: ApplicationCommandOptionType.String,
          required: false,
          choices: [
            { name: "Enable", value: "enable" },
            { name: "Disable", value: "disable" },
          ],
        },
        {
          name: "action",
          description: "Punishment action.",
          type: ApplicationCommandOptionType.String,
          required: false,
          choices: [
            { name: "Ban", value: "ban" },
            { name: "Kick", value: "kick" },
          ],
        },
      ],
    },
    {
      name: "avatar",
      description: "Configure default avatar (no profile picture) check.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "state",
          description: "Enable or disable default avatar check.",
          type: ApplicationCommandOptionType.String,
          required: false,
          choices: [
            { name: "Enable", value: "enable" },
            { name: "Disable", value: "disable" },
          ],
        },
        {
          name: "action",
          description: "Punishment action.",
          type: ApplicationCommandOptionType.String,
          required: false,
          choices: [
            { name: "Ban", value: "ban" },
            { name: "Kick", value: "kick" },
          ],
        },
      ],
    },
    {
      name: "newaccounts",
      description: "Configure minimum account age filter.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "state",
          description: "Enable or disable account age filter.",
          type: ApplicationCommandOptionType.String,
          required: false,
          choices: [
            { name: "Enable", value: "enable" },
            { name: "Disable", value: "disable" },
          ],
        },
        {
          name: "days",
          description: "Minimum required account age in days (1-90).",
          type: ApplicationCommandOptionType.Integer,
          required: false,
        },
        {
          name: "action",
          description: "Punishment action.",
          type: ApplicationCommandOptionType.String,
          required: false,
          choices: [
            { name: "Ban", value: "ban" },
            { name: "Kick", value: "kick" },
          ],
        },
      ],
    },
    {
      name: "raidmode",
      description: "Toggle Emergency Raid Mode.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "whitelist",
      description: "Manage Anti-Raid bypass whitelist.",
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
      name: "log",
      description: "Set Anti-Raid audit log channel.",
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
      description: "Reset Anti-Raid settings for this server to defaults.",
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],

  async execute(client, interaction) {
    if (!interaction.guild) return;

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        components: [buildErrorNotice("Permission Denied", "You need **Manage Server** permissions.")],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const guildId = interaction.guild.id;
    let config = antiraidManager.getGuildAntiraid(guildId);
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "config") {
      const panel = buildAntiraidContainer(config);
      return interaction.reply({
        components: [panel],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (subcommand === "enable") {
      antiraidManager.enableMaster(guildId);
      return interaction.reply({
        components: [buildSuccessNotice("Anti-Raid Activated", "Master anti-raid protection system is now **ENABLED**.")],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (subcommand === "disable") {
      antiraidManager.disableMaster(guildId);
      return interaction.reply({
        components: [buildSuccessNotice("Anti-Raid Deactivated", "Master anti-raid protection system is now **DISABLED**.")],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (subcommand === "massjoin") {
      const state = interaction.options.getString("state");
      const threshold = interaction.options.getInteger("threshold");
      const action = interaction.options.getString("action");
      const lockdown = interaction.options.getBoolean("lockdown");

      if (state === "enable") config.massjoin.enabled = true;
      if (state === "disable") config.massjoin.enabled = false;
      if (threshold && threshold >= 2 && threshold <= 30) config.massjoin.threshold = threshold;
      if (action) config.massjoin.action = action;
      if (lockdown !== null && lockdown !== undefined) config.massjoin.lockChannels = lockdown;

      antiraidManager.setGuildAntiraid(guildId, config);
      return interaction.reply({
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
      }).catch(() => null);
    }

    if (subcommand === "namefilter") {
      const state = interaction.options.getString("state");
      const action = interaction.options.getString("action");

      if (!config.namefilter) config.namefilter = { enabled: false, action: "ban", patterns: [] };
      if (state === "enable") config.namefilter.enabled = true;
      if (state === "disable") config.namefilter.enabled = false;
      if (action) config.namefilter.action = action;

      antiraidManager.setGuildAntiraid(guildId, config);
      return interaction.reply({
        components: [
          buildSuccessNotice(
            "Name Filter Policy Updated",
            `> - **Status:** \`${config.namefilter.enabled ? "ENABLED" : "DISABLED"}\`\n` +
              `> - **Action:** \`${config.namefilter.action.toUpperCase()}\``
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (subcommand === "avatar") {
      const state = interaction.options.getString("state");
      const action = interaction.options.getString("action");

      if (state === "enable") config.avatar.enabled = true;
      if (state === "disable") config.avatar.enabled = false;
      if (action) config.avatar.action = action;

      antiraidManager.setGuildAntiraid(guildId, config);
      return interaction.reply({
        components: [
          buildSuccessNotice(
            "Default Avatar Check Updated",
            `> - **Status:** \`${config.avatar.enabled ? "ENABLED" : "DISABLED"}\`\n` +
              `> - **Action:** \`${config.avatar.action.toUpperCase()}\``
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (subcommand === "newaccounts") {
      const state = interaction.options.getString("state");
      const days = interaction.options.getInteger("days");
      const action = interaction.options.getString("action");

      if (state === "enable") config.newaccounts.enabled = true;
      if (state === "disable") config.newaccounts.enabled = false;
      if (days && days >= 1 && days <= 90) config.newaccounts.threshold = days;
      if (action) config.newaccounts.action = action;

      antiraidManager.setGuildAntiraid(guildId, config);
      return interaction.reply({
        components: [
          buildSuccessNotice(
            "New Account Filter Updated",
            `> - **Status:** \`${config.newaccounts.enabled ? "ENABLED" : "DISABLED"}\`\n` +
              `> - **Minimum Account Age:** \`${config.newaccounts.threshold}\` days\n` +
              `> - **Action:** \`${config.newaccounts.action.toUpperCase()}\``
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (subcommand === "raidmode") {
      config.raidState = !config.raidState;
      if (config.raidState) antiraidManager.incrementStats(guildId, "raidsDetected");
      antiraidManager.setGuildAntiraid(guildId, config);

      if (config.raidState) {
        return interaction.reply({
          components: [
            buildErrorNotice(
              "🚨 EMERGENCY RAID MODE ACTIVATED",
              "Server is now in active Raid Mode. All newly joining members will be automatically banned/kicked on entry."
            ),
          ],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      } else {
        return interaction.reply({
          components: [buildSuccessNotice("Raid Mode Deactivated", "Server has returned to normal operation state.")],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }
    }

    if (subcommand === "whitelist") {
      const action = interaction.options.getString("action");
      const targetUser = interaction.options.getUser("user");

      if (action === "view") {
        const whitelist = config.whitelist || [];
        if (whitelist.length === 0) {
          return interaction.reply({
            components: [buildSuccessNotice("Whitelist Empty", "No users are currently whitelisted.")],
            flags: MessageFlags.IsComponentsV2,
          }).catch(() => null);
        }
        const wlList = whitelist.map((id, i) => `\`${i + 1}.\` <@${id}> (\`${id}\`)`).join("\n");
        return interaction.reply({
          components: [buildSuccessNotice("Anti-Raid Whitelist Directory", wlList)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      if (action === "clear") {
        antiraidManager.clearWhitelist(guildId);
        return interaction.reply({
          components: [buildSuccessNotice("Whitelist Cleared", "All users have been removed from the whitelist.")],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      if (!targetUser) {
        return interaction.reply({
          components: [buildErrorNotice("User Required", "Please specify a target user for add or remove action.")],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      if (action === "remove") {
        const removed = antiraidManager.removeWhitelist(guildId, targetUser.id);
        if (!removed) {
          return interaction.reply({
            components: [buildErrorNotice("Not Whitelisted", `<@${targetUser.id}> is not on the whitelist.`)],
            flags: MessageFlags.IsComponentsV2,
          }).catch(() => null);
        }
        return interaction.reply({
          components: [buildSuccessNotice("User Removed", `<@${targetUser.id}> removed from whitelist.`)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      const added = antiraidManager.addWhitelist(guildId, targetUser.id);
      if (!added) {
        return interaction.reply({
          components: [buildErrorNotice("Already Whitelisted", `<@${targetUser.id}> is already whitelisted.`)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      return interaction.reply({
        components: [buildSuccessNotice("User Whitelisted", `<@${targetUser.id}> added to whitelist.`)],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (subcommand === "log") {
      const channel = interaction.options.getChannel("channel");
      const disable = interaction.options.getBoolean("disable");

      if (disable) {
        config.logChannel = null;
        antiraidManager.setGuildAntiraid(guildId, config);
        return interaction.reply({
          components: [buildSuccessNotice("Logging Disabled", "Anti-Raid event logging disabled.")],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      if (!channel || !channel.isTextBased()) {
        return interaction.reply({
          components: [buildErrorNotice("Invalid Channel", "Please specify a valid text channel.")],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      config.logChannel = channel.id;
      antiraidManager.setGuildAntiraid(guildId, config);
      return interaction.reply({
        components: [buildSuccessNotice("Log Channel Set", `Anti-Raid alerts will be logged to <#${channel.id}>.`)],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (subcommand === "reset") {
      antiraidManager.resetAntiraid(guildId);
      return interaction.reply({
        components: [buildSuccessNotice("Config Reset", "Anti-Raid settings reset to defaults.")],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }
  },
};
