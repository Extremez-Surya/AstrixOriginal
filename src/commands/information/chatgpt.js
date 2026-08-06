const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");

module.exports = {
  alias: ["chatgpt", "gpt"],
  category: "Information",
  desc: "Ask AI a question or request information on any topic.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    if (!args.length) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Missing Prompt\n` +
            `-# *Please provide a question or topic for the AI.*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const query = args.join(" ");

    // Fetch AI response from free endpoint or placeholder intelligence engine
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
      `### <:chatgpt:1530087438024704070> ChatGPT AI Assistant`,
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

    return message
      .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
      .catch(() => null);
  },
};
