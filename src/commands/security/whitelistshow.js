const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");

module.exports = {
  alias: ["whitelistshow", "wlshow", "wllist", "whitelistlist"],
  category: "Security",
  desc: "Display all whitelisted anti-nuke members.",
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🛡️ Whitelisted Anti-Nuke Members\n` +
          `-# *Members authorized to perform admin actions without triggers.*\n\n` +
          `> - **Whitelisted:** \`None configured\``,
      ),
    );
    return message
      .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
      .catch(() => null);
  },
};
