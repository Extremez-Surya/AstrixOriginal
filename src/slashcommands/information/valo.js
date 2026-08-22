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
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require("discord.js");

async function getRandomValorantBanner() {
  try {
    const res = await fetch("https://valorant-api.com/v1/playercards");
    if (res.status === 200) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        const validCards = json.data.filter(
          (c) => c.wideArt && c.wideArt.length > 0,
        );
        if (validCards.length > 0) {
          const randomIndex = Math.floor(Math.random() * validCards.length);
          return validCards[randomIndex].wideArt;
        }
      }
    }
  } catch (e) {}
  return "https://media.valorant-api.com/playercards/5def384f-47ce-ee1e-8a4c-d1a394fef0b5/wideart.png";
}

module.exports = {
  name: "valo",
  category: "Information",
  description:
    "Fetch Valorant player statistics, profile inspection, and web tracker hub.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "riotid",
      description: "Riot Name and Tagline (e.g. Player#NA1).",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const riotInput = interaction.options.getString("riotid");

    if (!riotInput.includes("#")) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Missing Tagline\n` +
            `-# *Please include tagline (e.g. \`Player#NA1\`).*`,
        ),
      );
      return interaction
        .editReply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        })
        .catch(() => null);
    }

    const [name, tag] = riotInput.split("#");

    const trackerUrl = `https://tracker.gg/valorant/profile/riot/${encodeURIComponent(name)}%23${encodeURIComponent(tag)}/overview`;
    const blitzUrl = `https://blitz.gg/valorant/profile/${encodeURIComponent(name)}-${encodeURIComponent(tag)}`;
    const dakUrl = `https://dak.gg/valorant/profile/${encodeURIComponent(name)}-${encodeURIComponent(tag)}`;

    const content = [
      `### <:Valorant:1539875536547876894> Valorant Agent Profile ── ${name}#${tag}`,
      `-# *Riot Games Agent Inspection & Competitive Telemetry.*`,
      "",
      `> <:members:1539875392532512808> **Riot Account Identity**`,
      `> - **Riot ID:** \`${name}#${tag}\``,
      `> - **Username:** \`${name}\``,
      `> - **Tagline:** \`#${tag}\``,
      `> - **Status:** \`Online / Ready\` <:online:1539875424144859239>`,
    ].join("\n");

    const files = [];
    let mediaGallery;

    const bannerUrl = await getRandomValorantBanner();
    if (bannerUrl) {
      try {
        const cardAttachment = new AttachmentBuilder(bannerUrl, {
          name: "valo_banner.png",
        });
        files.push(cardAttachment);
        mediaGallery = new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL("attachment://valo_banner.png"),
        );
      } catch (e) {}
    }

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Tracker.gg Profile")
        .setStyle(ButtonStyle.Link)
        .setURL(trackerUrl),
      new ButtonBuilder()
        .setLabel("Blitz.gg Profile")
        .setStyle(ButtonStyle.Link)
        .setURL(blitzUrl),
      new ButtonBuilder()
        .setLabel("Dak.gg Profile")
        .setStyle(ButtonStyle.Link)
        .setURL(dakUrl),
    );

    const container = new ContainerBuilder();

    if (mediaGallery) {
      container.addMediaGalleryComponents(mediaGallery);
    }

    container
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
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
