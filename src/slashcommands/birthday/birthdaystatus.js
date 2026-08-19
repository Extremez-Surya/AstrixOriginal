const {
  ApplicationCommandType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const birthdayManager = require("../../lib/birthdayManager");
const { buildBirthdayContainer } = require("../../lib/security/handleBirthdayInteraction");

module.exports = {
  name: "birthdaystatus",
  category: "Birthday",
  description: "View current Birthday system status, channels & registered members.",
  type: ApplicationCommandType.ChatInput,
  botPermissions: ["Administrator"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, interaction) {
    if (!interaction.guild) return;

    const config = birthdayManager.getGuildBirthday(interaction.guild.id);
    const panel = buildBirthdayContainer(config);

    return interaction.reply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);
  },
};
