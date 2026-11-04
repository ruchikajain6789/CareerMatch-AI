import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  const upstreamUrl = new URL("https://himalayas.app/jobs/api/search");

  for (const key of ["q", "country", "worldwide", "page"]) {
    const value = request.query[key];

    if (typeof value === "string") {
      upstreamUrl.searchParams.set(key, value);
    }
  }

  try {
    const apiResponse = await fetch(upstreamUrl);
    const data = await apiResponse.text();

    return response
      .status(apiResponse.status)
      .setHeader(
        "Content-Type",
        apiResponse.headers.get("Content-Type") || "application/json"
      )
      .send(data);
  } catch (error) {
    console.error("Himalayas API error:", error);

    return response.status(502).json({
      error: "Unable to retrieve jobs from Himalayas.",
    });
  }
}