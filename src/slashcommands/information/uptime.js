const {
  ApplicationCommandType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");

module.exports = {
  name: "uptime",
  category: "Information",
  description: "View the bot's current online duration and statistics.",
  type: ApplicationCommandType.ChatInput,

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, interaction) {
    const totalSeconds = (client.uptime / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor(totalSeconds / 3600) % 24;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const seconds = Math.floor(totalSeconds % 60);

    const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    const serverCount = client.guilds.cache.size;
    const memberCount = client.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0);
    const wsLatency = client.ws.ping;

    const ESC = "\u001b";
    const reset = `${ESC}[0m`;
    const gray = `${ESC}[0;30m`;
    const white = `${ESC}[1;37m`;
    const cyan = `${ESC}[1;36m`;
    const yellow = `${ESC}[1;33m`;
    const green = `${ESC}[1;32m`;

    let wsColor = green;
    if (wsLatency > 250) wsColor = `${ESC}[1;31m`;
    else if (wsLatency > 150) wsColor = yellow;
    else if (wsLatency > 80) wsColor = cyan;

    const statsBlock = [
      "```ansi",
      `${yellow}•  Astrix Uptime & Statistics ${reset}`,
      `   ${gray}L  ${white}Uptime            ${cyan}:${reset}  ${green}${uptimeString}${reset}`,
      `   ${gray}L  ${white}Total Servers     ${cyan}:${reset}  ${white}${serverCount.toLocaleString()}${reset}`,
      `   ${gray}L  ${white}Total Members     ${cyan}:${reset}  ${white}${memberCount.toLocaleString()}${reset}`,
      `   ${gray}L  ${white}Ping Latency      ${cyan}:${reset}  ${wsColor}${wsLatency}ms${reset}`,
      "```",
    ].join("\n");

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(statsBlock),
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

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
