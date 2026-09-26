const welcomeManager = require("../../lib/welcomeManager");
const { buildJoinDmHubPayload } = require("../../lib/welcome/welcomeBuilder");

module.exports = {
  alias: ["joindm", "dmwelcome"],
  category: "Welcome",
  desc: "Interactive Join DM Greetings Manager — setup premade canvas, custom embed/container studio.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const action = args[0]?.toLowerCase();
    const text = args.slice(1).join(" ");

    if (action === "test") {
      const testCmd = client.messageCommands.get("joindmtest");
      if (testCmd) {
        return testCmd.execute(client, message, args);
      }
    }

    if (action === "enable" || action === "on") {
      if (text) {
        welcomeManager.updateGuildWelcome(message.guild.id, { joinDmEnabled: true, joinDmText: text });
      } else {
        welcomeManager.updateGuildWelcome(message.guild.id, { joinDmEnabled: true });
      }
      const payload = buildJoinDmHubPayload(message.guild, message.member || message.author, "✅ Join DM greetings are now **ENABLED**!");
      return message.reply(payload).catch(() => null);
    }

    if (action === "disable" || action === "off") {
      welcomeManager.updateGuildWelcome(message.guild.id, { joinDmEnabled: false });
      const payload = buildJoinDmHubPayload(message.guild, message.member || message.author, "⚠️ Join DM greetings are now **DISABLED**.");
      return message.reply(payload).catch(() => null);
    }

    const payload = buildJoinDmHubPayload(message.guild, message.member || message.author);
    return message.reply(payload).catch(() => null);
  },
};
