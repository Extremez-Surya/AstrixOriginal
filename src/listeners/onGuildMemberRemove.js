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
const goodbyeManager = require("../lib/goodbyeManager");
const welcomeCanvas = require("../lib/welcomeCanvas");

module.exports = {
  name: "onGuildMemberRemove",
  event: Events.GuildMemberRemove,
  once: false,

  async execute(client, member) {
    if (!member.guild) return;

    const goodbyeConfig = goodbyeManager.getGuildGoodbye(member.guild.id);
    if (!goodbyeConfig) return;

    // 1. Send Leave DM if Enabled (Direct Message to Departing Member)
    if (goodbyeConfig.leaveDmEnabled && goodbyeConfig.leaveDmText) {
      try {
        const dmContent = goodbyeManager.formatGoodbyeText(
          goodbyeConfig.leaveDmText,
          member,
          member.guild
        );

        const sendFiles = [];
        let mediaGallery = null;

        if (goodbyeConfig.channels && goodbyeConfig.channels[0]?.canvasEnabled !== false) {
          try {
            const cardBuffer = await welcomeCanvas.generateGoodbyeCard(member, goodbyeConfig.channels[0] || {});
            const canvasAttachment = new AttachmentBuilder(cardBuffer, {
              name: "goodbye-card.png",
            });
            sendFiles.push(canvasAttachment);

            const mediaItem = new MediaGalleryItemBuilder().setURL(
              "attachment://goodbye-card.png"
            );
            mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);
          } catch (_) {}
        }

        const websiteButton = new ButtonBuilder()
          .setEmoji("<:website:1528304906400960582>")
          .setLabel("Website")
          .setStyle(ButtonStyle.Link)
          .setURL("https://extremez.vercel.app/");

        const supportButton = new ButtonBuilder()
          .setEmoji("<:discord:1527683374523744367>")
          .setLabel("Support")
          .setStyle(ButtonStyle.Link)
          .setURL("https://discord.gg/FR9pXG2Mwb");

        const row = new ActionRowBuilder().addComponents(websiteButton, supportButton);

        const mainContent =
          `<:members:1528311049726591006> **Member Departure Overview**\n` +
          `> -# <:prefix:1528309903972892772> **Member:** <@${member.id}>\n` +
          `> -# <:servers:1528311514065535007> **Username:** \`${member.user.username}\`\n` +
          `> -# <:list:1528313871889334382> **Remaining Members:** \`${member.guild.memberCount.toLocaleString()}\`\n\n` +
          `> ${dmContent}`;

        const footerText = `-# ASTRIXCODE™ Farewell Engine • User ID: \`${member.id}\``;

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
      } catch (err) {
        console.error("[onGuildMemberRemove] Failed to send Leave DM:", err);
      }
    }

    // 2. Send Goodbye Message & Canvas Card to Configured Server Channels
    if (!goodbyeConfig.enabled || !goodbyeConfig.channels || goodbyeConfig.channels.length === 0) {
      return;
    }

    for (const channelConfig of goodbyeConfig.channels) {
      try {
        const channel = member.guild.channels.cache.get(channelConfig.channelId);
        if (!channel || !channel.isTextBased()) continue;

        const customButtons = goodbyeManager.buildGoodbyeButtons(channelConfig, member);

        const sendFiles = [];
        let mediaGallery = null;

        if (channelConfig.canvasEnabled !== false) {
          try {
            const cardBuffer = await welcomeCanvas.generateGoodbyeCard(member, channelConfig);
            const canvasAttachment = new AttachmentBuilder(cardBuffer, {
              name: "goodbye-card.png",
            });
            sendFiles.push(canvasAttachment);

            const mediaItem = new MediaGalleryItemBuilder().setURL(
              "attachment://goodbye-card.png"
            );
            mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);
          } catch (_) {}
        }

        const websiteButton = new ButtonBuilder()
          .setEmoji("<:website:1528304906400960582>")
          .setLabel("Website")
          .setStyle(ButtonStyle.Link)
          .setURL("https://extremez.vercel.app/");

        const supportButton = new ButtonBuilder()
          .setEmoji("<:discord:1527683374523744367>")
          .setLabel("Support")
          .setStyle(ButtonStyle.Link)
          .setURL("https://discord.gg/FR9pXG2Mwb");

        const actionRow = customButtons || new ActionRowBuilder().addComponents(websiteButton, supportButton);

        const formattedDesc = goodbyeManager.formatGoodbyeText(
          channelConfig.description || channelConfig.content || "Goodbye **{username}**! We'll miss you. We now have {memberCount} members.",
          member,
          member.guild
        );

        let mainContent =
          `<:members:1528311049726591006> **Member Departure**\n` +
          `> -# <:prefix:1528309903972892772> **User:** \`${member.user.username}\` (<@${member.id}>)\n` +
          `> -# <:servers:1528311514065535007> **Remaining Members:** \`${member.guild.memberCount.toLocaleString()}\`\n\n` +
          `> -# <:clock:1528312173275906088> ${formattedDesc}`;

        if (channelConfig.title) {
          const titleFormatted = goodbyeManager.formatGoodbyeText(channelConfig.title, member, member.guild);
          mainContent = `# ${titleFormatted}\n\n` + mainContent;
        }

        const footerText = channelConfig.footer
          ? goodbyeManager.formatGoodbyeText(channelConfig.footer, member, member.guild)
          : `-# ASTRIXCODE™ Farewell Engine • User ID: \`${member.id}\``;

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
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(mainContent)
          )
          .addSeparatorComponents(
            new SeparatorBuilder()
              .setSpacing(SeparatorSpacingSize.Small)
              .setDivider(true)
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(footerText)
          )
          .addActionRowComponents(actionRow);

        const sendOptions = {
          components: [container],
          files: sendFiles,
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: ["users"] },
        };

        const sentMsg = await channel.send(sendOptions).catch((e) =>
          console.error("[goodbye] Channel send error:", e)
        );

        if (sentMsg && channelConfig.selfDestruct) {
          setTimeout(() => {
            sentMsg.delete().catch(() => {});
          }, channelConfig.selfDestruct * 1000);
        }
      } catch (err) {
        console.error("[goodbye] Member leave error:", err);
      }
    }
  },
};
