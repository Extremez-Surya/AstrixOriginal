const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const levelingManager = require("../../lib/levelingManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["leveling", "levelsystem", "lconfig"],
  category: "Leveling",
  desc: "Interactive control panel to manage the server's leveling system.",
  botPermissions: ["SendMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    const guildId = message.guild.id;
    let config = levelingManager.getGuildLeveling(guildId);

    // Subcommand quick toggles (e.g. .leveling enable, .leveling disable)
    if (args[0]) {
      const sub = args[0].toLowerCase();
      if (["enable", "on"].includes(sub)) {
        config.enabled = true;
        levelingManager.setGuildLeveling(guildId, config);
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.success || "✅"} Leveling System Enabled\n` +
            `-# *Members will now earn XP from chat and voice activity.*`
          )
        );
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }
      if (["disable", "off"].includes(sub)) {
        config.enabled = false;
        levelingManager.setGuildLeveling(guildId, config);
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.cross || "❌"} Leveling System Disabled\n` +
            `-# *XP accumulation and level-up announcements have been paused.*`
          )
        );
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }
    }

    const buildPanel = (section = "overview", disabled = false) => {
      config = levelingManager.getGuildLeveling(guildId);
      const membersData = levelingManager.getGuildMembersData(guildId);
      const totalTracked = Object.keys(membersData).length;

      let content = "";
      switch (section) {
        case "overview":
          content =
            `### 📈 Leveling System ── ${message.guild.name}\n` +
            `-# *Interactive Leveling & XP Configuration Panel*\n\n` +
            `> - **Status:** ${config.enabled ? "`🟢 Active`" : "`🔴 Disabled`"}\n` +
            `> - **Tracked Members:** \`${totalTracked}\`\n` +
            `> - **Announcement Mode:** \`${config.announce.mode.toUpperCase()}\`\n` +
            `> - **Text XP Range:** \`${config.xp.text.minXp}-${config.xp.text.maxXp} XP\`\n` +
            `> - **Voice XP Range:** \`${config.xp.voice.minXp}-${config.xp.voice.maxXp} XP/min\`\n` +
            `> - **XP Cooldown:** \`${config.xp.cooldownMs / 1000}s\`\n` +
            `> - **Anti-Cheat:** ${config.antiCheat.enabled ? "`🛡️ Active`" : "`⚠️ Inactive`"}`;
          break;

        case "toggle":
          config.enabled = !config.enabled;
          levelingManager.setGuildLeveling(guildId, config);
          content =
            `### ⚙️ Master Status Updated\n` +
            `-# *Leveling system state toggled*\n\n` +
            `> - **Current Status:** ${config.enabled ? "`🟢 Enabled`" : "`🔴 Disabled`"}`;
          break;

        case "announce":
          content =
            `### 📢 Level-Up Announcement Settings\n` +
            `-# *Control where level-up messages are broadcasted*\n\n` +
            `> - **Current Mode:** \`${config.announce.mode.toUpperCase()}\`\n` +
            `> - **Channel:** ${config.announce.channelId ? `<#${config.announce.channelId}>` : "`Current Channel`"}\n` +
            `> - **Message Template:** \`${config.announce.template}\``;
          break;

        case "xpconfig":
          content =
            `### 📊 XP & Rate Limit Configurations\n` +
            `-# *Adjust XP calculation and cooldown parameters*\n\n` +
            `> - **Text XP:** \`${config.xp.text.minXp} - ${config.xp.text.maxXp} XP\` per msg\n` +
            `> - **Voice XP:** \`${config.xp.voice.minXp} - ${config.xp.voice.maxXp} XP\` per min\n` +
            `> - **Cooldown:** \`${config.xp.cooldownMs / 1000}s\`\n` +
            `> - **XP Multiplier:** \`${config.xp.multiplier}x\`\n` +
            `> - **Min Message Length:** \`${config.xp.minMsgLength} chars\``;
          break;

        case "anticheat":
          content =
            `### 🔒 Anti-Cheat & Spam Protection\n` +
            `-# *Automated XP exploit prevention engine*\n\n` +
            `> - **Protection Status:** ${config.antiCheat.enabled ? "`🟢 Enabled`" : "`🔴 Disabled`"}\n` +
            `> - **Max Burst Limit:** \`${config.antiCheat.maxBurst} msgs / 10s\`\n` +
            `> - **Enforcement Action:** \`${config.antiCheat.action.toUpperCase()}\``;
          break;

        case "rewards":
          const roleRewards = config.rewards.roles || [];
          const rewardsList = roleRewards.length
            ? roleRewards.map((r) => `> - Level \`${r.level}\` ➔ <@&${r.roleId}>`).join("\n")
            : `> *No role rewards configured yet.*`;

          content =
            `### 🎁 Role Rewards Settings\n` +
            `-# *Automatically assign roles upon reaching level milestones*\n\n` +
            `> - **Role Stacking:** ${config.rewards.stackRoles ? "`Enabled (Keep previous roles)`" : "`Disabled (Highest role only)`"}\n\n` +
            `**Configured Rewards:**\n` +
            rewardsList;
          break;
      }

      const menu = new StringSelectMenuBuilder()
        .setCustomId("leveling_menu")
        .setPlaceholder("Select a leveling section to manage...")
        .setDisabled(disabled)
        .addOptions([
          { label: "Overview", description: "View overall status and metrics", value: "overview", emoji: "🌐" },
          { label: "Toggle System", description: "Enable or disable XP accumulation", value: "toggle", emoji: "⚡" },
          { label: "Announcements", description: "Configure level-up broadcast settings", value: "announce", emoji: "📢" },
          { label: "XP & Cooldowns", description: "Adjust XP rates and timers", value: "xpconfig", emoji: "📊" },
          { label: "Anti-Cheat", description: "Manage anti-spam burst protection", value: "anticheat", emoji: "🔒" },
          { label: "Role Rewards", description: "Configure role rewards & stacking", value: "rewards", emoji: "🎁" },
        ]);

      const row = new ActionRowBuilder().addComponents(menu);

      const container = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addActionRowComponents(row);

      return container;
    };

    const initialContainer = buildPanel("overview");
    const replyMsg = await message.reply({
      components: [initialContainer],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });

    const collector = replyMsg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 60000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();
      const selected = i.values[0];
      const updatedContainer = buildPanel(selected);
      await replyMsg.edit({
        components: [updatedContainer],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    });

    collector.on("end", async () => {
      const finalContainer = buildPanel("overview", true);
      await replyMsg.edit({
        components: [finalContainer],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    });
  },
};
