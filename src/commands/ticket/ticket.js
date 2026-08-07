const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const ticketManager = require("../../lib/ticketManager");

module.exports = {
  alias: ["ticket", "tickethelp", "ticketstatus"],
  category: "Ticket",
  desc: "Comprehensive Support Ticket Control Dashboard & Commands.",
  botPermissions: ["ManageChannels", "SendMessages"],
  userPermissions: [],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const sub = args[0]?.toLowerCase();
    const config = ticketManager.getGuildTicketConfig(message.guild.id);

    if (sub === "setup") {
      const ticketSetupCmd = require("./ticketsetup");
      return ticketSetupCmd.execute(client, message, args);
    }

    if (sub === "status" || sub === "config") {
      const activeTicketsCount = Object.values(config.tickets || {}).filter((t) => !t.closed).length;
      const totalCount = config.ticketCount || 0;
      const logsChan = config.logsChannelId ? `<#${config.logsChannelId}>` : "`Not Set`";
      const supportRole = config.supportRoleId ? `<@&${config.supportRoleId}>` : "`Not Set`";
      const categoryChan = config.parentCategoryId ? `<#${config.parentCategoryId}>` : "`Not Set`";
      const blacklistCount = (config.blacklist || []).length;

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🎟️ Ticket System Configuration\n` +
            `-# *Current ticket settings for ${message.guild.name}.*\n\n` +
            `> - **Support Role:** ${supportRole}\n` +
            `> - **Ticket Category:** ${categoryChan}\n` +
            `> - **Logs Channel:** ${logsChan}\n` +
            `> - **Total Cumulative Tickets:** \`${totalCount}\` ticket(s)\n` +
            `> - **Active Open Tickets:** \`${activeTicketsCount}\` ticket(s)\n` +
            `> - **Blacklisted Users/Roles:** \`${blacklistCount}\` entry(ies)`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const mainContent =
      `# 🎟️ Support Ticket Desk Dashboard\n` +
      `-# *Manage support tickets, panels, transcripts, and staff assignments.*\n\n` +
      `### 🛠️ Ticket Commands Guide\n` +
      `> - \`.ticketsetup #channel\` / \`.ticketpanel\` — Dispatch interactive ticket panel\n` +
      `> - \`.ticketopen [reason]\` — Open a support ticket via text command\n` +
      `> - \`.ticketclose [reason]\` — Close ticket, generate HTML transcript & delete room\n` +
      `> - \`.ticketclaim\` / \`.ticketunclaim\` — Claim or unclaim ticket for support staff\n` +
      `> - \`.ticketadd @user\` / \`.ticketremove @user\` — Manage ticket room members\n` +
      `> - \`.tickettranscript\` — Generate HTML transcript of current ticket\n` +
      `> - \`.ticketrename <new-name>\` — Rename ticket channel\n` +
      `> - \`.ticketblacklist @user\` — Blacklist/unblacklist user from opening tickets\n` +
      `> - \`.ticket status\` — View active ticket system settings`;

    const footerText = `-# ASTRIXCODE™ Ticket Engine • © 2026 ASTRIXCODE`;

    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(mainContent))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(footerText));

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
