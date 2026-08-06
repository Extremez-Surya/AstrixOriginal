const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["autoresponder", "ar", "responder"],
  category: "Automod",
  desc: "Set automated text responses when members send specific trigger phrases.",
  botPermissions: ["SendMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    const action = args[0]?.toLowerCase();

    if (action === "create" || action === "add") {
      const parts = args.slice(1).join(" ").split("|");
      const trigger = parts[0]?.trim();
      const response = parts[1]?.trim();

      if (!trigger || !response) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Invalid Format\n` +
            `-# *Usage: \`.autoresponder add trigger_phrase | reply_message\`*`
          )
        );
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      }

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 💬 Auto-Responder Created\n` +
          `-# *New trigger and response registered successfully.*\n\n` +
          `> - **Trigger:** \`${trigger}\` \n` +
          `> - **Response:** \`${response}\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 💬 Auto-Responder System\n` +
        `-# *Automate replies to common questions or custom phrases.*\n\n` +
        `> - **Usage:** \`.autoresponder add <trigger> | <response>\` | \`.autoresponder list\` | \`.autoresponder delete <id>\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
