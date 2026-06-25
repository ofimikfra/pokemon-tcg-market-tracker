import { NextResponse } from "next/server";

type Card = {
    id: string;
    name: string;
    rarity: string;
    price: number;
    lastUpdated: string;
    image: string;
}

export async function GET() {

    const apikey = process.env.API_KEY || '';
    const apiUrl = `${process.env.API_URL}?language=english&minPrice=50&sortBy=price&sortOrder=desc&limit=3'`;

    const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apikey}`,
      },
        next: { revalidate: 43200 }
    });

    if (!response.ok) {
        return NextResponse.json(
            { error: `API responded with status ${response.status}` },
            
            { status:500 }
        );
    };

    const json = await response.json();

    const cards: Card[] = json.data.map((card:any) => ({
        id: card.tcgPlayerId || card.id,
        name: card.name,
        rarity: card.rarity,
        price: card.prices?.market,
        lastUpdated: card.prices?.lastUpdated,
        image: card.imageCdnUrl,
    }))

    return NextResponse.json(cards);

}