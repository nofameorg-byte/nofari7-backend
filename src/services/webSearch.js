
const TAVILY_URL = "https://api.tavily.com/search";
const MAX_SEARCHES_PER_HOUR = 30;
const SEARCH_WINDOW_MS = 60 * 60 * 1000;

let searchCount = 0;
let windowStarted = Date.now();

function canSearch() {
  const now = Date.now();

  if (now - windowStarted >= SEARCH_WINDOW_MS) {
    searchCount = 0;
    windowStarted = now;
  }

  if (searchCount >= MAX_SEARCHES_PER_HOUR) {
    return false;
  }

  searchCount++;
  return true;
}
export async function searchWeb(query, options = {}) {
  if (!process.env.TAVILY_API_KEY) {
    console.warn("Tavily API key not configured");
    return [];
  }

  if (typeof query !== "string" || !query.trim()) {
    return [];
  }
if (!canSearch()) {
  console.warn("Tavily hourly search limit reached");
  return [];
}
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(TAVILY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: query.trim().slice(0, 300),
        
search_depth: "basic",
max_results: 4,
...(options.news === true
  ? { topic: "news", time_range: "week" }
  : {}),

        include_answer: false,
        include_raw_content: false,
        include_images: false
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      console.warn("Tavily search failed:", response.status);
      return [];
    }

    const data = await response.json();

    return (data.results || [])
      .filter((result) =>
        result.title &&
        result.url &&
        result.content &&
        /^https:\/\//i.test(result.url)
      )
      .slice(0, 4)
      .map((result) => ({
        title: String(result.title).slice(0, 150),
        url: result.url,
        content: String(result.content).slice(0, 900)
      }));
  } catch (error) {
    console.warn("Web search unavailable:", error.message);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
