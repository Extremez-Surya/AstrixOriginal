const {
  MessageFlags,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
} = require("discord.js");
const { buildStarboardContainer } = require("../../lib/starboardManager");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["starboard", "star", "sb"],
  category: "Starboard",
  desc: "Interactive Starboard Control Center to configure message showcasing, emojis, and thresholds.",

  botPermissions: ["SendMessages", "EmbedLinks", "AddReactions"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const isPermitted =
      message.member?.permissions.has(PermissionFlagsBits.ManageGuild) ||
      client.developer?.includes(message.author.id);

    if (!isPermitted) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Permission Denied\n` +
            `-# *You need the Manage Server permission to configure the Starboard system.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const container = buildStarboardContainer(message.guild, message.author);

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });
  },
};
