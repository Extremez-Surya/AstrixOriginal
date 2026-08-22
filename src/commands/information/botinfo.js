const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  AttachmentBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require("discord.js");
const os = require("os");
const path = require("path");
const config = require("../../lib/config.json");

module.exports = {
  alias: ["botinfo", "bi", "about"],
  category: "Information",
  desc: "View comprehensive information and statistics about Astrix.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const guild = message.guild;

    // Fetch developer details dynamically
    let devName = "ASTRIXCODE";
    let devId = "N/A";
    try {
      const application = await client.application.fetch();
      const owner = application.owner.ownerId
        ? await client.users.fetch(application.owner.ownerId)
        : await client.users.fetch(application.owner.id);
      devName = owner.username;
      devId = owner.id;
    } catch (e) {}

    const teamList = config.team || [];
    const fetchedTeam = [];
    for (const memberInfo of teamList) {
      try {
        const user = await client.users.fetch(memberInfo.id, { force: true });
        fetchedTeam.push({
          id: user.id,
          username: user.username,
          role: memberInfo.role,
        });
      } catch (e) {
        console.error(
          `Failed to fetch dev team member with ID ${memberInfo.id}:`,
          e,
        );
      }
    }

    if (fetchedTeam.length === 0) {
      fetchedTeam.push({
        id: devId,
        username: devName,
        role: "Lead Developer",
      });
    }

    // Fetch bot banner dynamically or use fallback local asset
    let botBanner = null;
    try {
      const fetchedBot = await client.users.fetch(client.user.id, {
        force: true,
      });
      botBanner = fetchedBot.bannerURL({ size: 2048 });
    } catch (e) {}

    const bannerPath = path.join(__dirname, "../../assets/astrix.png");
    const bannerAttachment = new AttachmentBuilder(bannerPath, {
      name: "bot_banner.png",
    });
    const bannerUrl = botBanner || "attachment://bot_banner.png";

    // Helper to compile the response container for any page index
    const buildDashboardPage = (pageIndex, disableAll = false) => {
      let content = "";

      const uptimeSeconds = process.uptime();
      const days = Math.floor(uptimeSeconds / 86400);
      const hours = Math.floor(uptimeSeconds / 3600) % 24;
      const minutes = Math.floor(uptimeSeconds / 60) % 60;
      const seconds = Math.floor(uptimeSeconds % 60);
      const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      if (pageIndex === 0) {
        // Page 1: Overview
        const serversCount = client.guilds.cache.size;
        const membersCount = client.guilds.cache.reduce(
          (acc, g) => acc + (g.memberCount || 0),
          0,
        );
        const channelsCount = client.channels.cache.size;
        const creationTime = Math.floor(client.user.createdTimestamp / 1000);

        content = [
          `### <:Servericon:1539875445166702592> Astrix Overview`,
          `-# *Primary identity panel and network reach metrics.*`,
          "",
          `> <:bote:1539875512757911643> **Identity**`,
          `> - **Tag:** \`${client.user.tag}\` | **ID:** \`${client.user.id}\``,
          `> - **Created:** <t:${creationTime}:f> (<t:${creationTime}:R>)`,
          `> - **Process Uptime:** \`${uptimeString}\``,
          "",
          `> <:website:1539875380159184977> **Network Reach**`,
          `> - **Total Servers:** \`${serversCount.toLocaleString()}\``,
          `> - **Total Users:** \`${membersCount.toLocaleString()}\``,
          `> - **Total Channels:** \`${channelsCount.toLocaleString()}\``,
          `> - **Shards Configuration:** \`1 Active Shard\``,
        ].join("\n");
      } else if (pageIndex === 1) {
        // Page 2: Performance
        const mem = process.memoryUsage();
        const heapUsed = (mem.heapUsed / 1024 / 1024).toFixed(2);
        const heapTotal = (mem.heapTotal / 1024 / 1024).toFixed(2);
        const rss = (mem.rss / 1024 / 1024).toFixed(2);
        const external = (mem.external / 1024 / 1024).toFixed(2);
        const totalCores = os.cpus().length;
        const hostPlatform = `${process.platform} / ${process.arch}`;

        content = [
          `### <:RedGear:1539875503039578193> Engine Performance`,
          `-# *Low-level process memory, Node runtime, and machine host statistics.*`,
          "",
          `> <:stats:1539875420256866314> **V8 Telemetry**`,
          `> - **Heap Allocation:** \`${heapUsed} MB\` / \`${heapTotal} MB\``,
          `> - **Resident Set Size:** \`${rss} MB\``,
          `> - **External Heap:** \`${external} MB\``,
          "",
          `> <:discord:1539875375981797596> **Runtime Environment**`,
          `> - **Node Version:** \`Node.js ${process.version}\``,
          `> - **Wrapper:** \`Discord.js v${require("discord.js").version}\``,
          `> - **Host Platform:** \`${hostPlatform}\``,
          `> - **CPU Cores:** \`${totalCores} CPU Cores\``,
        ].join("\n");
      } else if (pageIndex === 2) {
        // Page 3: Team
        const teamLines = fetchedTeam.map(
          (member) =>
            `> <:badge:1539875454725521488> **${member.role}** ─ ${member.username} (\`${member.id}\`)`,
        );
        content = [
          `### <:members:1539875392532512808> Astrix Developer Team`,
          `-# *Profiles and credentials of the development team.*`,
          "",
          ...teamLines,
        ].join("\n");
      } else if (pageIndex === 3) {
        // Page 4: Links
        const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;

        content = [
          `### <:linkRed:1539875517132705832> Official Connections & Links`,
          `-# *Resource portals and connection hubs.*`,
          "",
          `> - **Website Portal** ─ [Click Here](https://extremez.vercel.app/)`,
          `> - **Support Hub** ─ [Click Here](https://discord.gg/FR9pXG2Mwb)`,
          `> - **Invite Link** ─ [Click Here](${inviteUrl})`,
        ].join("\n");
      }

      // Media Gallery
      const mediaItem = new MediaGalleryItemBuilder().setURL(bannerUrl);
      const mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);

      // Dropdown selector
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("botinfo_menu")
        .setPlaceholder("Select documentation area...")
        .setDisabled(disableAll)
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setEmoji("<:Servericon:1539875445166702592>")
            .setLabel("Overview")
            .setValue("0")
            .setDescription(
              "General bot identity, server coverage and uptime stats.",
            )
            .setDefault(pageIndex === 0),
          new StringSelectMenuOptionBuilder()
            .setEmoji("<:RedGear:1539875503039578193>")
            .setLabel("Performance")
            .setValue("1")
            .setDescription(
              "V8 Heap memory usage, runtime engine versions and CPU specs.",
            )
            .setDefault(pageIndex === 1),
          new StringSelectMenuOptionBuilder()
            .setEmoji("<:members:1539875392532512808>")
            .setLabel("Team")
            .setValue("2")
            .setDescription(
              "Creator details, GitHub repos and modular code specs.",
            )
            .setDefault(pageIndex === 2),
          new StringSelectMenuOptionBuilder()
            .setEmoji("<:linkRed:1539875517132705832>")
            .setLabel("Links")
            .setValue("3")
            .setDescription(
              "Access official invite URL, website and support portals.",
            )
            .setDefault(pageIndex === 3),
        );

      const selectRow = new ActionRowBuilder().addComponents(selectMenu);

      // Links & Utility Buttons Row
      const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;

      const inviteBtn = new ButtonBuilder()
        .setEmoji("<:invite:1539875370248052736>")
        .setLabel("Add Bot")
        .setStyle(ButtonStyle.Link)
        .setURL(inviteUrl);

      const supportBtn = new ButtonBuilder()
        .setEmoji("<:discord:1539875375981797596>")
        .setLabel("Support Hub")
        .setStyle(ButtonStyle.Link)
        .setURL("https://discord.gg/FR9pXG2Mwb");

      const btnRow = new ActionRowBuilder().addComponents(
        inviteBtn,
        supportBtn,
      );

      const container = new ContainerBuilder()
        .addMediaGalleryComponents(mediaGallery)
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# *<:astrix:1539875362945900574> Live Ping: \`${client.ws.ping}ms\` • Powered by ASTRIXCODE™ • © 2026*`,
          ),
        )
        .addActionRowComponents(selectRow)
        .addActionRowComponents(btnRow);

      return container;
    };

    let currentPage = 0;
    const container = buildDashboardPage(currentPage);

    const replyMsg = await message.reply({
      components: [container],
      files: botBanner ? [] : [bannerAttachment],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });

    const filter = (i) => i.user.id === message.author.id;
    const collector = replyMsg.createMessageComponentCollector({
      filter,
      time: 120000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();

      if (i.customId === "botinfo_menu") {
        currentPage = parseInt(i.values[0], 10);
      }

      const updatedContainer = buildDashboardPage(currentPage);
      await i.editReply({
        components: [updatedContainer],
        allowedMentions: { parse: [], repliedUser: false },
      });
    });

    collector.on("end", async () => {
      try {
        const finalContainer = buildDashboardPage(currentPage, true);
        await replyMsg.edit({
          components: [finalContainer],
          allowedMentions: { parse: [], repliedUser: false },
        });
      } catch (e) {}
    });
  },
};
