const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const birthdayManager = require("../../lib/birthdayManager");
const { buildBirthdayContainer } = require("../../lib/security/handleBirthdayInteraction");

module.exports = {
  alias: ["birthdaystatus", "bdaystatus"],
  category: "Birthday",
  desc: "View current Birthday system status, channels & registered members.",
  botPermissions: ["Administrator"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const config = birthdayManager.getGuildBirthday(message.guild.id);
    const panel = buildBirthdayContainer(config);

    return message.reply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
