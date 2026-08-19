const { MessageFlags, PermissionFlagsBits, ChannelType, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require("discord.js");
const nukeManager = require("../../lib/nukeManager");
const noprefixManager = require("../../lib/noprefixManager");
const { buildNukeContainer } = require("../../lib/security/handleNukeInteraction");
const EMOJIS = require("../../lib/emojis");

function buildNotice(title, description) {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${title}`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(description))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Hardened Nuke Engine`));
  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

module.exports = {
  name: "nuke",
  description: "Hardened Sub-0.1s Channel Clone & Nuke control center.",
  defaultMemberPermissions: PermissionFlagsBits.ManageChannels,
  options: [
    {
      name: "channel",
      description: "Channel to instant nuke or configure.",
      type: 7, // CHANNEL
      required: false,
    },
  ],

  async execute(client, interaction) {
    if (!interaction.guild) return;

    const isMemberAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
    const isBotOwner = noprefixManager.isOwner(interaction.user.id, client);

    if (!isMemberAdmin && !isBotOwner) {
      return interaction.reply(buildNotice(`${EMOJIS.error || "❌"} Missing Permissions`, "Administrator permission required to use Nuke commands."));
    }

    const targetChannel = interaction.options.getChannel("channel") || interaction.channel;

    if (!targetChannel || !targetChannel.isTextBased()) {
      return interaction.reply(buildNotice(`${EMOJIS.error || "❌"} Invalid Channel`, "Target must be a text-based channel."));
    }

    const nukeContainer = buildNukeContainer(interaction.guild, targetChannel, interaction.user);

    return interaction.reply({
      components: [nukeContainer],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
