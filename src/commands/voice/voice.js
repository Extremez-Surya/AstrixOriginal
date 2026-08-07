const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  alias: ["voice", "vcmode", "vchelp"],
  category: "Voice",
  desc: "Comprehensive Voice Channel Moderation Dashboard & Control Engine.",
  botPermissions: ["MuteMembers", "DeafenMembers", "MoveMembers"],
  userPermissions: ["MuteMembers"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const voiceChannels = message.guild.channels.cache.filter((c) => c.isVoiceBased());
    const totalVCs = voiceChannels.size;

    let connectedMembers = 0;
    let mutedCount = 0;
    let deafenedCount = 0;
    let streamingCount = 0;

    voiceChannels.forEach((vc) => {
      vc.members.forEach((m) => {
        if (!m.user.bot) {
          connectedMembers++;
          if (m.voice.serverMute || m.voice.selfMute) mutedCount++;
          if (m.voice.serverDeaf || m.voice.selfDeaf) deafenedCount++;
          if (m.voice.streaming) streamingCount++;
        }
      });
    });

    const userVC = message.member.voice.channel;
    const userVCStatus = userVC ? `<#${userVC.id}> (\`${userVC.members.size} connected\`)` : "`Not Connected`";

    const mainContent =
      `# 🎙️ Voice Moderation Control Dashboard\n` +
      `-# *Manage connected voice channels and members across ${message.guild.name}.*\n\n` +
      `### 📊 Server Voice Statistics\n` +
      `> - **Your Status:** ${userVCStatus}\n` +
      `> - **Active Voice Channels:** \`${totalVCs}\` VC(s)\n` +
      `> - **Total Connected Members:** \`${connectedMembers}\` member(s)\n` +
      `> - **Muted / Deafened / Streaming:** \`${mutedCount}\` 🎙️ | \`${deafenedCount}\` 🎧 | \`${streamingCount}\` 📺\n\n` +
      `### 🛠️ Quick Commands Guide\n` +
      `> - \`.vcmute @user\` / \`.vcunmute @user\` — Server mute/unmute a member\n` +
      `> - \`.vcdeafen @user\` / \`.vcundeafen @user\` — Server deafen/undeafen a member\n` +
      `> - \`.vckick @user\` — Disconnect member from voice channel\n` +
      `> - \`.vcmove @user #channel\` — Move member to target voice channel\n` +
      `> - \`.vcpull @user\` — Pull member into your current voice channel\n` +
      `> - \`.vcmuteall\` / \`.vcunmuteall\` — Mass mute/unmute all in your VC\n` +
      `> - \`.vcdeafenall\` / \`.vcundeafenall\` — Mass deafen/undeafen all in your VC\n` +
      `> - \`.vckickall\` — Disconnect all human members from your VC\n` +
      `> - \`.vcmoveall #from #to\` — Mass move members between channels\n` +
      `> - \`.vclist\` — Interactive channel member list with status badges\n` +
      `> - \`.invc\` — Overview of active voice channels and connected counts`;

    const footerText = `-# ASTRIXCODE™ Voice Moderation Engine • © 2026 ASTRIXCODE`;

    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(mainContent))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(footerText));

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
