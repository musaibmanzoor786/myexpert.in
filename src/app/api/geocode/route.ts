import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}&components=country:in`;
    
    const response = await fetch(url);

    if (!response.ok) {
        return NextResponse.json({ error: "Failed to fetch from Google Maps" }, { status: response.status });
    }

    const data = await response.json();
    
    if (data.status !== 'OK') {
        return NextResponse.json({ error: "Location not found", status: data.status }, { status: 404 });
    }

    // Map Google results to a simpler format if needed, but returning full data for now
    return NextResponse.json(data.results);
  } catch (error) {
    console.error("Geocode route error:", error);
    return NextResponse.json({ error: "Failed to fetch address" }, { status: 500 });
  }
}
