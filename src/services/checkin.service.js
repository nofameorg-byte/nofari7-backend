import { supabase } from "../lib/supabaseClient.js";

export async function enableDailyCheckIn(userId) {
  const { error } = await supabase
    .from("nofari_checkins")
    .upsert({
      user_id: userId,
      enabled: true,
      preferred_time: "morning",
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Enable check-in error:", error);
    throw error;
  }
}

export async function disableDailyCheckIn(userId) {
  const { error } = await supabase
    .from("nofari_checkins")
    .update({
      enabled: false,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Disable check-in error:", error);
    throw error;
  }
}

export async function getCheckInStatus(userId) {
  const { data, error } = await supabase
    .from("nofari_checkins")
    .select("enabled, preferred_time")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Fetch check-in status error:", error);
    throw error;
  }

  return data || { enabled: false };
}
