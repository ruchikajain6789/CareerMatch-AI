export default async function handler(request: Request): Promise<Response> {
  const incomingUrl = new URL(
  request.url,
  `https://${request.headers.get("host") || "localhost"}`
);
  const upstreamUrl = new URL("https://himalayas.app/jobs/api/search");

  for (const key of ["q", "country", "worldwide", "page"]) {
    const value = incomingUrl.searchParams.get(key);
    if (value !== null) {
      upstreamUrl.searchParams.set(key, value);
    }
  }

  try {
    const response = await fetch(upstreamUrl);
    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
        "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch {
    return Response.json(
      { error: "Unable to retrieve jobs from Himalayas." },
      { status: 502 }
    );
  }
}