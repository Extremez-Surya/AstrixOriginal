const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  alias: ["firstmsg", "firstmessage"],
  category: "Information",
  desc: "Fetch the first message sent in a channel.",

  botPermissions: ["SendMessages", "ReadMessageHistory"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const channel = message.mentions.channels.first() || message.channel;

    if (!channel.isTextBased()) {
      return message.reply(
        "Please specify or mention a valid text-based channel.",
      );
    }

    try {
      const fetched = await channel.messages.fetch({ limit: 1, after: "0" });
      const firstMsg = fetched.first();

      if (!firstMsg) {
        return message.reply("Could not find any messages in that channel.");
      }

      const contentSnippet = firstMsg.content
        ? firstMsg.content.length > 500
          ? `${firstMsg.content.slice(0, 500)}...`
          : firstMsg.content
        : "*No text content (likely an embed, attachment, or system event)*";

      const time = Math.floor(firstMsg.createdTimestamp / 1000);

      const content = [
        `### <:RedMail:1539875508437778483> First Message in ${channel}`,
        `-# *The historical beginning of this channel.*`,
        "",
        `> <:members:1539875392532512808> **Author:** ${firstMsg.author} (\`${firstMsg.author.id}\`)`,
        `> <:clock:1539875400975388713> **Sent:** <t:${time}:f> (<t:${time}:R>)`,
        `> <:rmessage:1539875489601036298> **Content:**`,
        `> ${contentSnippet.replace(/\n/g, "\n> ")}`,
      ].join("\n");

      const jumpButton = new ButtonBuilder()
        .setLabel("Jump to Message")
        .setStyle(ButtonStyle.Link)
        .setURL(firstMsg.url);

      const row = new ActionRowBuilder().addComponents(jumpButton);

      const container = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# *<:astrix:1539875362945900574> Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE. All rights reserved.*`,
          ),
        )
        .addActionRowComponents(row);

      await message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    } catch (e) {
      console.error(e);
      return message.reply(
        "Failed to fetch the first message of this channel. Ensure I have permissions to read message history.",
      );
    }
  },
};
