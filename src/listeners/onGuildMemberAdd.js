const {
  Events,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require("discord.js");
const path = require("path");
const welcomeManager = require("../lib/welcomeManager");
const welcomeCanvas = require("../lib/welcomeCanvas");
const { renderWelcomeMessage } = require("../lib/welcome/welcomeBuilder");
const loggingManager = require("../lib/loggingManager");

module.exports = {
  name: "onGuildMemberAdd",
  event: Events.GuildMemberAdd,
  once: false,

  async execute(client, member) {
    if (!member.guild) return;

    // Logging: Member Join / Bot Add
    loggingManager.dispatchLog(
      client,
      member.guild.id,
      member.user.bot ? "botAdd" : "memberJoin",
      {
        target: member.user,
        details: `Account Created: <t:${Math.floor(member.user.createdTimestamp / 1000)}:R> • Member Count: \`${member.guild.memberCount}\``,
      },
      { author: member.user, member }
    ).catch(() => null);

    const config = welcomeManager.getGuildWelcome(member.guild.id);
    if (!config) return;

    // 1. Auto-Role Assignment
    if (config.autoRoleId) {
      const role = member.guild.roles.cache.get(config.autoRoleId);
      if (role && member.guild.members.me.permissions.has("ManageRoles")) {
        await member.roles.add(role).catch(() => null);
      }
    }

    // 2. Auto-Nickname Format
    if (config.autoNickFormat && member.guild.members.me.permissions.has("ManageNicknames")) {
      const formattedNick = welcomeManager.formatWelcomeText(
        config.autoNickFormat,
        member,
        member.guild
      );
      if (formattedNick) {
        await member.setNickname(formattedNick.slice(0, 32)).catch(() => null);
      }
    }

    // 3. Send Join DM if Enabled (Formatted like Channel Welcome Message)
    if (config.joinDmEnabled && config.joinDmText) {
      const dmContent = welcomeManager.formatWelcomeText(
        config.joinDmText,
        member,
        member.guild
      );

      const sendFiles = [];
      let mediaGallery = null;

      if (config.canvasEnabled) {
        try {
          const cardBuffer = await welcomeCanvas.generateWelcomeCard(member, config);
          const canvasAttachment = new AttachmentBuilder(cardBuffer, {
            name: "welcome-card.png",
          });
          sendFiles.push(canvasAttachment);

          const mediaItem = new MediaGalleryItemBuilder().setURL(
            "attachment://welcome-card.png"
          );
          mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);
        } catch (_) {
          const astrixPath = path.join(__dirname, "../assets/astrix.png");
          const bannerAttachment = new AttachmentBuilder(astrixPath, {
            name: "astrix.png",
          });
          sendFiles.push(bannerAttachment);

          const mediaItem = new MediaGalleryItemBuilder().setURL(
            "attachment://astrix.png"
          );
          mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);
        }
      } else {
        const astrixPath = path.join(__dirname, "../assets/astrix.png");
        const bannerAttachment = new AttachmentBuilder(astrixPath, {
          name: "astrix.png",
        });
        sendFiles.push(bannerAttachment);

        const mediaItem = new MediaGalleryItemBuilder().setURL(
          "attachment://astrix.png"
        );
        mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);
      }

      const websiteButton = new ButtonBuilder()
        .setEmoji("🌐")
        .setLabel("Website")
        .setStyle(ButtonStyle.Link)
        .setURL("https://extremez.vercel.app/");

      const supportButton = new ButtonBuilder()
        .setEmoji("💬")
        .setLabel("Support")
        .setStyle(ButtonStyle.Link)
        .setURL("https://discord.gg/FR9pXG2Mwb");

      const row = new ActionRowBuilder().addComponents(websiteButton, supportButton);

      const mainContent =
        `<:members:1539875392532512808> **Member Overview**\n` +
        `> -# <:prefix:1539875384080990228> **Member:** <@${member.id}>\n` +
        `> -# <:servers:1539875396546207795> **Username:** \`${member.user.username}\`\n` +
        `> -# <:list:1539875411780042802> **Member Count:** \`#${member.guild.memberCount.toLocaleString()}\`\n\n` +
        `> ${dmContent}`;

      const footerText = `-# Built with <:Red_heart:1539875406671388683> by ASTRIXCODE™ • User ID: \`${member.id}\``;

      const container = new ContainerBuilder();
      if (mediaGallery) {
        container.addMediaGalleryComponents(mediaGallery);
      }
      container
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true)
        )
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(mainContent))
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true)
        )
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(footerText))
        .addActionRowComponents(row);

      await member.send({
        components: [container],
        files: sendFiles,
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    // 4. Send Welcome Message (Premade Canvas / Custom Embed / Custom Container) in Channel if Enabled
    if (config.enabled && config.channelId) {
      const channel = member.guild.channels.cache.get(config.channelId);
      if (channel && channel.isTextBased()) {
        try {
          const welcomePayload = await renderWelcomeMessage(member, config);
          await channel.send(welcomePayload).catch((err) =>
            console.error("[onGuildMemberAdd] Failed to send welcome:", err)
          );
        } catch (err) {
          console.error("[onGuildMemberAdd] Error rendering welcome message:", err);
        }
      }
    }
  },
};
