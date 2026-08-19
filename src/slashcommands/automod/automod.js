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
  name: "automod",
  category: "Automod",
  description: "Configure AutoMod protection filters, presets, bad words, ignore rules & logging.",
  type: ApplicationCommandType.ChatInput,
  botPermissions: ["Administrator"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  options: [
    {
      name: "config",
      description: "View and open the interactive AutoMod control dashboard.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "enable",
      description: "Enable master AutoMod system.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "disable",
      description: "Disable master AutoMod system.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "preset",
      description: "Apply a pre-configured protection level preset.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "level",
          description: "Preset level.",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            { name: "Strict (All 14 Modules Enabled)", value: "strict" },
            { name: "Moderate (Standard Community Protection)", value: "moderate" },
            { name: "Light (Basic Invite & Spam Protection)", value: "light" },
          ],
        },
      ],
    },
    {
      name: "words",
      description: "Manage banned words and phrases directory.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "action",
          description: "Directory action.",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            { name: "Add Word", value: "add" },
            { name: "Remove Word", value: "remove" },
            { name: "View Directory", value: "view" },
            { name: "Clear Directory", value: "clear" },
          ],
        },
        {
          name: "word",
          description: "Target word or phrase (for add/remove).",
          type: ApplicationCommandOptionType.String,
          required: false,
        },
      ],
    },
    {
      name: "log",
      description: "Set AutoMod audit log channel.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "channel",
          description: "Text channel for violation alerts.",
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
      description: "Reset AutoMod settings for this server to defaults.",
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],

  async execute(client, interaction) {
    if (!interaction.guild) return;

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        components: [
          buildErrorNotice(
            "Access Denied",
            "You need **Manage Server** permission to configure AutoMod settings."
          ),
        ],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const guildId = interaction.guild.id;
    const config = automodManager.getGuildAutomod(guildId);
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "config") {
      const panel = buildAutomodContainer(config);
      return interaction.reply({
        components: [panel],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (subcommand === "enable") {
      automodManager.enableMaster(guildId);
      return interaction.reply({
        components: [buildSuccessNotice("AutoMod Activated", "Master AutoMod system is now **ENABLED**.")],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (subcommand === "disable") {
      automodManager.disableMaster(guildId);
      return interaction.reply({
        components: [buildSuccessNotice("AutoMod Deactivated", "Master AutoMod system is now **DISABLED**.")],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (subcommand === "preset") {
      const level = interaction.options.getString("level");
      automodManager.applyPreset(guildId, level);
      return interaction.reply({
        components: [
          buildSuccessNotice(
            `${automodManager.PRESETS[level].name} Preset Applied`,
            `AutoMod is now **ENABLED** with **${automodManager.PRESETS[level].name}** protection!`
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (subcommand === "words") {
      const action = interaction.options.getString("action");
      const wordArg = interaction.options.getString("word");

      if (action === "view") {
        const words = config.modules?.badwords?.words || [];
        const listText = words.length > 0 ? words.map((w, i) => `\`${i + 1}.\` ||${w}||`).join("\n") : "*No banned words configured.*";
        return interaction.reply({
          components: [buildSuccessNotice(`Banned Words Directory (${words.length})`, listText)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      if (action === "clear") {
        automodManager.clearBadWords(guildId);
        return interaction.reply({
          components: [buildSuccessNotice("Directory Cleared", "Cleared all banned words.")],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      if (!wordArg) {
        return interaction.reply({
          components: [buildErrorNotice("Word Required", "Please specify a word or phrase.")],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      if (action === "add") {
        automodManager.addBadWord(guildId, wordArg);
        return interaction.reply({
          components: [buildSuccessNotice("Word Added", `Added \`||${wordArg}||` + "` to banned words.")],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      if (action === "remove") {
        automodManager.removeBadWord(guildId, wordArg);
        return interaction.reply({
          components: [buildSuccessNotice("Word Removed", `Removed \`||${wordArg}||` + "` from banned words.")],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }
    }

    if (subcommand === "log") {
      const channel = interaction.options.getChannel("channel");
      const disable = interaction.options.getBoolean("disable");

      if (disable) {
        config.logChannel = null;
        automodManager.setGuildAutomod(guildId, config);
        return interaction.reply({
          components: [buildSuccessNotice("Logging Disabled", "AutoMod audit logging disabled.")],
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
      automodManager.setGuildAutomod(guildId, config);
      return interaction.reply({
        components: [buildSuccessNotice("Log Channel Set", `AutoMod violation alerts will be logged to <#${channel.id}>.`)],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (subcommand === "reset") {
      automodManager.resetAutomod(guildId);
      return interaction.reply({
        components: [buildSuccessNotice("Config Reset", "AutoMod settings reset to defaults.")],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }
  },
};
