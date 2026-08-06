const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  SectionBuilder,
  ThumbnailBuilder,
} = require("discord.js");

module.exports = {
  name: "checkvanity",
  category: "Information",
  description:
    "Check availability or inspection details for a Discord custom vanity URL.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "code",
      description: "Vanity code or invite path to inspect.",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const inputCode =
      interaction.options.getString("code") || interaction.guild?.vanityURLCode;

    if (!inputCode) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Missing Vanity Code\n` +
            `-# *Please specify a vanity code to check.*`,
        ),
      );
      return interaction
        .editReply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        })
        .catch(() => null);
    }

    const cleanCode = inputCode
      .replace(/^https?:\/\/discord\.gg\//i, "")
      .replace(/^https?:\/\/discord\.com\/invite\//i, "")
      .replace(/\//g, "");

    let vanityInfo = null;
    try {
      const res = await fetch(
        `https://discord.com/api/v10/invites/${encodeURIComponent(cleanCode)}?with_counts=true`,
      );
      if (res.status === 200) {
        vanityInfo = await res.json();
      }
    } catch (e) {}

    const files = [];
    const container = new ContainerBuilder();
    let actionRow;

    if (vanityInfo && vanityInfo.guild) {
      const g = vanityInfo.guild;
      const memberCount = (
        vanityInfo.approximate_member_count || 0
      ).toLocaleString();
      const presenceCount = (
        vanityInfo.approximate_presence_count || 0
      ).toLocaleString();
      const descText = g.description ? g.description.trim() : null;

      const isPartnered = g.features?.includes("PARTNERED");
      const isVerified = g.features?.includes("VERIFIED");
      const badgeStr = isPartnered
        ? " • <a:owner3:1530088048996384812> *Partnered*"
        : isVerified
          ? " • <a:ticky_red:1530092915735400548> *Verified*"
          : "";

      const content = [
        `### <:astrix:1527205612205903973> Vanity URL Inspector ── discord.gg/${cleanCode}`,
        descText
          ? `-# *${descText}*`
          : `-# *Active Discord server invite telemetry.*`,
        "",
        `> <:linkRed:1528701532617314425> **Vanity Status:** \`Taken / Claimed <:red_circle:1530092627528257647>\``,
        `> - **Target Code:** \`discord.gg/${cleanCode}\``,
        `> - **Guild Name:** **${g.name}**${badgeStr}`,
        `> - **Guild ID:** \`${g.id}\``,
        `> - **Total Members:** \`${memberCount}\``,
        `> - **Online Members:** \`${presenceCount}\``,
      ].join("\n");

      let iconUrl = null;
      if (g.icon) {
        const ext = g.icon.startsWith("a_") ? "gif" : "png";
        iconUrl = `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.${ext}?size=512`;
      }

      if (iconUrl) {
        try {
          const iconAttachment = new AttachmentBuilder(iconUrl, {
            name: "guild_icon.png",
          });
          files.push(iconAttachment);

          const section = new SectionBuilder()
            .setThumbnailAccessory(
              new ThumbnailBuilder().setURL("attachment://guild_icon.png"),
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

      actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel(`Join discord.gg/${cleanCode}`)
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.gg/${cleanCode}`),
      );
    } else {
      const content = [
        `### <:astrix:1527205612205903973> Vanity URL Inspector ── discord.gg/${cleanCode}`,
        `-# *Discord Custom Vanity Code Availability Inspection.*`,
        "",
        `> <:online:1528327584520081519> **Vanity Status:** \`Available / Unclaimed\``,
        `> - **Target Code:** \`discord.gg/${cleanCode}\``,
        `> - **Availability:** \`Available for registration / Unclaimed\``,
        `> - **Status Note:** *No active server invite found for this code.*`,
      ].join("\n");

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(content),
      );

      actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Discord App")
          .setStyle(ButtonStyle.Link)
          .setURL("https://discord.com"),
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
      )
      .addActionRowComponents(actionRow);

    return interaction
      .editReply({
        components: [container],
        files: files,
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
  },
};
