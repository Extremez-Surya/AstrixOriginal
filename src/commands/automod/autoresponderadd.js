const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["autoresponderadd", "aradd", "ar-add"],
  category: "Automod",
  desc: "Add a trigger and response for the Auto-Responder.",
  botPermissions: ["SendMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    const text = args.join(" ");
    if (!text.includes("|")) return message.reply("Usage: `.aradd trigger_phrase | response_message`");

    const [trigger, response] = text.split("|").map((s) => s.trim());
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 💬 Auto-Responder Trigger Added\n` +
        `> - **Trigger:** \`${trigger}\` \n` +
        `> - **Response:** \`${response}\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
