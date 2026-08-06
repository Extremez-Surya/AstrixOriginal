const { MessageFlags, PermissionFlagsBits } = require("discord.js");
const { createPresetPayload } = require("../../lib/music/presetManager.js");

module.exports = {
  name: "musicpreset",
  description: "Configure the server's Musicard canvas player card theme preset.",
  defaultMemberPermissions: PermissionFlagsBits.ManageGuild,

  async execute(client, interaction) {
    await interaction.deferReply().catch(() => null);

    const { container, attachment } = await createPresetPayload(interaction.guild.id);

    const payload = {
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    };

    if (attachment) {
      payload.files = [attachment];
    }

    return interaction.editReply(payload);
  },
};
