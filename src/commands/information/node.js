const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const os = require("os");

module.exports = {
  alias: ["node"],
  category: "Information",
  desc: "View Node.js runtime environment diagnostics and memory stats.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const totalSeconds = process.uptime();
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor(totalSeconds / 3600) % 24;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const seconds = Math.floor(totalSeconds % 60);
    const processUptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    const mem = process.memoryUsage();
    const rss = (mem.rss / 1024 / 1024).toFixed(2);
    const heapTotal = (mem.heapTotal / 1024 / 1024).toFixed(2);
    const heapUsed = (mem.heapUsed / 1024 / 1024).toFixed(2);
    const external = (mem.external / 1024 / 1024).toFixed(2);

    const ESC = "\u001b";
    const reset = `${ESC}[0m`;
    const gray = `${ESC}[0;30m`;
    const white = `${ESC}[1;37m`;
    const cyan = `${ESC}[1;36m`;
    const yellow = `${ESC}[1;33m`;
    const green = `${ESC}[1;32m`;

    const nodeBlock = [
      "```ansi",
      `${yellow}•  Node.js Runtime Diagnostics ${reset}`,
      `   ${gray}L  ${white}Node Version      ${cyan}:${reset}  ${green}${process.version}${reset}`,
      `   ${gray}L  ${white}Process Uptime    ${cyan}:${reset}  ${green}${processUptime}${reset}`,
      `   ${gray}L  ${white}Platform          ${cyan}:${reset}  ${white}${process.platform} (${process.arch})${reset}`,
      "",
      `${yellow}•  V8 Engine Memory Telemetry ${reset}`,
      `   ${gray}L  ${white}RSS               ${cyan}:${reset}  ${green}${rss} MB${reset}`,
      `   ${gray}L  ${white}Heap Total        ${cyan}:${reset}  ${green}${heapTotal} MB${reset}`,
      `   ${gray}L  ${white}Heap Used         ${cyan}:${reset}  ${green}${heapUsed} MB${reset}`,
      `   ${gray}L  ${white}External          ${cyan}:${reset}  ${green}${external} MB${reset}`,
      "",
      `${yellow}•  Built-in Subsystem Engines ${reset}`,
      `   ${gray}L  ${white}V8 Engine         ${cyan}:${reset}  ${white}${process.versions.v8}${reset}`,
      `   ${gray}L  ${white}OpenSSL           ${cyan}:${reset}  ${white}${process.versions.openssl}${reset}`,
      `   ${gray}L  ${white}libuv             ${cyan}:${reset}  ${white}${process.versions.uv}${reset}`,
      `   ${gray}L  ${white}zlib              ${cyan}:${reset}  ${white}${process.versions.zlib}${reset}`,
      "```",
    ].join("\n");

    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(nodeBlock))
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

    await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
