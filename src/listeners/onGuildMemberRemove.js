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
const welcomeManager = require("../lib/welcomeManager");
const welcomeCanvas = require("../lib/welcomeCanvas");

module.exports = {
  name: "onGuildMemberRemove",
  event: Events.GuildMemberRemove,
  once: false,

  async execute(client, member) {
    if (!member.guild) return;

    const goodbyeConfig = welcomeManager.getGuildGoodbye(member.guild.id);
    if (!goodbyeConfig || !goodbyeConfig.enabled || !goodbyeConfig.channelId) return;

    const channel = member.guild.channels.cache.get(goodbyeConfig.channelId);
    if (!channel || !channel.isTextBased()) return;

    const goodbyeText = welcomeManager.formatWelcomeText(
      goodbyeConfig.messageText,
      member,
      member.guild
    );

    const sendFiles = [];
    let mediaGallery = null;

    if (goodbyeConfig.canvasEnabled) {
      try {
        const cardBuffer = await welcomeCanvas.generateGoodbyeCard(member, {
          bgUrl: goodbyeConfig.canvasBgUrl,
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
      `# <:astrix:1527205612205903973> Farewell from ${member.guild.name}\n` +
      `-# *A member has left our community.*\n\n` +
      `<:members:1528311049726591006> **Member Departure**\n` +
      `> -# <:prefix:1528309903972892772> **User:** \`${member.user.username}\` (<@${member.id}>)\n` +
      `> -# <:servers:1528311514065535007> **Remaining Members:** \`${member.guild.memberCount.toLocaleString()}\`\n\n` +
      `> -# <:clock:1528312173275906088> ${goodbyeText}`;

    const footerText = `-# ASTRIXCODE™ Farewell Engine • User ID: \`${member.id}\``;

    const container = new ContainerBuilder();
    if (mediaGallery) {
      container.addMediaGalleryComponents(mediaGallery);
    }
    container
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(mainContent),
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(footerText),
      )
      .addActionRowComponents(row);

    await channel.send({
      components: [container],
      files: sendFiles,
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);
  },
};
