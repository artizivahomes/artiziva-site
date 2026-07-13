import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

function mapDecryptedRecord(item: any) {
  if (!item) return item;
  const mapped = { ...item };
  for (const key of Object.keys(item)) {
    if (key.startsWith("decrypted_")) {
      const originalKey = key.replace("decrypted_", "");
      if (item[key] !== null && item[key] !== undefined) {
        mapped[originalKey] = item[key];
      }
    }
  }
  return mapped;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, category, budget, message } = body;

    if (!name || !email || !phone) {
      return NextResponse.json({ error: "Name, email, and phone are required" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Dynamically insert supporting both possible enquiries schemas
    let dbError;
    try {
      const { error } = await supabase.from("enquiries").insert({
        name,
        email,
        phone,
        product_category: category,
        budget_range: budget,
        message,
        status: "new"
      });
      dbError = error;
    } catch (err) {
      dbError = err;
    }

    // Fallback schema if columns match the old schema
    if (dbError && ((dbError as any).message?.includes("column") || (dbError as any).code === "42703")) {
      console.log("Insert failed with column error, trying fallback schema...");
      const { error: fallbackError } = await supabase.from("enquiries").insert({
        name,
        email,
        phone,
        categories: category ? [category] : [],
        style_description: message,
        status: "new"
      });
      dbError = fallbackError;
    }

    if (dbError) {
      console.error("Supabase error:", dbError);
      throw dbError;
    }

    return NextResponse.json({ success: true, message: "Enquiry submitted successfully" });
  } catch (error) {
    console.error("Enquiry submission error:", error);
    return NextResponse.json({ error: "Failed to submit enquiry" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    
    // Try to fetch from the decrypted view first if Column Encryption (TCE) is active
    let { data, error } = await supabase
      .from("decrypted_enquiries")
      .select("*")
      .order("created_at", { ascending: false });

    // Fallback to raw enquiries table if decrypted view doesn't exist
    if (error) {
      console.log("decrypted_enquiries view not found, falling back to enquiries table...", error.message);
      const fallbackResult = await supabase
        .from("enquiries")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (fallbackResult.error) throw fallbackResult.error;
      data = fallbackResult.data;
    }

    const sanitizedData = data ? data.map(mapDecryptedRecord) : [];
    return NextResponse.json(sanitizedData);
  } catch (error) {
    console.error("Fetch enquiries error:", error);
    return NextResponse.json({ error: "Failed to fetch enquiries" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from("enquiries")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(mapDecryptedRecord(data));
  } catch (error) {
    console.error("Update enquiry error:", error);
    return NextResponse.json({ error: "Failed to update enquiry" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const supabase = await createServiceClient();
    const { error } = await supabase
      .from("enquiries")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete enquiry error:", error);
    return NextResponse.json({ error: "Failed to delete enquiry" }, { status: 500 });
  }
}

