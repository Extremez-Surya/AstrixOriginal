const { buildOwnerContainer } = require("../../lib/security/handleOwnerInteraction");
const { MessageFlags } = require("discord.js");
const noprefixManager = require("../../lib/noprefixManager");

module.exports = {
  alias: ["owner", "ownerpanel", "ownerdashboard", "op", "dev"],
  category: "Owner",
  desc: "Astrix Bot Owner Control Center & Master Telemetry Dashboard.",
  botPermissions: [],
  userPermissions: [],
  devOnly: true,

  async execute(client, message, args) {
    if (!noprefixManager.isOwner(message.author.id, client)) {
      return message.reply("❌ Access Denied: Only Bot Owners can access the Owner Control Center.").catch(() => null);
    }

    const panel = buildOwnerContainer(client, "overview", 1);

    return message.reply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
