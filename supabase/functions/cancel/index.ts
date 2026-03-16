import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method !== "POST") throw new Error("Método no permitido");

    const body = await req.json();
    const { id } = body;

    if (!id) throw new Error("Falta el ID de la cita");

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");

    const { error, count } = await supabase
      .from("bookings")
      .update({ status: "Cancelada" })
      .eq("id", id)
      .eq("status", "Programada")
      .select("id", { count: "exact", head: true });

    if (error) throw error;
    if (count === 0) throw new Error("Cita no encontrada o ya cancelada");

    return new Response(JSON.stringify({ success: true, message: "Cita cancelada correctamente" }), {
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
