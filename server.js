import http from "http";
import { parse } from "url";
import next from "next";
import { Server as IOServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new IOServer(server);

  let lastCards = [];

  async function fetchAndEmit() {
    try {
      // Fetch the same API route this app exposes
      const resp = await fetch(`http://localhost:3000/api/pokemarket`);
      if (!resp.ok) {
        console.error('Failed to fetch market data', resp.status);
        return;
      }
      const data = await resp.json();
      // Expecting an array; if the API wraps results, try to normalize
      const cards = Array.isArray(data) ? data : (data?.data || []);
      // Determine if there's a meaningful change compared to lastCards
      const hasChange = (() => {
        if (!lastCards || !lastCards.length) return true; // first time
        const lastMap = new Map(lastCards.map(c => [c.id, c]));
        const newMap = new Map(cards.map(c => [c.id, c]));

        // added or removed
        if (lastCards.length !== cards.length) return true;

        for (const [id, newCard] of newMap) {
          const oldCard = lastMap.get(id);
          if (!oldCard) return true; // added

          const oldPrice = oldCard.price;
          const newPrice = newCard.price;
          const oldListings = oldCard.listings;
          const newListings = newCard.listings;

          if (oldPrice !== newPrice || oldListings !== newListings) return true;
        }

        return false;
      })();

      if (hasChange) {
        lastCards = cards;
        const payload = { cards, updatedAt: new Date().toISOString() };
        io.emit('market-update', payload);
        console.log('Emitted market-update; items:', cards.length, 'at', payload.updatedAt);
      } else {
        // no-op; no meaningful change
        // console.log('No significant market change detected');
      }
    } catch (err) {
      console.error('Error fetching market data', err);
    }
  }

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Send cached data on connect if available
    if (lastCards && lastCards.length) {
      socket.emit('market-update', lastCards);
    }

    socket.on("subscribe-market", async () => {
      // send immediate update to this socket
      if (lastCards && lastCards.length) {
        socket.emit('market-update', lastCards);
      } else {
        await fetchAndEmit();
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected', socket.id, reason);
    });
  });

  server.listen(3000, async () => {
    console.log("Server running on http://localhost:3000");
    // prime the cache and start periodic updates
    await fetchAndEmit();
    setInterval(fetchAndEmit, 30_000); // every 30s
  });
});