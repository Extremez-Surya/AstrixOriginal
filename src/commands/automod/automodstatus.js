const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const automodManager = require("../../lib/automodManager");
const { buildAutomodContainer } = require("../../lib/security/handleAutomodInteraction");

module.exports = {
  alias: ["automodstatus", "amstatus"],
  category: "Automod",
  desc: "View current AutoMod protection status, modules & stats.",
  botPermissions: ["Administrator"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const config = automodManager.getGuildAutomod(message.guild.id);
    const panel = buildAutomodContainer(config);

    return message.reply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
