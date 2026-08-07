const { AttachmentBuilder } = require("discord.js");

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatContent(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/__(.+?)__/g, "<u>$1</u>")
    .replace(/~~(.+?)~~/g, "<s>$1</s>")
    .replace(/`(.+?)`/g, '<code style="background:#2f3136;padding:2px 4px;border-radius:3px;">$1</code>')
    .replace(/\n/g, "<br>");
}

function renderMessage(msg) {
  const avatar = msg.author.displayAvatarURL({ size: 64, extension: "png" });
  const timestamp = new Date(msg.createdTimestamp).toLocaleString();
  const content = escapeHtml(msg.content) || "";

  let attachmentsHtml = "";
  if (msg.attachments.size > 0) {
    attachmentsHtml = msg.attachments
      .map((att) => {
        if (att.contentType?.startsWith("image/")) {
          return `<div class="attachment"><img src="${att.url}" style="max-width: 400px; max-height: 300px; border-radius: 4px;" /></div>`;
        }
        return `<div class="attachment">📎 <a href="${att.url}" target="_blank">${escapeHtml(att.name)}</a> (${formatBytes(att.size)})</div>`;
      })
      .join("");
  }

  let embedsHtml = "";
  if (msg.embeds.length > 0) {
    embedsHtml = msg.embeds
      .map((embed) => {
        return `<div class="embed" style="border-left: 4px solid ${embed.color ? `#${embed.color.toString(16).padStart(6, "0")}` : "#5865f2"}">
          ${embed.title ? `<div class="embed-title">${escapeHtml(embed.title)}</div>` : ""}
          ${embed.description ? `<div class="embed-desc">${escapeHtml(embed.description)}</div>` : ""}
        </div>`;
      })
      .join("");
  }

  if (msg.author.bot && !content && msg.components?.length > 0) {
    return "";
  }

  return `
  <div class="message">
    <img class="avatar" src="${avatar}" alt="Avatar" />
    <div class="content">
      <div class="author">
        <span class="name" style="color: ${msg.member?.displayHexColor || "#fff"}">${escapeHtml(msg.author.tag)}</span>
        <span class="timestamp">${timestamp}</span>
      </div>
      ${content ? `<div class="text">${formatContent(content)}</div>` : ""}
      ${attachmentsHtml}
      ${embedsHtml}
    </div>
  </div>`;
}

async function generateTranscript(channel, ticketData, guild) {
  const messages = [];
  let lastId;

  while (true) {
    const fetched = await channel.messages.fetch({ limit: 100, before: lastId }).catch(() => null);
    if (!fetched || fetched.size === 0) break;
    messages.push(...fetched.values());
    lastId = fetched.last()?.id;
    if (fetched.size < 100 || messages.length >= 500) break;
  }

  messages.reverse();

  const ticketOwner = await guild.members.fetch(ticketData?.userId).catch(() => null);
  const ownerName = ticketOwner?.user?.tag || `Unknown User (${ticketData?.userId || "N/A"})`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket #${ticketData?.ticketId || "0000"} - ${escapeHtml(guild.name)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Whitney, sans-serif;
      background: #36393f;
      color: #dcddde;
      padding: 20px;
      line-height: 1.5;
    }
    .header {
      background: #202225;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .header h1 { color: #fff; font-size: 24px; margin-bottom: 10px; }
    .header .info { color: #72767d; font-size: 14px; }
    .header .info span { color: #b9bbbe; }
    .messages { background: #36393f; }
    .message {
      display: flex;
      padding: 8px 16px;
      margin: 4px 0;
    }
    .message:hover { background: #32353b; }
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      margin-right: 16px;
      flex-shrink: 0;
    }
    .content { flex: 1; min-width: 0; }
    .author {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }
    .author .name {
      font-weight: 600;
      color: #fff;
      cursor: pointer;
    }
    .author .name:hover { text-decoration: underline; }
    .author .timestamp {
      font-size: 12px;
      color: #72767d;
    }
    .text {
      color: #dcddde;
      word-wrap: break-word;
      white-space: pre-wrap;
    }
    .attachment {
      margin-top: 8px;
      padding: 10px;
      background: #2f3136;
      border-radius: 4px;
      border-left: 4px solid #5865f2;
    }
    .attachment a { color: #00aff4; text-decoration: none; }
    .attachment a:hover { text-decoration: underline; }
    .embed {
      margin-top: 8px;
      padding: 12px;
      background: #2f3136;
      border-radius: 4px;
      border-left: 4px solid #5865f2;
      max-width: 520px;
    }
    .embed-title { color: #fff; font-weight: 600; margin-bottom: 8px; }
    .embed-desc { color: #dcddde; font-size: 14px; }
    .footer {
      margin-top: 20px;
      padding: 15px;
      background: #202225;
      border-radius: 8px;
      text-align: center;
      color: #72767d;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎟️ Ticket #${ticketData?.ticketId || "0000"} Transcript</h1>
    <div class="info">
      <p><strong>Server:</strong> <span>${escapeHtml(guild.name)}</span></p>
      <p><strong>Opened by:</strong> <span>${escapeHtml(ownerName)}</span></p>
      <p><strong>Opened:</strong> <span>${new Date(ticketData?.createdAt || Date.now()).toLocaleString()}</span></p>
      ${ticketData?.closedAt ? `<p><strong>Closed:</strong> <span>${new Date(ticketData.closedAt).toLocaleString()}</span></p>` : ""}
      <p><strong>Total Messages:</strong> <span>${messages.length}</span></p>
    </div>
  </div>

  <div class="messages">
    ${messages.map((msg) => renderMessage(msg)).join("")}
  </div>

  <div class="footer">
    ASTRIXCODE™ Ticket Transcript Engine • Generated on ${new Date().toLocaleString()}
  </div>
</body>
</html>`;

  const buffer = Buffer.from(html, "utf-8");
  return new AttachmentBuilder(buffer, {
    name: `ticket-${ticketData?.ticketId || "transcript"}-transcript.html`,
  });
}

module.exports = {
  generateTranscript,
};
