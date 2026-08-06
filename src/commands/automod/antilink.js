const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["antilink", "antiinvites", "linkblock"],
  category: "Automod",
  desc: "Block unauthorized links and Discord invite URLs in text channels.",
  botPermissions: ["ManageMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    const option = args[0]?.toLowerCase();

    if (option === "enable" || option === "on") {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔗 Anti-Link Protection Enabled\n` +
          `-# *Unauthorized links and discord invites will be deleted automatically.*\n\n` +
          `> - **Blocked:** \`http://, https://, discord.gg, discord.com/invite\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (option === "disable" || option === "off") {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔗 Anti-Link Protection Disabled\n` +
          `-# *Link sharing is now allowed for all members.*`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🔗 Anti-Link Settings\n` +
        `-# *Filter dangerous and unauthorized web links.*\n\n` +
        `> - **Usage:** \`.antilink enable\` | \`.antilink disable\`\n` +
        `> - **Status:** \`ENABLED\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
