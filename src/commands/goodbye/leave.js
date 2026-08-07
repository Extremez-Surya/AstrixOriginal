const goodbyeCommand = require("./goodbye");

module.exports = {
  alias: ["leave", "leaveconfig", "farewellconfig"],
  category: "Goodbye",
  desc: "Manage server leave greetings & departure system configuration.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    return goodbyeCommand.execute(client, message, args);
  },
};
