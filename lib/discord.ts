export type DiscordEmbedField = {
  name: string;
  value: string;
  inline?: boolean;
};

export type DiscordEmbed = {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  fields?: DiscordEmbedField[];
  footer?: {
    text: string;
    icon_url?: string;
  };
  thumbnail?: {
    url: string;
  };
  image?: {
    url: string;
  };
};

export type DiscordWebhookPayload = {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds?: DiscordEmbed[];
  allowed_mentions?: {
    parse?: string[];
  };
};

/**
 * Centrally forwards a notification payload to a specified Discord Webhook URL.
 */
export async function sendDiscordWebhook(
  webhookUrl: string | undefined,
  payload: DiscordWebhookPayload,
  context = "Discord Webhook Notification",
): Promise<void> {
  if (!webhookUrl) {
    console.warn(
      `[Discord Helper] Skipping send: Webhook URL is undefined for context "${context}"`,
    );
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(
        `Discord API responded with status ${response.status}: ${responseText || "No response body"}`,
      );
    }
  } catch (error) {
    console.error(`[Discord Helper] Error in ${context}:`, error);
    throw error;
  }
}

/**
 * Centrally sends an error report to the Discord Error Webhook.
 */
export async function logErrorToDiscord(
  error: unknown,
  context = "Unhandled Application Error",
): Promise<void> {
  const errorWebhookUrl = process.env.DISCORD_ERROR_WEBHOOK_URL;
  if (!errorWebhookUrl) {
    console.warn(
      `[Discord Helper] Skipping error log: DISCORD_ERROR_WEBHOOK_URL is not configured.`,
    );
    return;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack =
    error instanceof Error && error.stack
      ? error.stack.slice(0, 1000)
      : "No stack trace available";

  const payload: DiscordWebhookPayload = {
    username: "HIMA Musik Portal Error Monitor",
    embeds: [
      {
        title: `🚨 Error in ${context}`,
        description: `An error occurred during application execution.`,
        color: 0xff4f4f, // red color
        timestamp: new Date().toISOString(),
        fields: [
          {
            name: "Message",
            value: `\`\`\`\n${errorMessage}\n\`\`\``,
          },
          {
            name: "Stack Trace (Truncated)",
            value: `\`\`\`js\n${errorStack}\n\`\`\``,
          },
        ],
        footer: {
          text: "HIMA Musik Production Environment",
        },
      },
    ],
  };

  try {
    // Avoid infinite recursion if sendDiscordWebhook itself fails
    await sendDiscordWebhook(
      errorWebhookUrl,
      payload,
      `Error Monitor: ${context}`,
    );
  } catch (logError) {
    console.error(
      "[Discord Helper] Failed to report error to Discord:",
      logError,
    );
  }
}
