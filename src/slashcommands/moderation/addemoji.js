const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  parseEmoji,
} = require("discord.js");

module.exports = {
  name: "addemoji",
  category: "Moderation",
  description: "Add or steal a custom emoji into the server.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "emoji",
      description: "Emoji string or direct image URL.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "name",
      description: "Name for the new emoji.",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  botPermissions: ["ManageEmojisAndStickers"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const inputEmoji = interaction.options.getString("emoji");
    let name = interaction.options.getString("name");

    let emojiUrl = null;
    const parsed = parseEmoji(inputEmoji);

    if (parsed && parsed.id) {
      const ext = parsed.animated ? "gif" : "png";
      emojiUrl = `https://cdn.discordapp.com/emojis/${parsed.id}.${ext}`;
      if (!name) name = parsed.name;
    } else if (inputEmoji.startsWith("http")) {
      emojiUrl = inputEmoji;
      if (!name) name = "custom_emoji";
    }

    if (!emojiUrl || !name) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Invalid Emoji Input\n` +
            `-# *Please provide a valid custom emoji or direct image URL.*`,
        ),
      );
      return interaction
        .editReply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    try {
      const cleanName = name.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 32);
      const createdEmoji = await interaction.guild.emojis.create({
        attachment: emojiUrl,
        name: cleanName,
      });

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:astrix:1527205612205903973> Emoji Added Successfully\n` +
              `-# *Successfully added ${createdEmoji} \`:${createdEmoji.name}:\` to the server.*\n\n` +
              `> - **Emoji Name:** \`${createdEmoji.name}\`\n` +
              `> - **Emoji ID:** \`${createdEmoji.id}\``,
          ),
        )
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

      return interaction
        .editReply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    } catch (err) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Failed to Add Emoji\n` +
            `-# *${err.message || "An error occurred while creating the emoji."}*`,
        ),
      );
      return interaction
        .editReply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }
  },
};
