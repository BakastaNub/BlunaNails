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
    if (req.method !== "POST") throw new Error("Método no permitido");

    const body = await req.json();
    const { name, phone, hands, feet, date, time } = body;

    if (!name || !phone || !date || !time || (!hands && !feet)) {
      throw new Error("Faltan datos obligatorios");
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");

    // Validar que la hora sea hora en punto (entre 9 y 15)
    const hour = parseInt(time.split(":")[0], 10);
    if (hour < 9 || hour > 15) {
      throw new Error("El horario debe ser entre 9:00 y 15:00");
    }

    const normalizedTime = `${hour.toString().padStart(2, "0")}:00`;

    // Verificar horario ocupado
    const { count: occupiedCount } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("date", date)
      .eq("time", normalizedTime)
      .eq("status", "Programada");

    if (occupiedCount > 0) throw new Error("Ese horario ya está reservado");

    const { count: dayCount } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("date", date)
      .eq("status", "Programada");

    if (dayCount >= 5) throw new Error("El día está completo (máx. 5 citas)");

    const { count: existingCount } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("phone", normalizePhone(phone))
      .eq("status", "Programada");

    if (existingCount > 0) throw new Error("Ya tienes una cita activa. Cancela primero si deseas otra.");

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        phone: normalizePhone(phone),
        name: name.trim(),
        hands: !!hands,
        feet: !!feet,
        date,
        time: normalizedTime,
        status: "Programada",
      })
      .select("id")
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, id: data.id }), {
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
