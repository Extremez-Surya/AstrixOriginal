const {
  PermissionFlagsBits,
  ChannelType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  AttachmentBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require("discord.js");
const goodbyeManager = require("../../lib/goodbyeManager");
const welcomeCanvas = require("../../lib/welcomeCanvas");

module.exports = {
  name: "goodbye",
  description: "Configure and manage the server goodbye message system.",
  category: "Goodbye",
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  others: {
    options: [
      {
        name: "show",
        description: "Show the current goodbye system dashboard and settings",
        type: 1, // SUB_COMMAND
      },
      {
        name: "add",
        description: "Add a goodbye channel",
        type: 1,
        options: [
          {
            name: "channel",
            description: "The text channel to send leave cards in",
            type: 7, // CHANNEL
            channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
            required: true,
          },
          {
            name: "self_destruct",
            description: "Auto-delete duration in seconds (6-60)",
            type: 4, // INTEGER
            minValue: 6,
            maxValue: 60,
            required: false,
          },
        ],
      },
      {
        name: "remove",
        description: "Remove a goodbye channel",
        type: 1,
        options: [
          {
            name: "channel",
            description: "The text channel to remove",
            type: 7,
            channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
            required: true,
          },
        ],
      },
      {
        name: "list",
        description: "List all configured goodbye channels",
        type: 1,
      },
      {
        name: "toggle",
        description: "Enable or disable goodbye messages globally",
        type: 1,
        options: [
          {
            name: "state",
            description: "True to enable, false to disable",
            type: 5, // BOOLEAN
            required: true,
          },
        ],
      },
      {
        name: "test",
        description: "Send a live test goodbye card to configured channels",
        type: 1,
        options: [
          {
            name: "channel",
            description: "Specific channel to test (optional)",
            type: 7,
            channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
            required: false,
          },
        ],
      },
      {
        name: "reset",
        description: "Reset goodbye settings to defaults",
        type: 1,
      },
    ],
  },

  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const sub = interaction.options.getSubcommand();
    const config = goodbyeManager.getGuildGoodbye(interaction.guildId);

    if (sub === "show") {
      const channelMentions = config.channels.length > 0
        ? config.channels.map((c) => `<#${c.channelId}>`).join(", ")
        : "`None`";

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# <:leave:1528311514065535007> Goodbye & Leave System Control Panel\n` +
            `-# *Full overview of member departure greetings for ${interaction.guild.name}.*\n\n` +
            `### 📌 Status & Channels\n` +
            `> - **Module State:** \`${config.enabled ? "ENABLED 🟢" : "DISABLED 🔴"}\`\n` +
            `> - **Target Channels:** ${channelMentions}\n` +
            `> - **Total Channels:** \`${config.channels.length} / 5\``
        )
      );

      return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    if (sub === "add") {
      const channel = interaction.options.getChannel("channel");
      const selfDestruct = interaction.options.getInteger("self_destruct");

      if (config.channels.length >= 5) {
        return interaction.editReply("❌ Maximum limit of 5 goodbye channels reached.");
      }

      goodbyeManager.addGoodbyeChannel(interaction.guildId, {
        channelId: channel.id,
        selfDestruct,
      });

      goodbyeManager.updateGuildGoodbye(interaction.guildId, { enabled: true });
      return interaction.editReply(
        `✅ Added ${channel} to goodbye channels list.${selfDestruct ? ` Auto-destruct set to **${selfDestruct}s**.` : ""}`
      );
    }

    if (sub === "remove") {
      const channel = interaction.options.getChannel("channel");
      const success = goodbyeManager.removeGoodbyeChannel(interaction.guildId, channel.id);
      if (!success) {
        return interaction.editReply("❌ That channel is not in the goodbye channels list.");
      }
      return interaction.editReply(`✅ Removed ${channel} from goodbye channels.`);
    }

    if (sub === "list") {
      if (config.channels.length === 0) {
        return interaction.editReply("ℹ️ No goodbye channels configured. Use `/goodbye add` first.");
      }

      const listStr = config.channels
        .map((c, i) => `**${i + 1}.** <#${c.channelId}> (Auto-delete: \`${c.selfDestruct ? `${c.selfDestruct}s` : "Off"}\`)`)
        .join("\n");

      return interaction.editReply(`### 📋 Configured Goodbye Channels\n${listStr}`);
    }

    if (sub === "toggle") {
      const state = interaction.options.getBoolean("state");
      goodbyeManager.updateGuildGoodbye(interaction.guildId, { enabled: state });
      return interaction.editReply(`✅ Goodbye leave greetings are now **${state ? "ENABLED 🟢" : "DISABLED 🔴"}**.`);
    }

    if (sub === "test") {
      const channelOpt = interaction.options.getChannel("channel");
      let targetChannels = [];

      if (channelOpt) {
        const chConfig = config.channels.find((c) => c.channelId === channelOpt.id);
        if (!chConfig) {
          return interaction.editReply("❌ That channel is not configured as a goodbye channel.");
        }
        targetChannels.push(chConfig);
      } else {
        targetChannels = config.channels || [];
      }

      if (targetChannels.length === 0) {
        return interaction.editReply("❌ No goodbye channels configured. Use `/goodbye add` first.");
      }

      const { handleGoodbyeInteraction } = require("../../lib/goodbye/handleGoodbyeInteraction");
      const fakeInteraction = {
        isButton: () => true,
        isModalSubmit: () => false,
        customId: targetChannels.length === 1 ? `goodbye_testch_${targetChannels[0].channelId}_${interaction.user.id}` : `goodbye_test_${interaction.user.id}`,
        user: interaction.user,
        member: interaction.member,
        guild: interaction.guild,
        guildId: interaction.guildId,
        reply: (opts) => interaction.followUp(opts),
        deferReply: () => Promise.resolve(),
        editReply: (opts) => interaction.editReply(opts),
      };

      await handleGoodbyeInteraction(client, fakeInteraction);
      return interaction.editReply("✅ Dispatched live test goodbye card.");
    }

    if (sub === "reset") {
      goodbyeManager.resetGuildGoodbye(interaction.guildId);
      return interaction.editReply("✅ Reset all goodbye settings to defaults.");
    }
  },
};
