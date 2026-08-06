const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
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
  name: "firstmsg",
  category: "Information",
  description: "Fetch the first message sent in a channel.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "channel",
      description: "The text channel to get the first message from.",
      type: ApplicationCommandOptionType.Channel,
      required: false,
    },
  ],

  botPermissions: ["SendMessages", "ReadMessageHistory"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();

    const channel =
      interaction.options.getChannel("channel") || interaction.channel;

    if (!channel.isTextBased()) {
      return interaction.editReply("Please select a text-based channel.");
    }

    try {
      const fetched = await channel.messages.fetch({ limit: 1, after: "0" });
      const firstMsg = fetched.first();

      if (!firstMsg) {
        return interaction.editReply(
          "Could not find any messages in that channel.",
        );
      }

      const contentSnippet = firstMsg.content
        ? firstMsg.content.length > 500
          ? `${firstMsg.content.slice(0, 500)}...`
          : firstMsg.content
        : "*No text content (likely an embed, attachment, or system event)*";

      const time = Math.floor(firstMsg.createdTimestamp / 1000);

      const content = [
        `### <a:RedMail:1528693438650781696> First Message in ${channel}`,
        `-# *The historical beginning of this channel.*`,
        "",
        `> <:members:1528311049726591006> **Author:** ${firstMsg.author} (\`${firstMsg.author.id}\`)`,
        `> <:clock:1528312173275906088> **Sent:** <t:${time}:f> (<t:${time}:R>)`,
        `> <:rmessage:1528690062005506160> **Content:**`,
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
            `-# *<:astrix:1527205612205903973> Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE. All rights reserved.*`,
          ),
        )
        .addActionRowComponents(row);

      await interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    } catch (e) {
      console.error(e);
      return interaction.editReply(
        "Failed to fetch the first message of this channel. Ensure I have permissions to read message history.",
      );
    }
  },
};
