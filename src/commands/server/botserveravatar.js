const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require("discord.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["botserveravatar", "botavatar", "setbotserveravatar", "botguildavatar"],
  category: "Server",
  desc: "Change or reset the bot's custom avatar for this server.",

  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const isOwner = message.author.id === message.guild.ownerId;
    const isAdmin = message.member.permissions.has("Administrator");
    const isDev = client.developer?.includes(message.author.id);

    if (!isOwner && !isAdmin && !isDev) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Permission Denied\n` +
            `-# *You must be the Server Owner or have Administrator permissions to change the bot's server avatar.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const attachment = message.attachments.first();
    const avatarURL = attachment ? attachment.url : args[0];

    try {
      if (!avatarURL) {
        await message.guild.members.editMe({ avatar: null });
        const container = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### 🖼️ Bot Server Avatar Reset\n` +
                `-# *The bot's server-specific avatar has been reset to default.*`,
            ),
          )
          .addSeparatorComponents(
            new SeparatorBuilder()
              .setSpacing(SeparatorSpacingSize.Small)
              .setDivider(true),
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`-# *ASTRIXCODE™ Server Customization*`),
          );

        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      const validExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
      const cleanUrl = avatarURL.split("?")[0].toLowerCase();
      if (!validExtensions.some((ext) => cleanUrl.endsWith(ext))) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:red_star:1539875482680696834> Invalid Image Format\n` +
              `-# *Please provide a valid image URL or attachment (PNG, JPG, GIF, or WebP).*`,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      let buffer;
      try {
        const res = await fetch(avatarURL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuf = await res.arrayBuffer();
        buffer = Buffer.from(arrayBuf);
      } catch (fetchErr) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:red_star:1539875482680696834> Image Download Failed\n` +
              `-# *Could not download the specified image. Please verify the URL.*`,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      await message.guild.members.editMe({ avatar: buffer });

      const mediaGallery = new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(avatarURL),
      );

      const container = new ContainerBuilder()
        .addMediaGalleryComponents(mediaGallery)
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🖼️ Bot Server Avatar Updated\n` +
              `> - **Updated By:** <@${message.author.id}>\n` +
              `> - **Server:** \`${message.guild.name}\`\n` +
              `-# *Custom bot server avatar is now active.*`,
          ),
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`-# *ASTRIXCODE™ Server Customization*`),
        );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    } catch (err) {
      console.error("[BotServerAvatar] Error:", err);
      let errMsg = "An error occurred while updating server avatar.";
      if (err.code === 50013) errMsg = "I lack permissions to change my server avatar.";
      else if (err.code === 50035) errMsg = "The image file is too large or unsupported.";

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Update Failed\n-# *${errMsg}*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }
  },
};
