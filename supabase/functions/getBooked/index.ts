import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data, error } = await supabase
      .from("bookings")
      .select("date, time")
      .eq("status", "Programada");

    if (error) {
      console.error("Query error:", error);
      throw error;
    }

    // Estructura: { "2026-03-16": { "09:00": true, "10:00": true }, "2026-03-17": {...} }
    const bookedHours: Record<string, Record<string, boolean>> = {};
    
    data.forEach((row) => {
      const date = row.date;
      const time = row.time ? row.time.substring(0, 5) : "00:00"; // "14:00:00" -> "14:00"
      
      if (!bookedHours[date]) {
        bookedHours[date] = {};
      }
      bookedHours[date][time] = true;
    });

    return new Response(JSON.stringify(bookedHours), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
