import robotsParser from "robots-parser";

export async function isAllowedByRobots(
  url: string,
  userAgent: string = "FlankBot/1.0",
): Promise<boolean> {
  try {
    const targetUrl = new URL(url);
    const robotsUrl = `${targetUrl.protocol}//${targetUrl.host}/robots.txt`;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(robotsUrl, {
      signal: controller.signal,
      headers: { "User-Agent": userAgent },
    });

    clearTimeout(id);

    if (res.ok) {
      const robotsTxt = await res.text();
      const robots = robotsParser(robotsUrl, robotsTxt);
      const isAllowed = robots.isAllowed(url, userAgent);
      return isAllowed === undefined ? true : isAllowed;
    }
  } catch (_err) {
    // If robots.txt fails to load (timeout, 404, etc), assume allowed but log warning if desired
  }
  return true;
}
