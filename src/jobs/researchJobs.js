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
  },
  {
    topic: "heart_health",
    query: "site:nhlbi.nih.gov heart disease symptoms prevention"
  },
  {
    topic: "diabetes",
    query: "site:niddk.nih.gov diabetes symptoms management"
  },
  {
    topic: "high_blood_pressure",
    query: "site:nhlbi.nih.gov high blood pressure symptoms prevention"
  },
  {
    topic: "digestive_health",
    query: "site:niddk.nih.gov digestive diseases symptoms"
  },
  {
    topic: "respiratory_health",
    query: "site:nhlbi.nih.gov lung diseases symptoms"
  },
  {
    topic: "kidney_health",
    query: "site:niddk.nih.gov kidney diseases symptoms"
  },
  {
    topic: "medications",
    query: "site:medlineplus.gov medicines side effects safety"
  },
  {
    topic: "medical_tests",
    query: "site:medlineplus.gov/lab-tests medical tests results"
  },
  {
    topic: "general_diseases",
    query: "site:medlineplus.gov diseases conditions symptoms"
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
        !url.hostname.endsWith(".cdc.gov") &&
        url.hostname !== "medlineplus.gov" &&
        !url.hostname.endsWith(".medlineplus.gov")
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
