const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");

module.exports = {
  alias: ["invc", "in-vc", "in-voice", "vcusers"],
  category: "Voice",
  desc: "View connected member counts across all voice channels in the server.",
  botPermissions: ["SendMessages"],
  userPermissions: [],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const voiceChannels = message.guild.channels.cache
      .filter((c) => c.isVoiceBased() && c.members.size > 0)
      .sort((a, b) => b.members.size - a.members.size);

    if (voiceChannels.size === 0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🎙️ Server Voice Channel Directory\n` +
            `-# *Real-time connected member overview for ${message.guild.name}.*\n\n` +
            `ℹ️ No active members connected to voice channels in this server right now.`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    let totalVoiceMembers = 0;
    const vcEntries = [];

    voiceChannels.forEach((vc) => {
      const count = vc.members.size;
      const humanCount = vc.members.filter((m) => !m.user.bot).size;
      totalVoiceMembers += count;
      vcEntries.push(`> - <#${vc.id}>: **${count}** member(s) (\`${humanCount} human(s)\`)`);
    });

    const mainContent =
      `# 🎙️ Active Voice Channel Directory\n` +
      `-# *Real-time connected member overview across ${message.guild.name}.*\n\n` +
      `### 📊 Overview\n` +
      `> - **Active Voice Channels:** \`${voiceChannels.size}\` VC(s)\n` +
      `> - **Total Connected Members:** \`${totalVoiceMembers}\` member(s)\n\n` +
      `### 🔊 Voice Channels\n` +
      `${vcEntries.join("\n")}`;

    const footerText = `-# ASTRIXCODE™ Voice Moderation Engine • © 2026 ASTRIXCODE`;

    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(mainContent))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(footerText));

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
