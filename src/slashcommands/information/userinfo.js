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
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  AttachmentBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require("discord.js");

module.exports = {
  name: "userinfo",
  category: "Information",
  description: "View detailed information and assets for a server member.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "user",
      description: "The user to get information for.",
      type: ApplicationCommandOptionType.User,
      required: false,
    },
  ],

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();

    let targetUser = interaction.options.getUser("user") || interaction.user;

    // Force fetch to retrieve user banner details
    try {
      await targetUser.fetch({ force: true });
    } catch (e) {}

    const guild = interaction.guild;
    let member = interaction.options.getMember("user") || guild.members.cache.get(targetUser.id);
    if (!member) {
      try {
        member = await guild.members.fetch(targetUser.id);
      } catch (e) {
        member = null;
      }
    }

    const files = [];
    let mediaGallery;
    const bannerUrl = targetUser.bannerURL({ extension: "png", size: 1024 });
    const avatarUrl = targetUser.displayAvatarURL({ extension: "png", size: 512 });

    if (bannerUrl) {
      const bannerAttachment = new AttachmentBuilder(bannerUrl, {
        name: "user_banner.png",
      });
      files.push(bannerAttachment);
      mediaGallery = new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL("attachment://user_banner.png"),
      );
    } else if (avatarUrl) {
      const avatarAttachment = new AttachmentBuilder(avatarUrl, {
        name: "user_avatar.png",
      });
      files.push(avatarAttachment);
      mediaGallery = new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL("attachment://user_avatar.png"),
      );
    }

    // Helper to compile the response container for any page index
    const buildUserInfoPage = async (pageIndex, disableComponents = false) => {
      let content = "";

      if (pageIndex === 0) {
        // Page 1: General Info
        const joinedGuildStr = member
          ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:f> (<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`
          : "Not in this server";

        content = [
          `### <:members:1539875392532512808> User Profile: ${targetUser.username}`,
          `-# *General identification, timelines, and account registration details.*`,
          "",
          `> <:list:1539875411780042802> **Basic Info**`,
          `> - **Username:** \`${targetUser.username}\``,
          `> - **ID:** \`${targetUser.id}\``,
          `> - **Mention:** ${targetUser}`,
          `> - **Bot Account:** \`${targetUser.bot ? "Yes" : "No"}\``,
          "",
          `> <:calender:1539875441274523649> **Timelines**`,
          `> - **Account Created:** <t:${Math.floor(targetUser.createdTimestamp / 1000)}:f> (<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>)`,
          `> - **Joined Server:** ${joinedGuildStr}`,
        ].join("\n");
      } else if (pageIndex === 1) {
        // Page 2: Roles & Permissions
        if (!member) {
          content = `### <:Servericon:1539875445166702592> Guild Status: ${targetUser.username}\n\n*This user is not a member of this server. Roles and permissions cannot be displayed.*`;
        } else {
          const sortedRoles = [...member.roles.cache.values()]
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

          const highestRole = member.roles.highest
            ? `<@&${member.roles.highest.id}>`
            : "None";

          const keyPermissions = [];
          const flags = member.permissions;
          if (flags.has("Administrator")) keyPermissions.push("Administrator");
          if (flags.has("ManageGuild")) keyPermissions.push("Manage Server");
          if (flags.has("ManageRoles")) keyPermissions.push("Manage Roles");
          if (flags.has("ManageChannels")) keyPermissions.push("Manage Channels");
          if (flags.has("KickMembers")) keyPermissions.push("Kick Members");
          if (flags.has("BanMembers")) keyPermissions.push("Ban Members");
          if (flags.has("ManageMessages")) keyPermissions.push("Manage Messages");
          if (flags.has("MentionEveryone")) keyPermissions.push("Mention Everyone");

          const permissionsText =
            keyPermissions.length > 0 ? keyPermissions.join(", ") : "None";

          content = [
            `### <:Servericon:1539875445166702592> Guild Status: ${targetUser.username}`,
            `-# *Role authorization, nickname, and administrative permissions.*`,
            "",
            `> <:discord:1539875375981797596> **Server Identity**`,
            `> - **Nickname:** \`${member.nickname || "None"}\``,
            `> - **Highest Role:** ${highestRole}`,
            `> - **Key Permissions:** \`${permissionsText}\``,
            "",
            `> <:list:1539875411780042802> **Roles List [${rolesCount}]**`,
            rolesText,
          ].join("\n");
        }
      } else if (pageIndex === 2) {
        // Page 3: Activity & status
        const presence = member?.presence;
        let status = presence?.status || "offline";
        status = status.toUpperCase();

        let clientsText = "None";
        if (presence?.clientStatus) {
          const clients = Object.keys(presence.clientStatus).map(
            (c) => `${c.charAt(0).toUpperCase() + c.slice(1)} (${presence.clientStatus[c]})`,
          );
          clientsText = clients.join(", ");
        }

        const activities = presence?.activities || [];
        const activityList =
          activities.length > 0
            ? activities
                .map((a) => {
                  let typeStr = "Playing";
                  if (a.type === 1) typeStr = "Streaming";
                  if (a.type === 2) typeStr = "Listening to";
                  if (a.type === 3) typeStr = "Watching";
                  if (a.type === 4) typeStr = "Custom Status";
                  return `> - **${typeStr}:** \`${a.name}\`${a.details ? ` (${a.details})` : ""}`;
                })
                .join("\n")
            : "> *None*";

        const userFlags = targetUser.flags ? targetUser.flags.toArray() : [];
        const badgesMap = {
          Staff: "Discord Staff",
          Partner: "Partnered Server Owner",
          Hypesquad: "HypeSquad Events Coordinator",
          BugHunterLevel1: "Bug Hunter Level 1",
          BugHunterLevel2: "Bug Hunter Level 2",
          HypeSquadOnlineHouse1: "HypeSquad Bravery",
          HypeSquadOnlineHouse2: "HypeSquad Brilliance",
          HypeSquadOnlineHouse3: "HypeSquad Balance",
          PremiumEarlySupporter: "Early Supporter",
          TeamPseudoUser: "Team User",
          VerifiedBot: "Verified Bot",
          VerifiedDeveloper: "Early Verified Developer",
          CertifiedModerator: "Discord Certified Moderator",
          ActiveDeveloper: "Active Developer",
        };
        const badges =
          userFlags.length > 0
            ? userFlags.map((f) => badgesMap[f] || f).join(", ")
            : "None";

        content = [
          `### <:stats:1539875420256866314> Activity & Status: ${targetUser.username}`,
          `-# *Live status systems, device clients, and developer badges.*`,
          "",
          `> <:online:1539875424144859239> **Presence Status**`,
          `> - **Status:** \`${status}\``,
          `> - **Active Clients:** \`${clientsText}\``,
          "",
          `> <:games:1539875449151426672> **Current Activities**`,
          activityList,
          "",
          `> <:badge:1539875454725521488> **User Badges**`,
          `> - **Badges:** \`${badges}\``,
        ].join("\n");
      }

      // Dropdown Select Menu
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("userinfo_select")
        .setPlaceholder("Select a page...")
        .setDisabled(disableComponents)
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setEmoji("👥")
            .setLabel("Profile Overview")
            .setValue("0")
            .setDescription("General user details, registration and timelines.")
            .setDefault(pageIndex === 0),
          new StringSelectMenuOptionBuilder()
            .setEmoji("🌐")
            .setLabel("Roles & Permissions")
            .setValue("1")
            .setDescription("Server nickname, roles listing and permissions.")
            .setDefault(pageIndex === 1),
          new StringSelectMenuOptionBuilder()
            .setEmoji("📊")
            .setLabel("Activity & Status")
            .setValue("2")
            .setDescription("Client presence status, activities and badges.")
            .setDefault(pageIndex === 2),
        );

      const selectRow = new ActionRowBuilder().addComponents(selectMenu);

      // Prev/Next Buttons Row
      const prevBtn = new ButtonBuilder()
        .setCustomId("userinfo_prev")
        .setLabel("◀")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disableComponents || pageIndex === 0);

      const statusBtn = new ButtonBuilder()
        .setCustomId("userinfo_status")
        .setLabel(`${pageIndex + 1} of 3`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);

      const nextBtn = new ButtonBuilder()
        .setCustomId("userinfo_next")
        .setLabel("▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disableComponents || pageIndex === 2);

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
            `-# *<:astrix:1539875362945900574> Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE. All rights reserved.*`,
          ),
        )
        .addActionRowComponents(selectRow)
        .addActionRowComponents(btnRow);

      return container;
    };

    let currentPage = 0;
    const container = await buildUserInfoPage(currentPage);

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

      if (i.customId === "userinfo_prev" && currentPage > 0) {
        currentPage--;
      } else if (i.customId === "userinfo_next" && currentPage < 2) {
        currentPage++;
      } else if (i.customId === "userinfo_select") {
        currentPage = parseInt(i.values[0], 10);
      }

      const newContainer = await buildUserInfoPage(currentPage);
      const updateOptions = {
        components: [newContainer],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      };
      await interaction.editReply(updateOptions);
    });

    collector.on("end", async () => {
      try {
        const finalContainer = await buildUserInfoPage(currentPage, true);
        await interaction.editReply({
          components: [finalContainer],
          flags: MessageFlags.IsComponentsV2,
        });
      } catch (e) {}
    });
  },
};
