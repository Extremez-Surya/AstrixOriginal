const { buildOwnerContainer } = require("../../lib/security/handleOwnerInteraction");
const { MessageFlags } = require("discord.js");
const noprefixManager = require("../../lib/noprefixManager");

module.exports = {
  alias: ["owner", "ownerpanel", "ownerdashboard"],
  category: "Owner",
  desc: "Bot Owner Control Center dashboard.",
  botPermissions: [],
  userPermissions: [],
  devOnly: true,

  async execute(client, message, args) {
    if (!noprefixManager.isOwner(message.author.id, client)) {
      return message.reply("❌ Access Denied: Only Bot Owners can access the Owner Control Center.").catch(() => null);
    }

    const panel = buildOwnerContainer(client);

    return message.reply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
