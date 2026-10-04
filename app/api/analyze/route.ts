import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

type UsedResult = {
  title: string;
  link: string | null;
  snippet: string;
  thumbnail: string | null;
  source: string | null;
  price: string | null;
  extractedPrice: number | null;
  condition: string | null;
};

type MarketResult = {
  title: string;
  price: string | null;
  extractedPrice: number | null;
  oldPrice: string | null;
  extractedOldPrice: number | null;
  source: string | null;
  link: string | null;
  thumbnail: string | null;
  tag: string | null;
  extensions: string[];
  discountPercent: number | null;
};

type AIAnalysis = {
  fairPriceLow: number;
  fairPriceHigh: number;
  suggestedOpeningOffer: number;
  maximumReasonablePrice: number;
  confidence: string;
  marketVerdict: string;
  reasoning: string;
  negotiationStrategy: string;
  negotiationMessage: string;
};

const STOP_WORDS = new Set([
  "the", "a", "an", "for", "with", "and", "or", "in", "on", "of",
  "new", "used", "second", "hand", "india", "price", "buy", "best",
]);

function formatPrice(value: number | null) {
  if (!value || !Number.isFinite(value)) return null;
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function itemTokens(item: string) {
  return normalizeText(item)
    .split(/\s+/)
    .filter((x) => x.length > 1 && !STOP_WORDS.has(x));
}

function isRelevantProduct(item: string, title: string, snippet: string) {
  const queryTokens = itemTokens(item);
  const text = normalizeText(`${title} ${snippet}`);

  if (!queryTokens.length) return true;

  const matches = queryTokens.filter((token) => text.includes(token));
  const ratio = matches.length / queryTokens.length;

  // For model-specific searches such as "iPhone 13", require the product family
  // and model token instead of accepting any page that merely contains "13".
  const first = queryTokens[0];
  const hasProductFamily = text.includes(first);

  if (!hasProductFamily) return false;
  if (queryTokens.length === 1) return ratio >= 1;
  return ratio >= 0.67;
}

function looksLikeUsed(title: string, snippet: string, source: string | null) {
  const text = normalizeText(`${title} ${snippet} ${source || ""}`);
  return /used|second hand|secondhand|pre owned|preowned|refurbished|renewed|open box|like new|excellent condition|olx|quikr|cashify|budli|2gud|facebook marketplace/.test(text);
}

function looksLikeNewRetail(title: string, snippet: string, source: string | null) {
  const text = normalizeText(`${title} ${snippet} ${source || ""}`);
  return /flipkart|amazon|croma|reliance digital|vijay sales|tata neu|official store|buy now|brand new/.test(text);
}

function extractPrice(text: string): number | null {
  if (!text) return null;

  // Prefer explicitly currency-marked values.
  const currencyMatches = text.match(/(?:₹|Rs\.?|INR)\s*[\d,]+(?:\.\d+)?/gi);
  if (currencyMatches) {
    for (const match of currencyMatches) {
      const value = Number(match.replace(/[^\d.]/g, ""));
      if (Number.isFinite(value) && value >= 1000 && value <= 10000000) {
        return Math.round(value);
      }
    }
  }

  // Only accept bare numbers when they are clearly introduced as a price.
  const priceContext = text.match(
    /(?:price|asking|cost|deal|offer|sale|at|for)\s*(?:is|:|-)?\s*₹?\s*([\d,]{4,9})/i
  );

  if (priceContext) {
    const value = Number(priceContext[1].replace(/,/g, ""));
    if (Number.isFinite(value) && value >= 1000 && value <= 10000000) {
      return Math.round(value);
    }
  }

  return null;
}

function calculateDiscount(current: number | null, old: number | null) {
  if (!current || !old || old <= current) return null;
  return Math.round(((old - current) / old) * 100);
}

function getUsedScore(
  item: string,
  title: string,
  snippet: string,
  source: string | null,
  condition: string | null,
  price: number | null
) {
  const text = normalizeText(`${title} ${snippet} ${source || ""}`);
  let score = 0;

  if (!isRelevantProduct(item, title, snippet)) return -1000;

  if (/olx/.test(text)) score += 35;
  if (/quikr/.test(text)) score += 30;
  if (/cashify/.test(text)) score += 28;
  if (/budli/.test(text)) score += 24;
  if (/2gud/.test(text)) score += 22;
  if (/facebook marketplace/.test(text)) score += 18;
  if (looksLikeUsed(title, snippet, source)) score += 25;

  if (condition?.toLowerCase() === "used" && !looksLikeUsed(title, snippet, source)) {
    score -= 40;
  }

  if (condition?.toLowerCase() === "refurbished" &&
      !/refurbished|renewed|certified/.test(text)) score -= 40;

  if (condition?.toLowerCase() === "open box" &&
      !/open box|open-box/.test(text)) score -= 40;

  if (condition?.toLowerCase() === "like new" &&
      !/like new|excellent condition|mint condition/.test(text)) score -= 30;

  if (looksLikeNewRetail(title, snippet, source) && !looksLikeUsed(title, snippet, source)) {
    score -= 100;
  }

  if (price) score += 10;
  return score;
}

function makeSerpUrl(
  engine: string,
  query: string,
  location: string,
  apiKey: string,
  extra: Record<string, string> = {}
) {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", engine);
  url.searchParams.set("q", query);
  url.searchParams.set("location", location);
  url.searchParams.set("hl", "en");
  url.searchParams.set("gl", "in");
  url.searchParams.set("num", "10");
  url.searchParams.set("api_key", apiKey);

  for (const [key, value] of Object.entries(extra)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function getAIAnalysis(args: {
  item: string;
  askingPrice: number;
  location: string;
  details: string | null;
  condition: string | null;
  usedMarket: UsedResult[];
  newMarket: MarketResult[];
  averageUsed: number | null;
  averageNew: number | null;
  fairLow: number | null;
  fairHigh: number | null;
  maxReasonable: number | null;
  suggestedOffer: number | null;
}): Promise<AIAnalysis | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  const evidence = {
    usedListings: args.usedMarket.slice(0, 8),
    newListings: args.newMarket.slice(0, 8),
    averages: {
      used: args.averageUsed,
      new: args.averageNew,
    },
  };

  const prompt = `
You are the pricing intelligence engine for PricePilot.

Use ONLY the supplied market evidence. Never invent a price or treat an unrelated listing as evidence.

Product: ${args.item}
Asking price: ₹${args.askingPrice}
Location: ${args.location}
Condition: ${args.condition || "Not specified"}
Details: ${args.details || "None"}

Important:
- Used analysis must use relevant used/second-hand evidence only.
- New analysis must use relevant new retail evidence only.
- Do not mix unrelated products, accessories, cameras, numbers, or generic pages into the price analysis.
- If evidence is weak, say so.
- Keep the negotiation practical.

Calculated evidence:
Average used: ${args.averageUsed ? `₹${args.averageUsed}` : "Not available"}
Average new: ${args.averageNew ? `₹${args.averageNew}` : "Not available"}
Initial fair range: ${
    args.fairLow && args.fairHigh
      ? `₹${args.fairLow} - ₹${args.fairHigh}`
      : "Not available"
  }

LIVE EVIDENCE:
${JSON.stringify(evidence, null, 2)}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            fairPriceLow: { type: "integer" },
            fairPriceHigh: { type: "integer" },
            suggestedOpeningOffer: { type: "integer" },
            maximumReasonablePrice: { type: "integer" },
            confidence: { type: "string" },
            marketVerdict: { type: "string" },
            reasoning: { type: "string" },
            negotiationStrategy: { type: "string" },
            negotiationMessage: { type: "string" },
          },
          required: [
            "fairPriceLow",
            "fairPriceHigh",
            "suggestedOpeningOffer",
            "maximumReasonablePrice",
            "confidence",
            "marketVerdict",
            "reasoning",
            "negotiationStrategy",
            "negotiationMessage",
          ],
        },
      },
    });

    if (!response.text) return null;
    return JSON.parse(response.text) as AIAnalysis;
  } catch (error) {
    console.error("AI analysis error:", error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const item = String(body?.item || "").trim();
    const askingPrice = Number(body?.price);
    const location = String(body?.location || "").trim();
    const details = body?.details ? String(body.details).trim() : null;
    const condition = body?.condition ? String(body.condition).trim() : null;

    if (!item) {
      return NextResponse.json({ success: false, error: "Item is required." }, { status: 400 });
    }

    if (!Number.isFinite(askingPrice) || askingPrice <= 0) {
      return NextResponse.json({ success: false, error: "A valid asking price is required." }, { status: 400 });
    }

    if (!location) {
      return NextResponse.json({ success: false, error: "Location is required." }, { status: 400 });
    }

    const serpApiKey = process.env.SERPAPI_KEY;
    if (!serpApiKey) {
      return NextResponse.json({ success: false, error: "SERPAPI_KEY is missing." }, { status: 500 });
    }

    const requestedCondition = condition?.toLowerCase() || "used";

    const usedQueries = [
      `"${item}" used second hand ${location}`,
      `"${item}" used ${location} OLX`,
      `"${item}" used ${location} Quikr`,
      `"${item}" used ${location} Cashify`,
    ];

    if (requestedCondition === "refurbished") {
      usedQueries.unshift(`"${item}" refurbished renewed ${location}`);
    } else if (requestedCondition === "open box") {
      usedQueries.unshift(`"${item}" open box ${location}`);
    } else if (requestedCondition === "like new") {
      usedQueries.unshift(`"${item}" like new excellent condition ${location}`);
    }

    const shoppingQuery =
      requestedCondition === "new"
        ? `"${item}" new price India`
        : `"${item}" new price India`;

    const usedUrls = usedQueries.slice(0, 4).map((query) =>
      makeSerpUrl("google", query, location, serpApiKey)
    );

    const shoppingUrl = makeSerpUrl(
      "google_shopping",
      shoppingQuery,
      location,
      serpApiKey
    );

    const responses = await Promise.all([
      ...usedUrls.map((url) => fetch(url, { cache: "no-store" })),
      fetch(shoppingUrl, { cache: "no-store" }),
    ]);

    const usedResponses = responses.slice(0, usedUrls.length);
    const shoppingResponse = responses[usedUrls.length];

    const usedPayloads = await Promise.all(usedResponses.map(safeJson));
    const shoppingData = await safeJson(shoppingResponse);

    if (!shoppingResponse.ok || shoppingData.error) {
      return NextResponse.json(
        {
          success: false,
          error: shoppingData.error || "Shopping search failed.",
        },
        { status: 500 }
      );
    }

    const organicResults = usedPayloads.flatMap(
      (payload: any) => payload?.organic_results || []
    );

    const seen = new Set<string>();

    const candidates = organicResults
      .map((result: any) => {
        const title = String(result?.title || "");
        const snippet = String(result?.snippet || "");
        const source = result?.source ? String(result.source) : null;
        const link = result?.link ? String(result.link) : null;

        const structuredPrice =
          typeof result?.extracted_price === "number"
            ? result.extracted_price
            : null;

        const extractedPrice =
          structuredPrice || extractPrice(`${title} ${snippet}`);

        return {
          title,
          snippet,
          source,
          link,
          thumbnail: result?.thumbnail || result?.image || null,
          extractedPrice,
          score: getUsedScore(
            item,
            title,
            snippet,
            source,
            condition,
            extractedPrice
          ),
        };
      })
      .filter((result: any) => {
        if (!result.link || seen.has(result.link)) return false;
        seen.add(result.link);

        // Hard filter: irrelevant products/pages never enter the used average.
        if (result.score < 0) return false;

        if (
          requestedCondition === "used" &&
          looksLikeNewRetail(result.title, result.snippet, result.source) &&
          !looksLikeUsed(result.title, result.snippet, result.source)
        ) {
          return false;
        }

        return true;
      })
      .sort((a: any, b: any) => {
        if (b.score !== a.score) return b.score - a.score;
        if (Boolean(b.extractedPrice) !== Boolean(a.extractedPrice)) {
          return b.extractedPrice ? 1 : -1;
        }
        return 0;
      });

    const shoppingResults = Array.isArray(shoppingData?.shopping_results)
      ? shoppingData.shopping_results
      : [];

    const newResults: MarketResult[] = shoppingResults
      .map((result: any) => {
        const title = String(result?.title || "Product");
        const source = result?.source ? String(result.source) : null;

        const currentPrice =
          typeof result?.extracted_price === "number"
            ? result.extracted_price
            : extractPrice(String(result?.price || ""));

        const oldPrice =
          typeof result?.extracted_old_price === "number"
            ? result.extracted_old_price
            : extractPrice(String(result?.old_price || ""));

        return {
          title,
          price: result?.price || formatPrice(currentPrice),
          extractedPrice: currentPrice,
          oldPrice: result?.old_price || formatPrice(oldPrice),
          extractedOldPrice: oldPrice,
          source,
          link: result?.product_link || result?.link || null,
          thumbnail: result?.thumbnail || null,
          tag: result?.tag || null,
          extensions: Array.isArray(result?.extensions) ? result.extensions : [],
          discountPercent: calculateDiscount(currentPrice, oldPrice),
        };
      })
      .filter((result: MarketResult) => isRelevantProduct(item, result.title, ""));

    const usedResults: UsedResult[] = candidates.slice(0, 10).map((result: any) => ({
      title: result.title,
      link: result.link,
      snippet: result.snippet,
      thumbnail: result.thumbnail,
      source: result.source,
      price: formatPrice(result.extractedPrice),
      extractedPrice: result.extractedPrice,
      condition,
    }));

    const usedPrices = usedResults
      .map((result) => result.extractedPrice)
      .filter((value): value is number => typeof value === "number" && value > 0);

    const newPrices = newResults
      .map((result) => result.extractedPrice)
      .filter((value): value is number => typeof value === "number" && value > 0);

    const averageUsed = usedPrices.length
      ? Math.round(usedPrices.reduce((sum, value) => sum + value, 0) / usedPrices.length)
      : null;

    const averageNew = newPrices.length
      ? Math.round(newPrices.reduce((sum, value) => sum + value, 0) / newPrices.length)
      : null;

    // For a Used request, do not silently fall back to a new-market average.
    // If there is no reliable used evidence, show insufficient data instead.
    let referencePrice: number | null = null;

    if (requestedCondition === "new") {
      referencePrice = averageNew;
    } else {
      referencePrice = averageUsed;
    }

    const fairLow = referencePrice ? Math.round(referencePrice * 0.9) : null;
    const fairHigh = referencePrice ? Math.round(referencePrice * 1.05) : null;
    const maxReasonable = fairHigh;
    const suggestedOffer = referencePrice
      ? Math.round(referencePrice * 0.95)
      : null;

    const differenceFromAverage = referencePrice
      ? askingPrice - referencePrice
      : null;

    const differencePercent = referencePrice
      ? Math.round(((askingPrice - referencePrice) / referencePrice) * 100)
      : null;

    let marketStatus = "Insufficient Data";

    if (referencePrice && fairLow && fairHigh) {
      if (askingPrice > fairHigh) marketStatus = "Above Market";
      else if (askingPrice < fairLow) marketStatus = "Below Market";
      else marketStatus = "Within Market Range";
    }

    const deals = newResults.filter(
      (result) =>
        result.discountPercent !== null ||
        Boolean(result.oldPrice) ||
        Boolean(result.tag) ||
        result.extensions.some((extension) =>
          /sale|off|deal|discount|coupon/i.test(extension)
        )
    );

    const aiAnalysis = await getAIAnalysis({
      item,
      askingPrice,
      location,
      details,
      condition,
      usedMarket: usedResults,
      newMarket: newResults,
      averageUsed,
      averageNew,
      fairLow,
      fairHigh,
      maxReasonable,
      suggestedOffer,
    });

    return NextResponse.json({
      success: true,
      deal: {
        item,
        askingPrice,
        location,
        condition,
        details,
      },
      usedMarket: {
        query: usedQueries[0],
        results: usedResults,
        averagePrice: averageUsed,
      },
      newMarket: {
        query: shoppingQuery,
        results: newResults,
        averagePrice: averageNew,
      },
      priceAnalysis: {
        askingPrice,
        averageMarketPrice: referencePrice,
        fairPriceLow: fairLow,
        fairPriceHigh: fairHigh,
        maxReasonablePrice: maxReasonable,
        differenceFromAverage,
        differencePercent,
        suggestedOffer,
        marketStatus,
      },
      aiAnalysis,
      deals,
      marketData: {
        usedListingsFound: usedResults.length,
        usedPricesFound: usedPrices.length,
        newProductsFound: newResults.length,
        newPricesFound: newPrices.length,
        discountDealsFound: deals.length,
        aiPowered: Boolean(aiAnalysis),
      },
    });
  } catch (error: any) {
    console.error("PRICEPILOT API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Market research failed.",
      },
      { status: 500 }
    );
  }
}