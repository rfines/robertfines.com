import { PostHog } from "posthog-node";

export async function captureEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
): Promise<void> {
  const apiKey = process.env.POSTHOG_API_KEY;
  if (!apiKey) return;

  const client = new PostHog(apiKey, {
    host: "https://us.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });

  try {
    client.capture({ distinctId, event, properties });
    await client.shutdown();
  } catch {
    // never let analytics break the API
  }
}
