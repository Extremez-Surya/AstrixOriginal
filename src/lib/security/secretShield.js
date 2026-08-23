const TOKEN_PATTERNS = [
  // Modern Discord bot token regex (e.g. MTIu..., NTIu..., OTIu...)
  /[a-zA-Z0-9_-]{24,28}\.[a-zA-Z0-9_-]{6,7}\.[a-zA-Z0-9_-]{27,38}/g,
  // Discord Webhook URLs
  /https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[a-zA-Z0-9_-]+/gi,
  // MongoDB / Database URIs with passwords
  /mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@[^\s/]+/gi,
  /postgres(?:ql)?:\/\/[^:]+:[^@]+@[^\s/]+/gi,
];

/**
 * Returns all active known secrets in process.env
 */
function getKnownSecrets() {
  const secrets = new Set();

  if (process.env.DISCORD_TOKEN) secrets.add(process.env.DISCORD_TOKEN.trim());
  if (process.env.TOKEN) secrets.add(process.env.TOKEN.trim());
  if (process.env.CLIENT_SECRET) secrets.add(process.env.CLIENT_SECRET.trim());
  if (process.env.MONGO_URI) secrets.add(process.env.MONGO_URI.trim());
  if (process.env.DATABASE_URL) secrets.add(process.env.DATABASE_URL.trim());

  // Add any env var containing "TOKEN", "SECRET", "PASSWORD", "KEY", "PASS"
  for (const [k, v] of Object.entries(process.env)) {
    if (!v || typeof v !== "string" || v.length < 8) continue;
    const upper = k.toUpperCase();
    if (
      upper.includes("TOKEN") ||
      upper.includes("SECRET") ||
      upper.includes("PASSWORD") ||
      upper.includes("KEY") ||
      upper.includes("AUTH")
    ) {
      secrets.add(v.trim());
    }
  }

  return Array.from(secrets);
}

/**
 * Redacts all known tokens, environment secrets, and token patterns from a string.
 */
function sanitizeString(str) {
  if (typeof str !== "string") return str;
  if (!str || str.length === 0) return str;

  let sanitized = str;

  // 1. Redact specific known secrets
  const secrets = getKnownSecrets();
  for (const secret of secrets) {
    if (secret && secret.length >= 6 && sanitized.includes(secret)) {
      sanitized = sanitized.split(secret).join("[🔒 PROTECTED_SECRET_REDACTED]");
    }
  }

  // 2. Redact matching token regex patterns
  for (const pattern of TOKEN_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[🔒 PROTECTED_TOKEN_REDACTED]");
  }

  return sanitized;
}

/**
 * Recursively sanitizes payloads (strings, objects, arrays, embeds, components).
 */
function sanitizePayload(payload) {
  if (!payload) return payload;

  if (typeof payload === "string") {
    return sanitizeString(payload);
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizePayload(item));
  }

  if (typeof payload === "object") {
    // If it has content property
    if (typeof payload.content === "string") {
      payload.content = sanitizeString(payload.content);
    }

    // If it has embeds
    if (Array.isArray(payload.embeds)) {
      payload.embeds = payload.embeds.map((emb) => {
        if (typeof emb === "object" && emb !== null) {
          if (emb.description) emb.description = sanitizeString(emb.description);
          if (emb.title) emb.title = sanitizeString(emb.title);
          if (Array.isArray(emb.fields)) {
            emb.fields = emb.fields.map((f) => ({
              ...f,
              name: sanitizeString(f.name),
              value: sanitizeString(f.value),
            }));
          }
        }
        return emb;
      });
    }

    // If it has components
    if (Array.isArray(payload.components)) {
      payload.components = payload.components.map((comp) => {
        try {
          const compJson = JSON.stringify(comp);
          const sanitizedCompJson = sanitizeString(compJson);
          return JSON.parse(sanitizedCompJson);
        } catch (_) {
          return comp;
        }
      });
    }

    return payload;
  }

  return payload;
}

/**
 * Installs global client-level outbound protection hook
 */
function attachOutboundProtection(client) {
  if (!client) return;

  const originalRestPost = client.rest.post.bind(client.rest);
  client.rest.post = function (fullRoute, options) {
    if (options && options.body) {
      options.body = sanitizePayload(options.body);
    }
    return originalRestPost(fullRoute, options);
  };

  const originalRestPatch = client.rest.patch.bind(client.rest);
  client.rest.patch = function (fullRoute, options) {
    if (options && options.body) {
      options.body = sanitizePayload(options.body);
    }
    return originalRestPatch(fullRoute, options);
  };
}

module.exports = {
  sanitizeString,
  sanitizePayload,
  attachOutboundProtection,
  getKnownSecrets,
};
