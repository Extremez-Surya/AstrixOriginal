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
  name: "minecraft",
  category: "Information",
  description:
    "Check live server status, players online, version, and MOTD for any Minecraft server.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "server",
      description: "Minecraft server IP address (e.g. mc.hypixel.net).",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const ip = interaction.options.getString("server");
    let data = null;

    try {
      const res = await fetch(
        `https://api.mcsrvstat.us/2/${encodeURIComponent(ip)}`,
      );
      if (res.status === 200) {
        data = await res.json();
      }
    } catch (e) {}

    if (!data || !data.online) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Server Offline / Not Found\n` +
            `-# *Unable to query Minecraft server \`${ip}\`. Server is offline or invalid IP.*`,
        ),
      );
      return interaction
        .editReply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        })
        .catch(() => null);
    }

    const motdClean = data.motd?.clean?.join(" ") || "No MOTD provided";
    const playersOnline = data.players?.online || 0;
    const playersMax = data.players?.max || 0;
    const version = data.version || "Unknown Version";
    const serverName = data.hostname || ip;

    const content = [
      `### <:minecraft:1539875531179433994> Minecraft Server ── ${serverName}`,
      `-# *${motdClean}*`,
      "",
      `> <:games:1539875449151426672> **Server Telemetry**`,
      `> - **Status:** \`Online <:online:1539875424144859239>\``,
      `> - **Players Online:** \`${playersOnline.toLocaleString()} / ${playersMax.toLocaleString()}\``,
      `> - **Version:** \`${version}\``,
      `> - **Software:** \`${data.software || "Standard Java"}\``,
      "",
      `> <:website:1539875380159184977> **Network Details**`,
      `> - **Domain/IP:** \`${serverName}\``,
      `> - **Numeric IP:** \`${data.ip || ip}\``,
      `> - **Port:** \`${data.port || 25565}\``,
    ].join("\n");

    const files = [];
    const container = new ContainerBuilder();

    const iconUrl = `https://api.mcsrvstat.us/icon/${encodeURIComponent(ip)}`;
    try {
      const iconAttachment = new AttachmentBuilder(iconUrl, {
        name: "mc_icon.png",
      });
      files.push(iconAttachment);

      const section = new SectionBuilder()
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL("attachment://mc_icon.png"),
        )
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

      container.addSectionComponents(section);
    } catch (e) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(content),
      );
    }

    const nameMcUrl = `https://namemc.com/server/${encodeURIComponent(ip)}`;
    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("NameMC Server Page")
        .setStyle(ButtonStyle.Link)
        .setURL(nameMcUrl),
    );

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
