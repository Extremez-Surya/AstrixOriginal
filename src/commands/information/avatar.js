const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require("discord.js");

module.exports = {
  alias: ["avatar", "av", "pfp"],
  category: "Information",
  desc: "View a user's global or server avatar.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    let targetUser = message.mentions.users.first() || message.author;
    if (!message.mentions.users.first() && args[0]) {
      try {
        const fetched = await client.users.fetch(args[0]);
        if (fetched) targetUser = fetched;
      } catch (e) {}
    }

    let user;
    try {
      user = await client.users.fetch(targetUser.id, { force: true });
    } catch (e) {
      return message.reply({
        content: "Could not retrieve user avatar data.",
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const member = await message.guild.members
      .fetch(targetUser.id)
      .catch(() => null);

    const globalAvatar = user.displayAvatarURL({ size: 2048 });
    const serverAvatar = member ? member.avatarURL({ size: 2048 }) : null;

    // Helper function to build the container based on type
    const buildAvatarResponse = (type, disableAll = false) => {
      const isGlobal = type === "global";
      const pngUrl = isGlobal
        ? user.displayAvatarURL({ extension: "png", size: 2048 })
        : member.avatarURL({ extension: "png", size: 2048 });
      const jpgUrl = isGlobal
        ? user.displayAvatarURL({ extension: "jpg", size: 2048 })
        : member.avatarURL({ extension: "jpg", size: 2048 });
      const webpUrl = isGlobal
        ? user.displayAvatarURL({ extension: "webp", size: 2048 })
        : member.avatarURL({ extension: "webp", size: 2048 });

      const mediaItem = new MediaGalleryItemBuilder().setURL(webpUrl);
      const mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);

      const userTag =
        user.discriminator && user.discriminator !== "0"
          ? `${user.username}#${user.discriminator}`
          : user.username;

      const mainContent =
        `### <:members:1528311049726591006> ${isGlobal ? "Global Profile Avatar" : "Server Profile Avatar"} ── ${user.username}\n\n` +
        `> -# <:servers:1528311514065535007> **User** ─ \`${userTag}\`\n` +
        `> -# <:prefix:1528309903972892772> **Type** ─ \`${isGlobal ? "Global Profile Avatar" : "Server Profile Avatar"}\`\n` +
        `> -# <:list:1528313871889334382> **Links** ─ [PNG](${pngUrl}) • [JPG](${jpgUrl}) • [WEBP](${webpUrl})`;

      const requesterTag =
        message.author.discriminator && message.author.discriminator !== "0"
          ? `${message.author.username}#${message.author.discriminator}`
          : message.author.username;
      const footerContent = `-# Requested by ${requesterTag} • Built with <a:Red_heart:1528312958541631578> by ASTRIXCODE™`;

      // Interactive Buttons
      const globalBtn = new ButtonBuilder()
        .setCustomId("global")
        .setLabel("Global Avatar")
        .setStyle(isGlobal ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(disableAll || !globalAvatar);

      const serverBtn = new ButtonBuilder()
        .setCustomId("server")
        .setLabel("Server Avatar")
        .setStyle(!isGlobal ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(disableAll || !serverAvatar);

      const row = new ActionRowBuilder().addComponents(globalBtn, serverBtn);

      return new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(mainContent),
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addMediaGalleryComponents(mediaGallery)
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(footerContent),
        )
        .addActionRowComponents(row);
    };

    // Determine initial view (Global if exists, else server)
    const initialView = "global";
    const initialContainer = buildAvatarResponse(initialView);

    const replyMsg = await message.reply({
      components: [initialContainer],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });

    // Create interaction collector
    const filter = (i) => i.user.id === message.author.id;
    const collector = replyMsg.createMessageComponentCollector({
      filter,
      time: 60000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();
      const updatedContainer = buildAvatarResponse(i.customId);
      await i.editReply({
        components: [updatedContainer],
        allowedMentions: { parse: [], repliedUser: false },
      });
    });

    collector.on("end", async (collected) => {
      try {
        const lastSelected = collected.last()?.customId || initialView;
        const finalContainer = buildAvatarResponse(lastSelected, true);
        await replyMsg.edit({
          components: [finalContainer],
          allowedMentions: { parse: [], repliedUser: false },
        });
      } catch (e) {}
    });
  },
};
