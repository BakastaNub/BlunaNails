import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizePhone(phone: string): string {
  return phone.trim().replace(/[\s\-\+()]/g, "").replace(/^00?/, "").replace(/^34/, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const phone = url.searchParams.get("phone");
    if (!phone) throw new Error("Falta el parámetro phone");

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");

    const today = new Date().toISOString().split("T")[0];
    await supabase.from("bookings").update({ status: "Cancelada" }).eq("status", "Programada").lt("date", today);

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("phone", normalizePhone(phone))
      .eq("status", "Programada")
      .order("date", { ascending: false });

    if (error) throw error;

    const bookings = data.map((booking) => ({
      id: booking.id,
      name: booking.name,
      phone: booking.phone,
      hands: booking.hands ? "Sí" : "No",
      feet: booking.feet ? "Sí" : "No",
      date: booking.date,
      time: booking.time,
      status: booking.status,
    }));

    return new Response(JSON.stringify({ success: true, bookings }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
