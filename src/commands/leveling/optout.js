const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const levelingManager = require("../../lib/levelingManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["optout", "leveloptout", "mutelevel"],
  category: "Leveling",
  desc: "Opt-out of XP accumulation or toggle personal level-up alert notifications.",
  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const guildId = message.guild.id;
    const userId = message.author.id;

    const memberData = levelingManager.getMemberData(guildId, userId);

    if (args[0]?.toLowerCase() === "mute" || args[0]?.toLowerCase() === "alerts") {
      memberData.muteAnnouncements = !memberData.muteAnnouncements;
      levelingManager.setMemberData(guildId, userId, memberData);

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔕 Level-Up Notifications ${memberData.muteAnnouncements ? "Muted" : "Unmuted"}\n` +
          `-# *Personal level-up alert preference updated.*\n\n` +
          `> - **Status:** ${memberData.muteAnnouncements ? "`🔕 Muted`" : "`🔔 Active`"}`
        )
      );

      return message
        .reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        })
        .catch(() => null);
    }

    memberData.optOut = !memberData.optOut;
    levelingManager.setMemberData(guildId, userId, memberData);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${memberData.optOut ? "🚫 Opted Out" : "✅ Opted In"}\n` +
        `-# *Personal leveling tracking status updated.*\n\n` +
        `> - **XP Accumulation:** ${memberData.optOut ? "`Paused`" : "`Active`"}\n` +
        `> - **Leaderboard Visibility:** ${memberData.optOut ? "`Hidden`" : "`Visible`"}`
      )
    );

    return message
      .reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      })
      .catch(() => null);
  },
};
