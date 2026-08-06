const fs = require("fs");
const path = require("path");

const LIKES_FILE = path.join(__dirname, "../userLikes.json");
let userLikes = {};

function loadLikes() {
  try {
    if (fs.existsSync(LIKES_FILE)) {
      userLikes = JSON.parse(fs.readFileSync(LIKES_FILE, "utf-8"));
    }
  } catch (err) {
    userLikes = {};
  }
}

function saveLikes() {
  try {
    fs.writeFileSync(LIKES_FILE, JSON.stringify(userLikes, null, 2), "utf-8");
  } catch (err) {}
}

loadLikes();

function addLikedTrack(userId, track) {
  if (!userId || !track) return false;
  if (!userLikes[userId]) userLikes[userId] = [];
  const exists = userLikes[userId].some((t) => t.uri === track.uri);
  if (exists) return false;

  userLikes[userId].push({
    title: track.title,
    author: track.author,
    uri: track.uri,
    length: track.length,
  });
  saveLikes();
  return true;
}

function getLikedTracks(userId) {
  return userLikes[userId] || [];
}

function removeLikedTrack(userId, uri) {
  if (!userLikes[userId]) return false;
  const initialLen = userLikes[userId].length;
  userLikes[userId] = userLikes[userId].filter((t) => t.uri !== uri);
  saveLikes();
  return userLikes[userId].length < initialLen;
}

module.exports = {
  addLikedTrack,
  getLikedTracks,
  removeLikedTrack,
};
