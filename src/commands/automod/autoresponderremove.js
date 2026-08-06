const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["autoresponderremove", "arremove", "ardel"],
  category: "Automod",
  desc: "Delete an existing auto-responder trigger.",
  botPermissions: ["SendMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    const trigger = args.join(" ");
    if (!trigger) return message.reply("Specify trigger name to delete: `.ardel <trigger>`");

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 💬 Auto-Responder Trigger Deleted\n> - **Removed Trigger:** \`${trigger}\``)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
