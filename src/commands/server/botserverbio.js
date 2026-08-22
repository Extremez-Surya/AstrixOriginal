const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["botserverbio", "botbio", "setbotserverbio", "botguildbio"],
  category: "Server",
  desc: "Set or reset the bot's custom server bio / About Me for this server.",

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
            `-# *You need Administrator permission or be the Server Owner to change the bot's server bio.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const bio = args.join(" ");

    try {
      if (!bio || bio.toLowerCase() === "reset") {
        await message.guild.members.editMe({ bio: null });
        const container = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### 📝 Bot Server Bio Reset\n` +
                `-# *The bot's server bio has been reset to default.*`,
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

      if (bio.length > 190) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:red_star:1539875482680696834> Bio Too Long\n` +
              `-# *Server bio must be 190 characters or less (currently ${bio.length} characters).*`,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      await message.guild.members.editMe({ bio: bio });

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 📝 Bot Server Bio Updated\n` +
              `> - **New Bio:** \`${bio}\`\n` +
              `> - **Updated By:** <@${message.author.id}>\n` +
              `-# *Custom bot server bio has been applied.*`,
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
      console.error("[BotServerBio] Error:", err);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Bio Update Notice\n` +
            `-# *Could not update server bio: ${err.message || "Discord API error."}*`,
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
