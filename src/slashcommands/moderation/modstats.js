const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  AttachmentBuilder,
  SectionBuilder,
  ThumbnailBuilder,
} = require("discord.js");

module.exports = {
  name: "modstats",
  category: "Moderation",
  description: "View moderation statistics and action telemetry for a moderator.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "user",
      description: "Moderator or staff member to inspect.",
      type: ApplicationCommandOptionType.User,
      required: false,
    },
  ],

  botPermissions: ["SendMessages"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const targetUser = interaction.options.getUser("user") || interaction.user;

    const member = await interaction.guild.members
      .fetch(targetUser.id)
      .catch(() => null);

    const isMod =
      member?.permissions.has("ManageMessages") ||
      member?.permissions.has("KickMembers") ||
      member?.permissions.has("BanMembers");

    const tickEmoji = "<:tick:1530093327997992971>";
    const crossEmoji = "<:cross:1530093349447405568>";

    const content = [
      `### <:rshield:1528681364340080713> Moderation Telemetry ── ${targetUser.username}`,
      `-# *Server staff activity and moderation standing.*`,
      "",
      `> <:stats:1528322466521546826> **Moderator Overview**`,
      `> - **Target Staff:** ${targetUser} (\`${targetUser.id}\`)`,
      `> - **Staff Standing:** ${isMod ? "`Active Staff Member` <:online:1528327584520081519>" : "`Regular Member` <:offline:1528328082434424892>"}`,
      `> - **Highest Role:** ${member?.roles.highest ? `<@&${member.roles.highest.id}>` : "\`None\`"}`,
      "",
      `> <a:red_star:1528688099436003419> **Permissions Telemetry**`,
      `> - **Administrator:** \`${member?.permissions.has("Administrator") ? "Yes" : "No"}\` ${member?.permissions.has("Administrator") ? tickEmoji : crossEmoji}`,
      `> - **Ban Members:** \`${member?.permissions.has("BanMembers") ? "Yes" : "No"}\` ${member?.permissions.has("BanMembers") ? tickEmoji : crossEmoji}`,
      `> - **Kick Members:** \`${member?.permissions.has("KickMembers") ? "Yes" : "No"}\` ${member?.permissions.has("KickMembers") ? tickEmoji : crossEmoji}`,
      `> - **Manage Messages:** \`${member?.permissions.has("ManageMessages") ? "Yes" : "No"}\` ${member?.permissions.has("ManageMessages") ? tickEmoji : crossEmoji}`,
      `> - **Manage Channels:** \`${member?.permissions.has("ManageChannels") ? "Yes" : "No"}\` ${member?.permissions.has("ManageChannels") ? tickEmoji : crossEmoji}`,
      `> - **Moderate Members (Timeout):** \`${member?.permissions.has("ModerateMembers") ? "Yes" : "No"}\` ${member?.permissions.has("ModerateMembers") ? tickEmoji : crossEmoji}`,
    ].join("\n");

    const files = [];
    const container = new ContainerBuilder();
    const avatarUrl = targetUser.displayAvatarURL({
      extension: "png",
      size: 512,
    });

    if (avatarUrl) {
      try {
        const avatarAttachment = new AttachmentBuilder(avatarUrl, {
          name: "staff_avatar.png",
        });
        files.push(avatarAttachment);

        const section = new SectionBuilder()
          .setThumbnailAccessory(
            new ThumbnailBuilder().setURL("attachment://staff_avatar.png"),
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(content),
          );

        container.addSectionComponents(section);
      } catch (e) {
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(content),
        );
      }
    } else {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(content),
      );
    }

    container
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# *Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE*`,
        ),
      );

    return interaction
      .editReply({
        components: [container],
        files: files,
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
  },
};
