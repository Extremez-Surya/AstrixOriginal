const goodbyeSlash = require("./goodbye");

module.exports = {
  name: "leave",
  description: "Manage server leave greetings & departure system configuration.",
  category: "Goodbye",
  defaultMemberPermissions: goodbyeSlash.defaultMemberPermissions,
  others: goodbyeSlash.others,

  async execute(interaction, client) {
    return goodbyeSlash.execute(interaction, client);
  },
};
