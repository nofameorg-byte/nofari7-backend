import cron from "node-cron";
import { searchWeb } from "../services/webSearch.js";
import { saveResearch } from "../services/researchLibrary.js";

const RESEARCH_TOPICS = [
  {
    topic: "anxiety",
    query: "site:nimh.nih.gov anxiety disorders symptoms treatments"
  },
  {
    topic: "depression",
    query: "site:nimh.nih.gov depression symptoms treatments"
  },
  {
    topic: "stress",
    query: "site:cdc.gov stress mental health coping"
  },
  {
    topic: "sleep",
    query: "site:nih.gov sleep mental health research"
  }
];

let nextTopicIndex = 0;

export async function runBackgroundResearch() {
  const item = RESEARCH_TOPICS[nextTopicIndex];
  nextTopicIndex = (nextTopicIndex + 1) % RESEARCH_TOPICS.length;

  console.log("NOFARI background research:", item.topic);

  try {
    const results = await searchWeb(item.query);

    for (const result of results) {
      const url = new URL(result.url);

      if (
        url.hostname !== "nih.gov" &&
        !url.hostname.endsWith(".nih.gov") &&
        url.hostname !== "cdc.gov" &&
        !url.hostname.endsWith(".cdc.gov")
      ) {
        continue;
      }

      await saveResearch({
        topic: item.topic,
        title: result.title,
        summary: result.content,
        source_url: result.url,
        source_name: url.hostname
      });
    }

    console.log("NOFARI research cycle completed");
  } catch (error) {
    console.error("NOFARI research error:", error.message);
  }
}

export function startResearchJobs() {
  cron.schedule("0 */6 * * *", runBackgroundResearch, {
    timezone: "America/New_York"
  });

  console.log("NOFARI research scheduler registered");
}
