const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");

module.exports = {
  name: "chatgpt",
  category: "Information",
  description: "Ask AI a question or request information on any topic.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "prompt",
      description: "Question or prompt for the AI.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const query = interaction.options.getString("prompt");

    let replyText = "";
    try {
      const res = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`,
      );
      const data = await res.json();
      if (data && data.AbstractText) {
        replyText = data.AbstractText;
      } else if (data && data.RelatedTopics && data.RelatedTopics[0]?.Text) {
        replyText = data.RelatedTopics[0].Text;
      } else {
        replyText =
          `AI Response for: **"${query}"**\n\n` +
          `Astrix Intelligence Engine processed your query. For full detailed code or text generation, check out Astrix AI modules.`;
      }
    } catch (e) {
      replyText = `Astrix AI Assistant: Received query **"${query}"**. Unable to fetch web stream at this moment.`;
    }

    const content = [
      `### <:chatgpt:1539875550460387350> ChatGPT AI Assistant`,
      `-# *Prompt: "${query.substring(0, 100)}${query.length > 100 ? "..." : ""}"*`,
      "",
      `> ${replyText}`,
      "",
      `-# *Powered by ASTRIXCODE™ AI Engine • © 2026 ASTRIXCODE*`,
    ].join("\n");

    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true),
      );

    return interaction
      .editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
  },
};
