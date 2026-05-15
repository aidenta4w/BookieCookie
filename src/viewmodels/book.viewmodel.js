const https = require("https");

const GOOGLE_BOOKS_BASE_URL = "https://www.googleapis.com/books/v1/volumes";
const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000;
const searchCache = new Map();

const fetchJson = (url) => new Promise((resolve, reject) => {
  const request = https.get(url, (response) => {
    let rawData = "";

    response.on("data", (chunk) => {
      rawData += chunk;
    });

    response.on("end", () => {
      try {
        const parsed = rawData ? JSON.parse(rawData) : {};
        resolve({
          statusCode: response.statusCode ?? 500,
          body: parsed,
        });
      } catch (error) {
        reject(new Error("Google Books API returned invalid JSON"));
      }
    });
  });

  request.setTimeout(12000, () => {
    request.destroy(new Error("Google Books API request timed out"));
  });

  request.on("error", (error) => {
    reject(error);
  });
});

const normalizeSearchResults = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const volumeInfo = item.volumeInfo ?? {};
      const imageLinks = volumeInfo.imageLinks ?? {};

      return {
        id: item.id ?? "",
        volumeInfo: {
          title: volumeInfo.title ?? "Untitled",
          authors: Array.isArray(volumeInfo.authors) ? volumeInfo.authors : [],
          publishedDate: volumeInfo.publishedDate ?? null,
          description: volumeInfo.description ?? null,
          imageLinks: {
            thumbnail: imageLinks.thumbnail ?? imageLinks.smallThumbnail ?? null,
            smallThumbnail: imageLinks.smallThumbnail ?? imageLinks.thumbnail ?? null,
          },
        },
      };
    })
    .filter((item) => `${item.volumeInfo.title ?? ""}`.trim().length > 0);
};

const searchBooksOnline = async (queryParam) => {
  const query = `${queryParam ?? ""}`.trim();

  if (!query) {
    throw new Error("Search query is required");
  }

  const cacheKey = query.toLowerCase();
  const cached = searchCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < SEARCH_CACHE_TTL_MS) {
    return cached.payload;
  }

  const searchParams = new URLSearchParams({
    q: query,
    maxResults: "10",
    printType: "books",
  });

  if (process.env.GOOGLE_BOOKS_API_KEY) {
    searchParams.set("key", process.env.GOOGLE_BOOKS_API_KEY);
  }

  const { statusCode, body } = await fetchJson(
    `${GOOGLE_BOOKS_BASE_URL}?${searchParams.toString()}`
  );

  if (statusCode === 429) {
    throw new Error("Google Books API rate limit exceeded");
  }

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(body?.error?.message || "Google Books API request failed");
  }

  const payload = {
    totalItems: Number(body?.totalItems ?? 0),
    items: normalizeSearchResults(body?.items),
  };

  searchCache.set(cacheKey, {
    timestamp: now,
    payload,
  });

  return payload;
};

module.exports = {
  searchBooksOnline,
};
