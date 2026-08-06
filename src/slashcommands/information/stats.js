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
} = require("discord.js");
const config = require("../../lib/config.json");

module.exports = {
  name: "stats",
  category: "Information",
  description: "View the bot's interactive statistics and system metrics.",
  type: ApplicationCommandType.ChatInput,

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();

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
        console.error(`Failed to fetch team member with ID ${memberInfo.id}:`, e);
      }
    }

    if (fetchedTeam.length === 0) {
      try {
        const application = await client.application.fetch();
        const devUser = application.owner.ownerId 
          ? await client.users.fetch(application.owner.ownerId, { force: true })
          : await client.users.fetch(application.owner.id, { force: true });
        fetchedTeam.push({
          id: devUser.id,
          username: devUser.username,
          role: "Owner & Lead Developer",
        });
      } catch (e) {}
    }

    // Helper to compile the response container for any active tab
    const buildStatsPage = (activeTab, disableButtons = false) => {
      const totalSeconds = (client.uptime / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor(totalSeconds / 3600) % 24;
      const minutes = Math.floor(totalSeconds / 60) % 60;
      const seconds = Math.floor(totalSeconds % 60);
      const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      const ESC = "\u001b";
      const reset = `${ESC}[0m`;
      const gray = `${ESC}[0;30m`;
      const white = `${ESC}[1;37m`;
      const cyan = `${ESC}[1;36m`;
      const yellow = `${ESC}[1;33m`;
      const green = `${ESC}[1;32m`;

      let ansiContent = "";
      let rows = [];

      // Main navigation tabs row
      const mainRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("stats_overview")
          .setLabel("Overview")
          .setStyle(activeTab === "overview" ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(disableButtons),
        new ButtonBuilder()
          .setCustomId("stats_system")
          .setLabel("System")
          .setStyle(activeTab === "system" ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(disableButtons),
        new ButtonBuilder()
          .setCustomId("stats_team")
          .setLabel("Team")
          .setStyle(activeTab.startsWith("team") ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(disableButtons),
        new ButtonBuilder()
          .setCustomId("stats_general")
          .setLabel("General")
          .setStyle(activeTab === "general" ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(disableButtons)
      );
      rows.push(mainRow);

      if (activeTab === "overview") {
        const servers = client.guilds.cache.size;
        const users = client.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0);
        const channels = client.channels.cache.size;
        const ping = client.ws.ping;

        ansiContent = [
          "```ansi",
          `${yellow}•  Astrix Status: Overview ${reset}`,
          `   ${gray}L  ${white}Servers           ${cyan}:${reset}  ${green}${servers.toLocaleString()}${reset}`,
          `   ${gray}L  ${white}Users             ${cyan}:${reset}  ${green}${users.toLocaleString()}${reset}`,
          `   ${gray}L  ${white}Channels          ${cyan}:${reset}  ${green}${channels.toLocaleString()}${reset}`,
          `   ${gray}L  ${white}Ping Latency      ${cyan}:${reset}  ${green}${ping}ms${reset}`,
          `   ${gray}L  ${white}Uptime            ${cyan}:${reset}  ${green}${uptimeString}${reset}`,
          "```"
        ].join("\n");
      } else if (activeTab === "system") {
        const os = require("os");
        const platform = os.platform();
        const arch = os.arch();
        const cpuModel = os.cpus()[0]?.model || "Unknown CPU";
        const heap = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const nodeVersion = process.version;
        const djsVersion = require("discord.js").version;

        ansiContent = [
          "```ansi",
          `${yellow}•  Astrix Status: System Specs ${reset}`,
          `   ${gray}L  ${white}Platform          ${cyan}:${reset}  ${white}${platform} (${arch})${reset}`,
          `   ${gray}L  ${white}CPU Model         ${cyan}:${reset}  ${white}${cpuModel}${reset}`,
          `   ${gray}L  ${white}Heap Memory       ${cyan}:${reset}  ${green}${heap} MB${reset}`,
          `   ${gray}L  ${white}Runtime           ${cyan}:${reset}  ${white}Node.js ${nodeVersion}${reset}`,
          `   ${gray}L  ${white}Wrapper           ${cyan}:${reset}  ${white}Discord.js v${djsVersion}${reset}`,
          "```"
        ].join("\n");
      } else if (activeTab === "team") {
        const lines = [
          "```ansi",
          `${yellow}•  Astrix Status: Development Team ${reset}`,
        ];
        fetchedTeam.forEach((member) => {
          const roleStr = member.role.padEnd(18, " ");
          lines.push(`   ${gray}L  ${white}${roleStr}${cyan}:${reset}  ${green}${member.username}${reset}`);
        });
        lines.push("```");
        ansiContent = lines.join("\n");

        // Add developer selector buttons row
        const devButtons = fetchedTeam.map((member) => {
          return new ButtonBuilder()
            .setCustomId(`stats_dev_${member.id}`)
            .setLabel(member.username)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disableButtons);
        });

        if (devButtons.length > 0) {
          for (let i = 0; i < devButtons.length; i += 5) {
            const chunk = devButtons.slice(i, i + 5);
            const devRow = new ActionRowBuilder().addComponents(...chunk);
            rows.push(devRow);
          }
        }
      } else if (activeTab.startsWith("team_detail_")) {
        const devId = activeTab.replace("team_detail_", "");
        const member = fetchedTeam.find(m => m.id === devId);

        if (member) {
          ansiContent = [
            "```ansi",
            `${yellow}•  Astrix Team: ${member.username} ${reset}`,
            `   ${gray}L  ${white}Username          ${cyan}:${reset}  ${green}${member.username}${reset}`,
            `   ${gray}L  ${white}Discord ID        ${cyan}:${reset}  ${white}${member.id}${reset}`,
            `   ${gray}L  ${white}Role              ${cyan}:${reset}  ${white}${member.role}${reset}`,
            `   ${gray}L  ${white}Support Server    ${cyan}:${reset}  ${green}discord.gg/FR9pXG2Mwb${reset}`,
            "```"
          ].join("\n");
        } else {
          ansiContent = `\`\`\`ansi\n${ESC}[1;31mError: Member not found.${reset}\n\`\`\``;
        }

        // Add Back to Team list button row
        const backRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("stats_team_back")
            .setLabel("← Back to Team")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disableButtons)
        );
        rows.push(backRow);
      } else if (activeTab === "general") {
        const creationDate = client.user.createdAt.toLocaleDateString();
        const totalCmds = client.messageCommands?.size || 0;
        const totalSlashCmds = client.slashCommands?.size || 0;

        ansiContent = [
          "```ansi",
          `${yellow}•  Astrix Status: General Info ${reset}`,
          `   ${gray}L  ${white}Client ID         ${cyan}:${reset}  ${white}${client.user.id}${reset}`,
          `   ${gray}L  ${white}Commands Loaded   ${cyan}:${reset}  ${white}${totalCmds} prefix / ${totalSlashCmds} slash${reset}`,
          `   ${gray}L  ${white}Created At        ${cyan}:${reset}  ${white}${creationDate}${reset}`,
          `   ${gray}L  ${white}Support Server    ${cyan}:${reset}  ${green}discord.gg/FR9pXG2Mwb${reset}`,
          "```"
        ].join("\n");
      }

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(ansiContent),
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# *<:astrix:1527205612205903973> Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE. All rights reserved.*`,
          ),
        );

      rows.forEach((row) => {
        container.addActionRowComponents(row);
      });

      return container;
    };

    let currentTab = "overview";
    let container = buildStatsPage(currentTab);

    await interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });

    const replyMsg = await interaction.fetchReply();

    const filter = (i) => i.user.id === interaction.user.id;
    const collector = replyMsg.createMessageComponentCollector({
      filter,
      time: 120000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();

      if (i.customId === "stats_overview") currentTab = "overview";
      else if (i.customId === "stats_system") currentTab = "system";
      else if (i.customId === "stats_team" || i.customId === "stats_team_back") currentTab = "team";
      else if (i.customId === "stats_general") currentTab = "general";
      else if (i.customId.startsWith("stats_dev_")) {
        const devId = i.customId.replace("stats_dev_", "");
        currentTab = `team_detail_${devId}`;
      }

      const newContainer = buildStatsPage(currentTab);
      await interaction.editReply({
        components: [newContainer],
        flags: MessageFlags.IsComponentsV2,
      });
    });

    collector.on("end", async () => {
      try {
        const finalContainer = buildStatsPage(currentTab, true);
        await interaction.editReply({
          components: [finalContainer],
          flags: MessageFlags.IsComponentsV2,
        });
      } catch (e) {}
    });
  },
};
