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
  SectionBuilder,
  ThumbnailBuilder,
} = require("discord.js");

module.exports = {
  alias: ["minecraft", "mcserver", "mcinfo"],
  category: "Information",
  desc: "Check live server status, players online, version, and MOTD for any Minecraft server.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    if (!args[0]) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Missing Server IP\n` +
            `-# *Please specify a Minecraft server IP address (e.g. \`.minecraft mc.hypixel.net\`).*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const ip = args[0];
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
          `### <a:red_star:1528688099436003419> Server Offline / Not Found\n` +
            `-# *Unable to query Minecraft server \`${ip}\`. Server is offline or invalid IP.*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const motdClean = data.motd?.clean?.join(" ") || "No MOTD provided";
    const playersOnline = data.players?.online || 0;
    const playersMax = data.players?.max || 0;
    const version = data.version || "Unknown Version";
    const serverName = data.hostname || ip;

    const content = [
      `### <a:minecraft:1530085289811247255> Minecraft Server ── ${serverName}`,
      `-# *${motdClean}*`,
      "",
      `> <:games:1528416832199987393> **Server Telemetry**`,
      `> - **Status:** \`Online <:online:1528327584520081519>\``,
      `> - **Players Online:** \`${playersOnline.toLocaleString()} / ${playersMax.toLocaleString()}\``,
      `> - **Version:** \`${version}\``,
      `> - **Software:** \`${data.software || "Standard Java"}\``,
      "",
      `> <:website:1528304906400960582> **Network Details**`,
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

    return message
      .reply({
        components: [container],
        files: files,
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
  },
};
