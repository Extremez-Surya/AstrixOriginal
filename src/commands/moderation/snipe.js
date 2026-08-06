const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  AttachmentBuilder,
  SectionBuilder,
  ThumbnailBuilder,
} = require("discord.js");

module.exports = {
  alias: ["snipe", "s"],
  category: "Moderation",
  desc: "Inspect the most recently deleted message in this channel.",

  botPermissions: ["SendMessages"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const snipe = client.snipes?.get(message.channel.id);

    if (!snipe) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Nothing to Snipe\n` +
            `-# *There are no recently deleted messages recorded in this channel.*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const deleteTs = Math.floor(snipe.deletedTimestamp / 1000);
    const author = snipe.author;

    const content = [
      `### <a:ticky_red:1530092915735400548> Sniped Message ── ${author?.username || "Unknown User"}`,
      `-# *Deleted <t:${deleteTs}:R> (<t:${deleteTs}:T>)*`,
      "",
      `> <:rmessage:1528690062005506160> **Message Content:**`,
      `> ${snipe.content ? snipe.content.replace(/\n/g, "\n> ") : "*No text content (Attachment only)*"}`,
      "",
      `> <:members:1528311049726591006> **Author:** ${author ? `${author} (\`${author.id}\`)` : "*Unknown*"}`,
      snipe.attachments.length > 0
        ? `> <:linkRed:1528701532617314425> **Attachments:** \`${snipe.attachments.length}\` attached file(s)`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const files = [];
    const container = new ContainerBuilder();
    const avatarUrl = author?.displayAvatarURL({ extension: "png", size: 512 });

    if (avatarUrl) {
      try {
        const avatarAttachment = new AttachmentBuilder(avatarUrl, {
          name: "author_avatar.png",
        });
        files.push(avatarAttachment);

        const section = new SectionBuilder()
          .setThumbnailAccessory(
            new ThumbnailBuilder().setURL("attachment://author_avatar.png"),
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(content),
          );

        container.addSectionComponents(section);
      } catch (e) {
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(content),
        );
      }
    } else {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(content),
      );
    }

    container
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# *Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE*`,
        ),
      );

    return message
      .reply({
        components: [container],
        files: files,
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
  },
};
