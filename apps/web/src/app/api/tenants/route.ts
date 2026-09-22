import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase/admin";

// POST /api/tenants -> alta de un nuevo tenant (nueva academia).
export async function POST(request: Request) {
  const { nombre, subdomain } = (await request.json()) as {
    nombre?: string;
    subdomain?: string;
  };

  if (!nombre || !subdomain) {
    return NextResponse.json(
      { error: "Faltan nombre o subdomain" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("tenants")
    .insert({ nombre, subdomain })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "No se pudo crear el tenant" },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
