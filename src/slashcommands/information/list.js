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
} = require("discord.js");

module.exports = {
  name: "list",
  category: "Information",
  description: "List server bots, admins, mods, boosters, roles, emojis, join positions, and badges.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "type",
      description: "Select the roster or list category to view.",
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: [
        { name: "Bots", value: "bots" },
        { name: "Admins", value: "admins" },
        { name: "Moderators", value: "mods" },
        { name: "Boosters", value: "boosters" },
        { name: "Active Developers", value: "activedeveloper" },
        { name: "Early Supporters", value: "early" },
        { name: "Join Position", value: "joinpos" },
        { name: "Account Creation", value: "createpos" },
        { name: "Emojis", value: "emojis" },
        { name: "Roles", value: "roles" },
        { name: "Bans", value: "bans" },
        { name: "Boost Invoice", value: "invoice" },
      ],
    },
    {
      name: "role",
      description: "Filter members in a specific role (when viewing role list).",
      type: ApplicationCommandOptionType.Role,
      required: false,
    },
  ],

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const guild = interaction.guild;
    const initialType = interaction.options.getString("type") || "bots";
    const targetRole = interaction.options.getRole("role");

    let currentTab = targetRole ? "inrole" : initialType;
    let currentPage = 0;

    // Fetch members
    let members;
    try {
      members = await guild.members.fetch();
    } catch (e) {
      members = guild.members.cache;
    }

    let bansCache = null;

    const getFilteredList = async (tab) => {
      const allMembers = [...members.values()];

      if (tab === "bots") {
        return allMembers.filter((m) => m.user.bot).sort((a, b) => a.user.username.localeCompare(b.user.username));
      } else if (tab === "admins") {
        return allMembers.filter((m) => m.permissions.has("Administrator")).sort((a, b) => a.user.username.localeCompare(b.user.username));
      } else if (tab === "mods") {
        return allMembers
          .filter((m) => !m.permissions.has("Administrator") && (m.permissions.has("ManageMessages") || m.permissions.has("KickMembers") || m.permissions.has("BanMembers")))
          .sort((a, b) => a.user.username.localeCompare(b.user.username));
      } else if (tab === "boosters") {
        return allMembers
          .filter((m) => m.premiumSince !== null)
          .sort((a, b) => (a.premiumSinceTimestamp || 0) - (b.premiumSinceTimestamp || 0));
      } else if (tab === "activedeveloper") {
        return allMembers
          .filter((m) => {
            const flags = m.user.flags?.toArray() || [];
            return flags.includes("ActiveDeveloper");
          })
          .sort((a, b) => a.user.username.localeCompare(b.user.username));
      } else if (tab === "early") {
        return allMembers
          .filter((m) => {
            const flags = m.user.flags?.toArray() || [];
            return flags.includes("PremiumEarlySupporter");
          })
          .sort((a, b) => a.user.username.localeCompare(b.user.username));
      } else if (tab === "joinpos") {
        return allMembers.sort((a, b) => (a.joinedTimestamp || 0) - (b.joinedTimestamp || 0));
      } else if (tab === "createpos") {
        return allMembers.sort((a, b) => a.user.createdTimestamp - b.user.createdTimestamp);
      } else if (tab === "emojis") {
        return [...guild.emojis.cache.values()].sort((a, b) => a.name.localeCompare(b.name));
      } else if (tab === "botemojis") {
        return [...guild.emojis.cache.filter((e) => e.managed).values()].sort((a, b) => a.name.localeCompare(b.name));
      } else if (tab === "roles") {
        return [...guild.roles.cache.values()].sort((a, b) => b.position - a.position);
      } else if (tab === "inrole" && targetRole) {
        return allMembers.filter((m) => m.roles.cache.has(targetRole.id)).sort((a, b) => a.user.username.localeCompare(b.user.username));
      } else if (tab === "bans") {
        if (!bansCache) {
          try {
            bansCache = await guild.bans.fetch();
          } catch (e) {
            bansCache = new Map();
          }
        }
        return [...bansCache.values()];
      } else if (tab === "invoice") {
        return [
          `Server Boost Tier: Level ${guild.premiumTier}`,
          `Total Boosters: ${guild.premiumSubscriptionCount || 0}`,
          `Server Vanity URL: ${guild.vanityURLCode ? `discord.gg/${guild.vanityURLCode}` : "None"}`,
          `Max Emojis: ${guild.emojis.cache.size} / ${guild.premiumTier === 3 ? 250 : guild.premiumTier === 2 ? 150 : guild.premiumTier === 1 ? 100 : 50}`,
          `Max Bitrate: ${guild.maximumBitrate / 1000} kbps`,
        ];
      }
      return [];
    };

    const buildPage = async (tab, pageIndex, disableAll = false) => {
      const itemsList = await getFilteredList(tab);
      const pageSize = 12;
      const totalItems = itemsList.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      const activePage = Math.max(0, Math.min(pageIndex, totalPages - 1));

      const start = activePage * pageSize;
      const end = start + pageSize;
      const sliced = itemsList.slice(start, end);

      let listContent = "";
      if (totalItems === 0) {
        listContent = `*No items found for tab \`${tab}\`.*`;
      } else if (tab === "invoice") {
        listContent = itemsList.map((item) => `> - **${item}**`).join("\n");
      } else {
        listContent = sliced
          .map((item, idx) => {
            const index = start + idx + 1;
            if (tab === "emojis" || tab === "botemojis") {
              return `> \`${index}.\` ${item} \`:${item.name}:\` (ID: \`${item.id}\`)`;
            } else if (tab === "roles") {
              return `> \`${index}.\` <@&${item.id}> ─ \`${item.name}\` (Members: \`${item.members.size}\`)`;
            } else if (tab === "bans") {
              return `> \`${index}.\` **${item.user.tag}** (\`${item.user.id}\`) ─ Reason: *${item.reason || "No reason specified"}*`;
            } else if (tab === "joinpos" || tab === "createpos") {
              const ts = tab === "joinpos" ? Math.floor(item.joinedTimestamp / 1000) : Math.floor(item.user.createdTimestamp / 1000);
              return `> \`${index}.\` <@${item.user.id}> (\`${item.user.id}\`) ─ <t:${ts}:R>`;
            } else {
              return `> \`${index}.\` <@${item.user.id}> ─ \`${item.user.username}\` (ID: \`${item.user.id}\`)`;
            }
          })
          .join("\n");
      }

      const titles = {
        bots: "Server Bots",
        admins: "Server Administrators",
        mods: "Server Moderators",
        boosters: "Server Boosters",
        activedeveloper: "Active Developers",
        early: "Early Supporters",
        joinpos: "Member Join Sequence",
        createpos: "Account Creation Sequence",
        emojis: "Server Emojis",
        botemojis: "Integration Emojis",
        roles: "Server Roles",
        inrole: `Members in ${targetRole ? targetRole.name : "Role"}`,
        bans: "Guild Ban Roster",
        invoice: "Server Boost Invoice",
      };

      const tabTitle = titles[tab] || "Guild List";

      const content = [
        `### <:list:1539875411780042802> ${tabTitle} ── ${guild.name}`,
        `-# *Explore detailed server rosters, statistics, and member categories.*`,
        "",
        listContent,
        "",
        `> <:stats:1539875420256866314> **Category:** \`${tabTitle}\` | **Total Items:** \`${totalItems}\``,
        `> <:list:1539875411780042802> **Page:** \`${activePage + 1} of ${totalPages}\``,
      ].join("\n");

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("list_tab_select")
        .setPlaceholder("Select a list view...")
        .setDisabled(disableAll)
        .addOptions([
          { label: "Bots", value: "bots", description: "View all server bot accounts" },
          { label: "Admins", value: "admins", description: "View server administrators" },
          { label: "Moderators", value: "mods", description: "View server moderators" },
          { label: "Boosters", value: "boosters", description: "View Nitro boosters" },
          { label: "Active Developers", value: "activedeveloper", description: "View members with Active Dev badge" },
          { label: "Early Supporters", value: "early", description: "View Early Supporter badge holders" },
          { label: "Join Position", value: "joinpos", description: "View members by join date" },
          { label: "Account Creation", value: "createpos", description: "View members by account creation" },
          { label: "Emojis", value: "emojis", description: "View all custom emojis" },
          { label: "Roles", value: "roles", description: "View server role hierarchy" },
          { label: "Bans", value: "bans", description: "View server ban list" },
          { label: "Boost Invoice", value: "invoice", description: "View server boost status" },
        ]);

      const selectRow = new ActionRowBuilder().addComponents(selectMenu);

      const paginationRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("list_prev").setLabel("◀").setStyle(ButtonStyle.Secondary).setDisabled(disableAll || activePage === 0),
        new ButtonBuilder().setCustomId("list_next").setLabel("▶").setStyle(ButtonStyle.Secondary).setDisabled(disableAll || activePage >= totalPages - 1)
      );

      const container = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`-# *<:astrix:1539875362945900574> Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE*`)
        )
        .addActionRowComponents(selectRow)
        .addActionRowComponents(paginationRow);

      return { container, activePage, totalPages };
    };

    let { container, activePage, totalPages } = await buildPage(currentTab, currentPage);

    await interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });

    const replyMsg = await interaction.fetchReply();

    const filter = (i) => i.user.id === interaction.user.id;
    const collector = replyMsg.createMessageComponentCollector({
      filter,
      time: 120000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();

      if (i.customId === "list_tab_select") {
        currentTab = i.values[0];
        currentPage = 0;
      } else if (i.customId === "list_prev") {
        currentPage = Math.max(0, currentPage - 1);
      } else if (i.customId === "list_next") {
        currentPage = currentPage + 1;
      }

      const updated = await buildPage(currentTab, currentPage);
      currentPage = updated.activePage;
      totalPages = updated.totalPages;

      await interaction.editReply({
        components: [updated.container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    });

    collector.on("end", async () => {
      try {
        const final = await buildPage(currentTab, currentPage, true);
        await interaction.editReply({
          components: [final.container],
          allowedMentions: { parse: [], repliedUser: false },
        });
      } catch (e) {}
    });
  },
};
