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
  name: "roleinfo",
  category: "Information",
  description: "View detailed information and permissions for a server role.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "role",
      description: "The role to get information for.",
      type: ApplicationCommandOptionType.Role,
      required: true,
    },
  ],

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const guild = interaction.guild;
    const role = interaction.options.getRole("role");

    let bannerAttachment;
    let mediaGallery;
    const iconUrl = role.iconURL({ extension: "png", size: 512 });

    if (iconUrl) {
      bannerAttachment = new AttachmentBuilder(iconUrl, {
        name: "role_icon.png",
      });
      const mediaItem = new MediaGalleryItemBuilder().setURL(
        "attachment://role_icon.png",
      );
      mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);
    }

    // Helper to compile the response container for any page index
    const buildRoleInfoPage = async (pageIndex, disableComponents = false) => {
      let content = "";

      if (pageIndex === 0) {
        // Page 1: Overview
        const totalRoles = guild.roles.cache.size;
        const members = role.members;
        const memberCount = members.size;
        const displayedMembers = [...members.values()]
          .slice(0, 15)
          .map((m) => `<@${m.id}>`)
          .join(" ");
        const membersText =
          memberCount > 15
            ? `${displayedMembers} and ${memberCount - 15} more`
            : displayedMembers || "None";

        content = [
          `### <:list:1539875411780042802> Role Information: ${role.name}`,
          `-# *General statistics, color settings, and membership list.*`,
          "",
          `> <:list:1539875411780042802> **About**`,
          `> - **Name:** \`${role.name}\``,
          `> - **ID:** \`${role.id}\``,
          `> - **Mention:** ${role}`,
          `> - **Hex Color:** \`${role.hexColor.toUpperCase()}\``,
          `> - **Position:** \`${role.position}\` (out of \`${totalRoles}\`)`,
          `> - **Created:** <t:${Math.floor(role.createdTimestamp / 1000)}:f> (<t:${Math.floor(role.createdTimestamp / 1000)}:R>)`,
          "",
          `> <:members:1539875392532512808> **Membership**`,
          `> - **Total Members:** \`${memberCount.toLocaleString()}\``,
          `> - **Members List:** ${membersText}`,
          "",
          `> <:RedGear:1539875503039578193> **Settings**`,
          `> - **Hoisted:** \`${role.hoist ? "Yes" : "No"}\``,
          `> - **Mentionable:** \`${role.mentionable ? "Yes" : "No"}\``,
          `> - **Managed:** \`${role.managed ? "Yes" : "No"}\``,
        ].join("\n");
      } else if (pageIndex === 1) {
        // Page 2: Permissions
        const flags = role.permissions;

        const hasAdmin = flags.has("Administrator");
        const hasManageServer = flags.has("ManageGuild");
        const hasManageRoles = flags.has("ManageRoles");
        const hasManageChannels = flags.has("ManageChannels");

        const hasKick = flags.has("KickMembers");
        const hasBan = flags.has("BanMembers");
        const hasMute = flags.has("MuteMembers");
        const hasDeafen = flags.has("DeafenMembers");

        const hasSend = flags.has("SendMessages");
        const hasManageMessages = flags.has("ManageMessages");
        const hasMentionEveryone = flags.has("MentionEveryone");
        const hasConnect = flags.has("Connect");

        content = [
          `### <:rshield:1539875466939338773> Role Permissions: ${role.name}`,
          `-# *Complete access rules and server permissions mapped for this role.*`,
          "",
          `> <:badge:1539875454725521488> **Administrative**`,
          `> - **Administrator:** \`${hasAdmin ? "✓ Authorized" : "✗ Denied"}\``,
          `> - **Manage Server:** \`${hasManageServer ? "✓ Authorized" : "✗ Denied"}\``,
          `> - **Manage Roles:** \`${hasManageRoles ? "✓ Authorized" : "✗ Denied"}\``,
          `> - **Manage Channels:** \`${hasManageChannels ? "✓ Authorized" : "✗ Denied"}\``,
          "",
          `> <:members:1539875392532512808> **Moderation**`,
          `> - **Kick Members:** \`${hasKick ? "✓ Authorized" : "✗ Denied"}\``,
          `> - **Ban Members:** \`${hasBan ? "✓ Authorized" : "✗ Denied"}\``,
          `> - **Mute Members:** \`${hasMute ? "✓ Authorized" : "✗ Denied"}\``,
          `> - **Deafen Members:** \`${hasDeafen ? "✓ Authorized" : "✗ Denied"}\``,
          "",
          `> <:rmessage:1539875489601036298> **Text & Voice**`,
          `> - **Send Messages:** \`${hasSend ? "✓ Authorized" : "✗ Denied"}\``,
          `> - **Manage Messages:** \`${hasManageMessages ? "✓ Authorized" : "✗ Denied"}\``,
          `> - **Mention Everyone:** \`${hasMentionEveryone ? "✓ Authorized" : "✗ Denied"}\``,
          `> - **Connect Voice:** \`${hasConnect ? "✓ Authorized" : "✗ Denied"}\``,
        ].join("\n");
      }

      // Dropdown Select Menu
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("roleinfo_select")
        .setPlaceholder("Select a page...")
        .setDisabled(disableComponents)
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setEmoji("📋")
            .setLabel("Role Overview")
            .setValue("0")
            .setDescription("General role settings, color and membership list.")
            .setDefault(pageIndex === 0),
          new StringSelectMenuOptionBuilder()
            .setEmoji("🛡️")
            .setLabel("Role Permissions")
            .setValue("1")
            .setDescription(
              "Administrative, moderation, and text/voice permissions.",
            )
            .setDefault(pageIndex === 1),
        );

      const selectRow = new ActionRowBuilder().addComponents(selectMenu);

      // Prev/Next Buttons Row
      const prevBtn = new ButtonBuilder()
        .setCustomId("roleinfo_prev")
        .setLabel("◀")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disableComponents || pageIndex === 0);

      const statusBtn = new ButtonBuilder()
        .setCustomId("roleinfo_status")
        .setLabel(`${pageIndex + 1} of 2`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);

      const nextBtn = new ButtonBuilder()
        .setCustomId("roleinfo_next")
        .setLabel("▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disableComponents || pageIndex === 1);

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
    const container = await buildRoleInfoPage(currentPage);

    const replyOptions = {
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    };
    if (bannerAttachment) {
      replyOptions.files = [bannerAttachment];
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

      if (i.customId === "roleinfo_prev" && currentPage > 0) {
        currentPage--;
      } else if (i.customId === "roleinfo_next" && currentPage < 1) {
        currentPage++;
      } else if (i.customId === "roleinfo_select") {
        currentPage = parseInt(i.values[0], 10);
      }

      const newContainer = await buildRoleInfoPage(currentPage);
      const updateOptions = {
        components: [newContainer],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      };
      await interaction.editReply(updateOptions);
    });

    collector.on("end", async () => {
      try {
        const finalContainer = await buildRoleInfoPage(currentPage, true);
        await interaction.editReply({
          components: [finalContainer],
          flags: MessageFlags.IsComponentsV2,
        });
      } catch (e) {}
    });
  },
};
