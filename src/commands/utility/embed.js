const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["embed", "embedbuilder", "mkembed"],
  category: "Utility",
  desc: "Build custom interactive Discord embeds with title, description, color, and images.",
  botPermissions: ["SendMessages", "EmbedLinks"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const rawJson = args.join(" ");

    if (rawJson.startsWith("{")) {
      try {
        const parsed = JSON.parse(rawJson);
        return message.channel.send({ embeds: [parsed] }).catch(() => null);
      } catch {
        return message.reply("Invalid JSON object passed for embed.");
      }
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🎨 Custom Embed Builder\n` +
        `-# *Create rich embeds formatted with title, description, and color.*\n\n` +
        `> - **Usage:** \`.embed {"title":"Hello", "description":"World", "color": 16711680}\` \n` +
        `> - **Usage:** \`.channelpanel\` for full interactive V2 component builder UI`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
