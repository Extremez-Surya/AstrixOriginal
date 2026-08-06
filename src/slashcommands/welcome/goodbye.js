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
const welcomeManager = require("../../lib/welcomeManager");
const welcomeCanvas = require("../../lib/welcomeCanvas");

module.exports = {
  name: "goodbye",
  description: "Configure and manage the server goodbye message system.",
  category: "Welcome",
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  others: {
    options: [
      {
        name: "channel",
        description: "Set the channel for goodbye messages",
        type: 1, // SUB_COMMAND
        options: [
          {
            name: "target",
            description: "The text channel to send leave cards in",
            type: 7, // CHANNEL
            channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
            required: true,
          },
        ],
      },
      {
        name: "toggle",
        description: "Enable or disable goodbye messages",
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
        name: "message",
        description: "Set custom goodbye message text",
        type: 1,
        options: [
          {
            name: "template",
            description: "Goodbye message template (supports {user}, {username}, {server}, {memberCount})",
            type: 3, // STRING
            required: true,
          },
        ],
      },
      {
        name: "test",
        description: "Send a live test goodbye card to the configured channel",
        type: 1,
      },
    ],
  },

  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const sub = interaction.options.getSubcommand();

    if (sub === "channel") {
      const channel = interaction.options.getChannel("target");
      welcomeManager.updateGuildGoodbye(interaction.guildId, { channelId: channel.id, enabled: true });
      return interaction.editReply(`✅ Goodbye channel updated to ${channel}. Leave greetings are active!`);
    }

    if (sub === "toggle") {
      const state = interaction.options.getBoolean("state");
      welcomeManager.updateGuildGoodbye(interaction.guildId, { enabled: state });
      return interaction.editReply(`✅ Goodbye greetings module is now **${state ? "ENABLED" : "DISABLED"}**.`);
    }

    if (sub === "message") {
      const template = interaction.options.getString("template");
      welcomeManager.updateGuildGoodbye(interaction.guildId, { messageText: template });
      return interaction.editReply(`✅ Goodbye message template updated successfully!`);
    }

    if (sub === "test") {
      const config = welcomeManager.getGuildGoodbye(interaction.guildId);
      if (!config.channelId) {
        return interaction.editReply("❌ No goodbye channel configured. Use `/goodbye channel` first.");
      }

      const channel = interaction.guild.channels.cache.get(config.channelId);
      if (!channel) {
        return interaction.editReply("❌ Configured goodbye channel no longer exists.");
      }

      const goodbyeText = welcomeManager.formatWelcomeText(
        config.messageText,
        interaction.member,
        interaction.guild
      );

      const sendFiles = [];
      let mediaGallery = null;

      if (config.canvasEnabled) {
        try {
          const cardBuffer = await welcomeCanvas.generateGoodbyeCard(interaction.member, {
            bgUrl: config.canvasBgUrl,
          });
          const canvasAttachment = new AttachmentBuilder(cardBuffer, {
            name: "goodbye-card.png",
          });
          sendFiles.push(canvasAttachment);

          const mediaItem = new MediaGalleryItemBuilder().setURL(
            "attachment://goodbye-card.png",
          );
          mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);
        } catch (_) {}
      }

      const container = new ContainerBuilder();
      if (mediaGallery) container.addMediaGalleryComponents(mediaGallery);

      container
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `# <:astrix:1527205612205903973> [TEST] Goodbye from ${interaction.guild.name}\n` +
          `> ${goodbyeText}`
        ));

      await channel.send({
        components: [container],
        files: sendFiles,
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);

      return interaction.editReply(`✅ Sent a live test goodbye card to ${channel}!`);
    }
  },
};
