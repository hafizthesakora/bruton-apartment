import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    return NextResponse.json(
      { error: 'Google Places API not configured', reviews: [] },
      { status: 200 }
    );
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}`;
    const response = await fetch(url, { next: { revalidate: 3600 } }); // cache for 1 hour
    const data = await response.json();

    if (data.status !== 'OK') {
      return NextResponse.json(
        { error: `Google API error: ${data.status}`, reviews: [] },
        { status: 200 }
      );
    }

    const reviews = (data.result.reviews || []).map((review) => ({
      name: review.author_name,
      photo: review.profile_photo_url,
      rating: review.rating,
      text: review.text,
      time: review.relative_time_description,
    }));

    return NextResponse.json({
      reviews,
      rating: data.result.rating,
      totalReviews: data.result.user_ratings_total,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch reviews', reviews: [] },
      { status: 200 }
    );
  }
}
