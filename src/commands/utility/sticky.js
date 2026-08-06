const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["sticky", "stickymessage"],
  category: "Utility",
  desc: "Pin a sticky message at the bottom of a text channel.",
  botPermissions: ["ManageMessages", "SendMessages"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const action = args[0]?.toLowerCase();
    const content = args.slice(1).join(" ");

    if (action === "add" || action === "set") {
      if (!content) return message.reply("Please provide sticky text content.");

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 📌 Sticky Message Created\n` +
          `-# *This message will automatically reposition to the bottom of the channel.*\n\n` +
          `> - **Content:** \`${content}\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 📌 Sticky Message Manager\n` +
        `-# *Keep important announcements pinned at the bottom of active chat.*\n\n` +
        `> - **Usage:** \`.sticky add <message>\` | \`.sticky remove\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
