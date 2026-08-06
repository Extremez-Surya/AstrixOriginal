const {
  ApplicationCommandType,
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

module.exports = {
  name: "serverinfo",
  category: "Information",
  description: "View detailed information about the server.",
  type: ApplicationCommandType.ChatInput,

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const guild = interaction.guild;

    const files = [];
    let mediaGallery;
    const bannerUrl =
      guild.bannerURL({ extension: "png", size: 1024 }) ||
      guild.discoverySplashURL({ extension: "png", size: 1024 });
    const iconUrl = guild.iconURL({ extension: "png", size: 512 });

    if (bannerUrl) {
      const bannerAttachment = new AttachmentBuilder(bannerUrl, {
        name: "server_banner.png",
      });
      files.push(bannerAttachment);
      mediaGallery = new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL("attachment://server_banner.png"),
      );
    } else if (iconUrl) {
      const iconAttachment = new AttachmentBuilder(iconUrl, {
        name: "server_icon.png",
      });
      files.push(iconAttachment);
      mediaGallery = new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL("attachment://server_icon.png"),
      );
    }

    // Helper to compile the response container for any page index
    const buildServerInfoPage = async (
      pageIndex,
      disableComponents = false,
    ) => {
      let content = "";

      if (pageIndex === 0) {
        // Page 1: General Info
        let ownerText = guild.ownerId;
        try {
          const owner = await guild.fetchOwner();
          ownerText = owner
            ? `${owner.user.username} (${owner.id})`
            : guild.ownerId;
        } catch (e) {}

        const total = guild.memberCount;
        const bots = guild.members.cache.filter((m) => m.user.bot).size;
        const humans = total - bots;
        const online = guild.members.cache.filter(
          (m) => m.presence && m.presence.status !== "offline",
        ).size;

        content = [
          `### <:Servericon:1528415740196294776> Server Information: ${guild.name}`,
          `-# *General overview, owner details, and member populations.*`,
          "",
          `> <:list:1528313871889334382> **About**`,
          `> - **Name:** \`${guild.name}\``,
          `> - **ID:** \`${guild.id}\``,
          `> - **Owner:** \`${ownerText}\``,
          `> - **Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:f> (<t:${Math.floor(guild.createdTimestamp / 1000)}:R>)`,
          `> - **Preferred Locale:** \`${guild.preferredLocale || "en-US"}\``,
          `> - **Description:** ${guild.description || "No description set."}`,
          "",
          `> <:members:1528311049726591006> **Population**`,
          `> - **Total Members:** \`${total.toLocaleString()}\``,
          `> - **Humans:** \`${humans.toLocaleString()}\``,
          `> - **Bots:** \`${bots.toLocaleString()}\``,
          `> - **Cached Online:** \`${online.toLocaleString()}\``,
        ].join("\n");
      } else if (pageIndex === 1) {
        // Page 2: Channels
        const channels = guild.channels.cache;
        const totalChannels = channels.size;
        const textChannels = channels.filter((c) => c.type === 0).size;
        const voiceChannels = channels.filter((c) => c.type === 2).size;
        const newsChannels = channels.filter((c) => c.type === 5).size;
        const stageChannels = channels.filter((c) => c.type === 13).size;
        const categories = channels.filter((c) => c.type === 4).size;
        const forums = channels.filter((c) => c.type === 15).size;
        const threads = channels.filter((c) => c.isThread()).size;

        content = [
          `### <:rmessage:1528690062005506160> Channel Breakdown: ${guild.name}`,
          `-# *Channels statistics, categories, and communication pathways.*`,
          "",
          `> <:stats:1528322466521546826> **Metrics**`,
          `> - **Total Channels:** \`${totalChannels}\``,
          `> - **Categories:** \`${categories}\``,
          `> - **Text:** \`${textChannels}\``,
          `> - **Voice:** \`${voiceChannels}\``,
          `> - **Announcements:** \`${newsChannels}\``,
          `> - **Stages:** \`${stageChannels}\``,
          `> - **Forums:** \`${forums}\``,
          `> - **Active Threads:** \`${threads}\``,
          "",
          `> <:rmicrophone:1528680686628769862> **Bandwidth**`,
          `> - **Maximum Bitrate:** \`${(guild.maximumBitrate / 1000).toFixed(0)} kbps\``,
        ].join("\n");
      } else if (pageIndex === 2) {
        // Page 3: Security & Settings
        const verifLevels = {
          0: "None (0)",
          1: "Low (1)",
          2: "Medium (2)",
          3: "High (3)",
          4: "Highest (4)",
        };
        const verificationLevel =
          verifLevels[guild.verificationLevel] || guild.verificationLevel;

        const filtersMap = {
          0: "Disabled",
          1: "Members Without Roles",
          2: "All Members",
        };
        const explicitFilter =
          filtersMap[guild.explicitContentFilter] || "Unknown";

        const mfaMap = {
          0: "None",
          1: "Elevated (2FA Required)",
        };
        const mfaLevel = mfaMap[guild.mfaLevel] || "Unknown";

        const nsfwMap = {
          0: "Default",
          1: "Explicit",
          2: "Safe",
          3: "Age Restricted",
        };
        const nsfwLevel = nsfwMap[guild.nsfwLevel] || "Unknown";

        const notificationsMap = {
          0: "All Messages",
          1: "Only Mentions",
        };
        const defaultNotifications =
          notificationsMap[guild.defaultMessageNotifications] ||
          guild.defaultMessageNotifications;

        const afkChannel = guild.afkChannelId
          ? `<#${guild.afkChannelId}>`
          : "None";
        const systemChannel = guild.systemChannelId
          ? `<#${guild.systemChannelId}>`
          : "None";
        const rulesChannel = guild.rulesChannelId
          ? `<#${guild.rulesChannelId}>`
          : "None";
        const publicUpdatesChannel = guild.publicUpdatesChannelId
          ? `<#${guild.publicUpdatesChannelId}>`
          : "None";

        content = [
          `### <:rshield:1528681364340080713> Server Settings: ${guild.name}`,
          `-# *Security filters, verification rules, and administrative channels.*`,
          "",
          `> <:rshield:1528681364340080713> **Security & Protection**`,
          `> - **Verification Level:** \`${verificationLevel}\``,
          `> - **Content Filter:** \`${explicitFilter}\``,
          `> - **MFA Level:** \`${mfaLevel}\``,
          `> - **NSFW Safety:** \`${nsfwLevel}\``,
          "",
          `> <:rspeaker:1528681739646664786> **Notifications & System Channels**`,
          `> - **Default Notifications:** \`${defaultNotifications}\``,
          `> - **System Messages:** ${systemChannel}`,
          `> - **AFK Pathway:** ${afkChannel} (Timeout: \`${guild.afkTimeout / 60} mins\`)`,
          `> - **Rules Pathway:** ${rulesChannel}`,
          `> - **Moderator Pathway:** ${publicUpdatesChannel}`,
        ].join("\n");
      } else if (pageIndex === 3) {
        // Page 4: Boost & Features
        const boosterRole = guild.roles.cache.find(
          (r) => r.tags?.premiumSubscriberRole,
        );
        const boosterRoleMention = boosterRole
          ? `<@&${boosterRole.id}>`
          : "None";

        const featuresList =
          guild.features.length > 0
            ? guild.features
                .map(
                  (f) =>
                    `✓ ${f
                      .replace(/_/g, " ")
                      .toLowerCase()
                      .replace(/\b\w/g, (c) => c.toUpperCase())}`,
                )
                .join("\n")
            : "None";

        content = [
          `### <a:red_boost:1528682966199566356> Premium Status & Features: ${guild.name}`,
          `-# *Nitro boosts indicators, vanity links, and guild properties.*`,
          "",
          `> <a:red_boost:1528682966199566356> **Boost Status**`,
          `> - **Premium Tier:** \`Tier ${guild.premiumTier}\``,
          `> - **Boost Subscriptions:** \`${guild.premiumSubscriptionCount || 0}\``,
          `> - **Booster Role:** ${boosterRoleMention}`,
          `> - **Vanity Link:** ${guild.vanityURLCode ? `\`discord.gg/${guild.vanityURLCode}\`` : "`None`"}`,
          "",
          `> <a:red_star:1528688099436003419> **Guild Features**`,
          featuresList,
        ].join("\n");
      } else if (pageIndex === 4) {
        // Page 5: Roles & Emojis
        const sortedRoles = [...guild.roles.cache.values()]
          .filter((r) => r.id !== guild.id) // exclude @everyone
          .sort((a, b) => b.position - a.position);

        const rolesCount = sortedRoles.length;
        const displayedRoles = sortedRoles
          .slice(0, 15)
          .map((r) => `<@&${r.id}>`)
          .join(" ");
        const rolesText =
          rolesCount > 15
            ? `${displayedRoles} and ${rolesCount - 15} more`
            : displayedRoles || "None";

        const highestRole = guild.roles.highest
          ? `<@&${guild.roles.highest.id}>`
          : "None";

        const emojis = guild.emojis.cache;
        const regularEmojis = emojis.filter((e) => !e.animated).size;
        const animatedEmojis = emojis.filter((e) => e.animated).size;
        const totalEmojis = emojis.size;
        const stickers = guild.stickers.cache.size;

        content = [
          `### <:discord:1527683374523744367> Assets & Roles: ${guild.name}`,
          `-# *Roles hierarchy, member roles list, and emoji indicators.*`,
          "",
          `> <:members:1528311049726591006> **Roles Overview**`,
          `> - **Total Roles:** \`${rolesCount}\``,
          `> - **Highest Role:** ${highestRole}`,
          `> - **Roles List:**`,
          rolesText,
          "",
          `> <a:assetemoji:1528690731328475166> **Custom Assets**`,
          `> - **Regular Emojis:** \`${regularEmojis}\``,
          `> - **Animated Emojis:** \`${animatedEmojis}\``,
          `> - **Total Emojis:** \`${totalEmojis}\``,
          `> - **Stickers:** \`${stickers}\``,
          `> - **Total Assets:** \`${totalEmojis + stickers}\``,
        ].join("\n");
      }

      // Dropdown Select Menu
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("serverinfo_select")
        .setPlaceholder("Select a page...")
        .setDisabled(disableComponents)
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setEmoji("<:Servericon:1528415740196294776>")
            .setLabel("Overview & Members")
            .setValue("0")
            .setDescription("General details, owner, locale, and populations.")
            .setDefault(pageIndex === 0),
          new StringSelectMenuOptionBuilder()
            .setEmoji("<:rmessage:1528690062005506160>")
            .setLabel("Channel Breakdown")
            .setValue("1")
            .setDescription("Channels statistics, categories, and bitrate.")
            .setDefault(pageIndex === 1),
          new StringSelectMenuOptionBuilder()
            .setEmoji("<:rshield:1528681364340080713>")
            .setLabel("Security & Settings")
            .setValue("2")
            .setDescription("Verification, filters, AFK, and system channels.")
            .setDefault(pageIndex === 2),
          new StringSelectMenuOptionBuilder()
            .setEmoji("<a:red_boost:1528682966199566356>")
            .setLabel("Boosts & Features")
            .setValue("3")
            .setDescription(
              "Boost level, subscribers, and server features list.",
            )
            .setDefault(pageIndex === 3),
          new StringSelectMenuOptionBuilder()
            .setEmoji("<:members:1528311049726591006>")
            .setLabel("Roles & Emojis")
            .setValue("4")
            .setDescription("Server roles list, emojis, and stickers count.")
            .setDefault(pageIndex === 4),
        );

      const selectRow = new ActionRowBuilder().addComponents(selectMenu);

      // Prev/Next Buttons Row
      const prevBtn = new ButtonBuilder()
        .setCustomId("serverinfo_prev")
        .setLabel("◀")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disableComponents || pageIndex === 0);

      const statusBtn = new ButtonBuilder()
        .setCustomId("serverinfo_status")
        .setLabel(`${pageIndex + 1} of 5`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);

      const nextBtn = new ButtonBuilder()
        .setCustomId("serverinfo_next")
        .setLabel("▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disableComponents || pageIndex === 4);

      const btnRow = new ActionRowBuilder().addComponents(
        prevBtn,
        statusBtn,
        nextBtn,
      );

      const container = new ContainerBuilder();
      if (mediaGallery) {
        container
          .addMediaGalleryComponents(mediaGallery)
          .addSeparatorComponents(
            new SeparatorBuilder()
              .setSpacing(SeparatorSpacingSize.Small)
              .setDivider(true),
          );
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
            `-# *<:astrix:1527205612205903973> Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE. All rights reserved.*`,
          ),
        )
        .addActionRowComponents(selectRow)
        .addActionRowComponents(btnRow);

      return container;
    };

    let currentPage = 0;
    const container = await buildServerInfoPage(currentPage);

    const replyOptions = {
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    };
    if (files.length > 0) {
      replyOptions.files = files;
    }

    await interaction.editReply(replyOptions);

    const replyMsg = await interaction.fetchReply();

    const filter = (i) => i.user.id === interaction.user.id;
    const collector = replyMsg.createMessageComponentCollector({
      filter,
      time: 120000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();

      if (i.customId === "serverinfo_prev" && currentPage > 0) {
        currentPage--;
      } else if (i.customId === "serverinfo_next" && currentPage < 4) {
        currentPage++;
      } else if (i.customId === "serverinfo_select") {
        currentPage = parseInt(i.values[0], 10);
      }

      const newContainer = await buildServerInfoPage(currentPage);
      const updateOptions = {
        components: [newContainer],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      };
      await interaction.editReply(updateOptions);
    });

    collector.on("end", async () => {
      try {
        const finalContainer = await buildServerInfoPage(currentPage, true);
        await interaction.editReply({
          components: [finalContainer],
          flags: MessageFlags.IsComponentsV2,
        });
      } catch (e) {}
    });
  },
};
