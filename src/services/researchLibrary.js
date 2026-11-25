import { supabase } from "../lib/supabaseClient.js";

export async function saveResearch({
  topic,
  title,
  summary,
  source_url,
  source_name = null,
  published_at = null
}) {
  if (!topic || !title || !summary || !source_url) {
    throw new Error("Research entry missing required fields");
  }

  if (!/^https:\/\//i.test(source_url)) {
    throw new Error("Research source must use HTTPS");
  }

  const { data, error } = await supabase
    .from("nofari_research")
    .upsert(
      {
        topic,
        title,
        summary,
        source_url,
        source_name,
        published_at,
        verification_status: "pending"
      },
      { onConflict: "topic,source_url" }
    )
    .select("id, topic, title, verification_status")
    .single();

  if (error) throw error;

  return data;
}

export async function getVerifiedResearch(topic, limit = 5) {
  const { data, error } = await supabase
    .from("nofari_research")
    .select("title, summary, source_url, source_name, published_at")
    .eq("verification_status", "verified")
    .eq("topic", topic)
    .order("researched_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 10));

  if (error) throw error;

  return data || [];
}
