'use client';

import { useState, useEffect } from "react";

type Card = {
    id: string;
    name: string;
    rarity: string;
    price: number;
    lastUpdated: string;
    image: string;
}

export default function TopCards() {

    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {

        async function fetchCards() {
            try {
                
                const res = await fetch('/api/pokemarket');
                const json = await res.json();
                
                if (!res.ok) {
                    setError(json.error || 'Failed to load cards');
                } else {
                    setCards(json);
                }
            } catch (err) {
                setError('An error occured.');
            } finally {
                setLoading(false);
            }  
        }

        fetchCards();

    }, []);


    if (loading) return (
        <p>Loading cards...</p>
    );

    if (error) return (
        <p className="text-red-600">Error: {error}</p>
    );

    const now = new Date();


    return (
        <div className="flex flex-col flex-1 justify-center items-center">
            <h1 className="text-3xl font-bold">Top 3 most expensive Pokémon TCG cards</h1>
            <p className="mb-20">as of {now.toLocaleDateString()}</p>
            <div className="flex justify-center items-center">

            {cards.map((card: Card) => (

                <div key={card.id} className="flex w-100 m-5">
                    <img src={card.image} alt={card.name} className="mr-5 w-50" />
                    <div>
                        <p className="font-bold text-xl">{card.name}</p>
                        <p className="mb-3">{card.rarity}</p>
                        <p className="text-sm text-gray-400">Market price:</p>
                        <p className="font-semibold text-lg mb-3">${card.price}</p>
                        <p className="text-sm text-gray-400">Last updated:</p>
                        <p>{card.lastUpdated.slice(0,10)}</p>
                    </div>
                </div>

            ))}

        </div>
        </div>

        

    )
 
}