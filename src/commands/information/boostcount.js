const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");

module.exports = {
  alias: ["boostcount", "boosts", "serverboosts"],
  category: "Information",
  desc: "View the server's premium boost level and statistics.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const guild = message.guild;

    const count = guild.premiumSubscriptionCount || 0;
    const tier = guild.premiumTier;
    const boosters = guild.members.cache.filter(
      (m) => m.premiumSince !== null,
    ).size;

    const boosterRole = guild.roles.cache.find(
      (r) => r.tags?.premiumSubscriberRole,
    );
    const boosterRoleMention = boosterRole ? `<@&${boosterRole.id}>` : "None";

    let nextTierText = "";
    if (count < 2) {
      nextTierText = `\`${2 - count}\` more boosts needed for Tier 1`;
    } else if (count < 7) {
      nextTierText = `\`${7 - count}\` more boosts needed for Tier 2`;
    } else if (count < 14) {
      nextTierText = `\`${14 - count}\` more boosts needed for Tier 3`;
    } else {
      nextTierText = "Max Tier (Tier 3) reached! <:tada2:1539875614440554597>";
    }

    const content = [
      `### <:red_boost:1539875476255023157> Server Boost Status: ${guild.name}`,
      `-# *Premium Nitro status metrics and next tier requirements.*`,
      "",
      `> <:stats:1539875420256866314> **Metrics**`,
      `> - **Boost Level:** \`Tier ${tier}\``,
      `> - **Total Boosts:** \`${count}\``,
      `> - **Cached Boosters:** \`${boosters}\``,
      `> - **Booster Role:** ${boosterRoleMention}`,
      `> - **Milestone:** ${nextTierText}`,
    ].join("\n");

    const container = new ContainerBuilder()
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
      );

    await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });
  },
};
