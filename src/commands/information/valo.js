const {
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
  alias: ["valo", "valorant"],
  category: "Information",
  desc: "Fetch Valorant player statistics, profile inspection, and web tracker hub.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    if (!args[0] || !args[0].includes("#")) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Missing Riot Tagline\n` +
            `-# *Usage: \`.valo <name#tag>\` (e.g. \`.valo Vinay#0101\`).*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const [name, tag] = args[0].split("#");

    const trackerUrl = `https://tracker.gg/valorant/profile/riot/${encodeURIComponent(name)}%23${encodeURIComponent(tag)}/overview`;
    const blitzUrl = `https://blitz.gg/valorant/profile/${encodeURIComponent(name)}-${encodeURIComponent(tag)}`;
    const dakUrl = `https://dak.gg/valorant/profile/${encodeURIComponent(name)}-${encodeURIComponent(tag)}`;

    const content = [
      `### <a:Valorant:1530085629432430722> Valorant Agent Profile ── ${name}#${tag}`,
      `-# *Riot Games Agent Inspection & Competitive Telemetry.*`,
      "",
      `> <:members:1528311049726591006> **Riot Account Identity**`,
      `> - **Riot ID:** \`${name}#${tag}\``,
      `> - **Username:** \`${name}\``,
      `> - **Tagline:** \`#${tag}\``,
      `> - **Status:** \`Online / Ready\` <:online:1528327584520081519>`,
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

    return message
      .reply({
        components: [container],
        files: files,
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
  },
};
