const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");

module.exports = {
  alias: ["boostcount", "boosts", "serverboosts", "boosters"],
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
      nextTierText = "Max Tier (Tier 3) reached! <a:tada2:1530099488398508073>";
    }

    const content = [
      `### <a:red_boost:1528682966199566356> Server Boost Status: ${guild.name}`,
      `-# *Premium Nitro status metrics and next tier requirements.*`,
      "",
      `> <:stats:1528322466521546826> **Metrics**`,
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
          `-# *<:astrix:1527205612205903973> Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE. All rights reserved.*`,
        ),
      );

    await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });
  },
};
