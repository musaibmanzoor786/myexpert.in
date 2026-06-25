import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    
    const response = await fetch(url);

    if (!response.ok) {
        return NextResponse.json({ error: "Failed to fetch from Google Maps" }, { status: response.status });
    }

    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results?.[0]) {
        return NextResponse.json({ error: "Address not found", status: data.status }, { status: 404 });
    }

    const result = data.results[0];
    const addressComponents = result.address_components;
    
    const areaComponent = addressComponents.find((c: any) => 
        c.types.includes('sublocality') || c.types.includes('locality')
    );
    
    const area = areaComponent?.long_name || result.formatted_address?.split(',')[0];

    return NextResponse.json({
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        formattedLocation: result.formatted_address,
        area: area,
        results: data.results // Return full results for more detailed parsing if needed
    });
  } catch (error) {
    console.error("Reverse geocode route error:", error);
    return NextResponse.json({ error: "Failed to fetch address" }, { status: 500 });
  }
}
