async function getOrCreateMuteRole(guild) {
  let muteRole = guild.roles.cache.find(r => r.name.toLowerCase() === "muted");
  if (!muteRole) {
    muteRole = await guild.roles.create({
      name: "Muted",
      reason: "Required for muting users.",
    });

    for (const [id, ch] of guild.channels.cache) {
      try {
        if (ch.isTextBased()) {
          await ch.permissionOverwrites.create(muteRole, {
            SendMessages: false,
            AddReactions: false,
            SendMessagesInThreads: false,
            CreatePublicThreads: false,
            CreatePrivateThreads: false,
          });
        } else if (ch.isVoiceBased()) {
          await ch.permissionOverwrites.create(muteRole, {
            Connect: false,
            Speak: false,
          });
        }
      } catch (e) {}
    }
  }
  return muteRole;
}

module.exports = {
  getOrCreateMuteRole,
};
