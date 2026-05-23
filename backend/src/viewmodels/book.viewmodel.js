const https = require("https");

const GOOGLE_BOOKS_BASE_URL = "https://www.googleapis.com/books/v1/volumes";
const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000;
const searchCache = new Map();

const normalizeImageUrl = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  return value.replace(/^http:\/\//i, "https://");
};

const pickBestImageLink = (imageLinks) => {
  if (!imageLinks || typeof imageLinks !== "object") {
    return {
      thumbnail: null,
      smallThumbnail: null,
    };
  }

  const candidates = [
    imageLinks.thumbnail,
    imageLinks.smallThumbnail,
    imageLinks.small,
    imageLinks.medium,
    imageLinks.large,
    imageLinks.extraLarge,
  ].map(normalizeImageUrl).filter(Boolean);

  const preferred = candidates[0] ?? null;
  const fallback = candidates[1] ?? preferred;

  return {
    thumbnail: preferred,
    smallThumbnail: fallback,
  };
};

const extractIsbn = (industryIdentifiers) => {
  if (!Array.isArray(industryIdentifiers)) {
    return null;
  }

  const normalizedIdentifiers = industryIdentifiers.filter(
    (identifier) =>
      identifier &&
      typeof identifier === "object" &&
      typeof identifier.identifier === "string"
  );

  const isbn13 = normalizedIdentifiers.find(
    (identifier) => identifier.type === "ISBN_13"
  );
  if (isbn13?.identifier) {
    return isbn13.identifier;
  }

  const isbn10 = normalizedIdentifiers.find(
    (identifier) => identifier.type === "ISBN_10"
  );
  return isbn10?.identifier ?? null;
};

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
      const normalizedImageLinks = pickBestImageLink(imageLinks);
      const industryIdentifiers = Array.isArray(volumeInfo.industryIdentifiers)
        ? volumeInfo.industryIdentifiers
        : [];

      return {
        id: item.id ?? "",
        volumeInfo: {
          title: volumeInfo.title ?? "Untitled",
          authors: Array.isArray(volumeInfo.authors) ? volumeInfo.authors : [],
          isbn: extractIsbn(industryIdentifiers),
          publishedDate: volumeInfo.publishedDate ?? null,
          description: volumeInfo.description ?? null,
          imageLinks: normalizedImageLinks,
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
