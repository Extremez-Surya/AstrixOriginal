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
  alias: ["botserverbanner", "botbanner", "setbotserverbanner", "botguildbanner"],
  category: "Server",
  desc: "Set or reset a custom server banner for the bot.",

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
          `### <a:red_star:1528688099436003419> Permission Denied\n` +
            `-# *You need Administrator permission or be the Server Owner to change the bot's banner.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const attachment = message.attachments.first();
    const bannerURL = attachment ? attachment.url : args[0];

    try {
      if (!bannerURL) {
        await message.guild.members.editMe({ banner: null });
        const container = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### 🖼️ Bot Server Banner Reset\n` +
                `-# *The bot's server banner has been reset to default.*`,
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
      const cleanUrl = bannerURL.split("?")[0].toLowerCase();
      if (!validExtensions.some((ext) => cleanUrl.endsWith(ext))) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Invalid Image Format\n` +
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
        const res = await fetch(bannerURL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuf = await res.arrayBuffer();
        buffer = Buffer.from(arrayBuf);
      } catch (fetchErr) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Download Failed\n` +
              `-# *Could not download the banner image. Please verify the URL.*`,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      await message.guild.members.editMe({ banner: buffer });

      const mediaGallery = new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(bannerURL),
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
            `### 🖼️ Bot Server Banner Updated\n` +
              `> - **Updated By:** <@${message.author.id}>\n` +
              `> - **Server:** \`${message.guild.name}\`\n` +
              `-# *Custom bot server banner is now active.*`,
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
      console.error("[BotServerBanner] Error:", err);
      let errMsg = "An error occurred while updating the banner. Note that Discord may require Server Boost Level 2+ for bot per-server banners.";
      if (err.code === 50013) errMsg = "I lack permissions to change my banner in this server.";
      else if (err.code === 50035) errMsg = "The banner image is too large or unsupported.";

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Banner Update Notice\n-# *${errMsg}*`,
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
