const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const snipeManager = require("../../lib/snipeManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["clearsnipe", "csnipe", "snipesclear"],
  category: "Miscellaneous",
  desc: "Clear sniped messages, edits, and reactions for this channel or the server.",
  botPermissions: ["SendMessages"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const isGuildWide = args[0]?.toLowerCase() === "all" || args[0]?.toLowerCase() === "server";

    if (isGuildWide) {
      if (!message.member.permissions.has("Administrator")) {
        return message.reply("You need `Administrator` permissions to clear snipes server-wide.");
      }
      snipeManager.clearSnipeData(message.guild.id);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.success || "✅"} Server Snipe Cache Cleared\n` +
          `-# *All recorded message deletions, edits, and reaction snipes cleared for this server.*`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    snipeManager.clearSnipeData(message.guild.id, message.channel.id);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.success || "✅"} Channel Snipe Cache Cleared\n` +
        `-# *Deleted messages, edits, and reaction snipes cleared for ${message.channel}.*`
      )
    );

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
