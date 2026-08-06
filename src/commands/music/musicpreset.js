const { MessageFlags } = require("discord.js");
const { createPresetPayload } = require("../../lib/music/presetManager.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["musicpreset", "preset", "musicards", "cardtheme"],
  category: "Music",
  desc: "Configure the server's Musicard canvas player card theme preset.",

  botPermissions: ["SendMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message) {
    const { container, attachment } = await createPresetPayload(
      message.guild.id,
    );

    const payload = {
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    };

    if (attachment) {
      payload.files = [attachment];
    }

    return message.reply(payload);
  },
};
