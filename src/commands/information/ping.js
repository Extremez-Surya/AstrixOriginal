const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");

/** @type {import('../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["ping", "ms"],
  category: "Information",
  desc: "Run advanced ASTRIXCODE™ system network diagnostics.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const sent = await message.reply({
      content:
        "***<:Loading:1539875355140030535> Initializing diagnostic matrix...***",
      fetchReply: true,
    });

    const wsLatency = message.client.ws.ping;
    const apiLatency = sent.createdTimestamp - message.createdTimestamp;
    const memoryUsage =
      (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + " MB";

    let quality = "Excellent";
    let speedBar = "██████████";

    if (wsLatency > 250) {
      quality = "Poor";
      speedBar = "██░░░░░░░░";
    } else if (wsLatency > 150) {
      quality = "Average";
      speedBar = "██████░░░░";
    } else if (wsLatency > 80) {
      quality = "Good";
      speedBar = "████████░░";
    }

    const ESC = "\u001b";
    const reset = `${ESC}[0m`;
    const gray = `${ESC}[0;30m`;
    const white = `${ESC}[1;37m`;
    const cyan = `${ESC}[1;36m`;
    const yellow = `${ESC}[1;33m`;

    // Dynamic color selection based on latency / quality
    let statusColor = `${ESC}[1;32m`; // Default Green for Excellent
    if (quality === "Good") {
      statusColor = `${ESC}[1;36m`; // Cyan
    } else if (quality === "Average") {
      statusColor = `${ESC}[1;33m`; // Yellow
    } else if (quality === "Poor") {
      statusColor = `${ESC}[1;31m`; // Red
    }

    // Dynamic websocket latency coloring
    let wsColor = `${ESC}[1;32m`;
    if (wsLatency > 250) wsColor = `${ESC}[1;31m`;
    else if (wsLatency > 150) wsColor = `${ESC}[1;33m`;
    else if (wsLatency > 80) wsColor = `${ESC}[1;36m`;

    // Dynamic response latency coloring
    let apiColor = `${ESC}[1;32m`;
    if (apiLatency > 250) apiColor = `${ESC}[1;31m`;
    else if (apiLatency > 150) apiColor = `${ESC}[1;33m`;
    else if (apiLatency > 80) apiColor = `${ESC}[1;36m`;

    const systemBlock = [
      "```ansi",
      `${yellow}•  System Diagnostics ${reset}`,
      `   ${gray}L  ${white}Status            ${cyan}:${reset}  ${statusColor}${quality}${reset}`,
      `   ${gray}L  ${white}Websocket         ${cyan}:${reset}  ${wsColor}${wsLatency}ms${reset}`,
      `   ${gray}L  ${white}Response          ${cyan}:${reset}  ${apiColor}${apiLatency}ms${reset}`,
      `   ${gray}L  ${white}Usage             ${cyan}:${reset}  ${white}${memoryUsage}${reset}`,
      `   ${gray}L  ${white}Engine            ${cyan}:${reset}  ${white}Astrix Core v2.0.0${reset}`,
      `   ${gray}L  ${white}Signal            ${cyan}:${reset}  ${statusColor}${speedBar}${reset}`,
      "```",
    ].join("\n");

    const container = new ContainerBuilder()
      // .addTextDisplayComponents(
      //   new TextDisplayBuilder().setContent(
      //     // `# 🌌 ASTRIX NETWORK DIAGNOSTIC\n` +
      //     `-# Real-time network and system diagnostic console.`,
      //   ),
      // )
      // .addSeparatorComponents(
      //   new SeparatorBuilder()
      //     .setSpacing(SeparatorSpacingSize.Small)
      //     .setDivider(true),
      // )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(systemBlock),
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# *<:astrix:1539875362945900574> Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE. All rights reserved.*`,
        ),
      );

    await sent.edit({
      content: null,
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
