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

    // Try to send email notification via Resend if API key is configured
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && apiKey !== "your-resend-api-key-here") {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(apiKey);
        const fromEmail = process.env.RESEND_FROM_EMAIL || "Artiziva Homes <hello@artizivahomes.com>";
        const toEmail = process.env.RESEND_TO_EMAIL || "artiziva.homes@gmail.com";

        await resend.emails.send({
          from: fromEmail,
          to: toEmail,
          subject: `New Enquiry: ${name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #c5a880; font-family: serif; letter-spacing: 0.15em; margin: 0; font-size: 24px;">ARTIZIVA</h2>
                <p style="color: #888; font-size: 10px; letter-spacing: 0.3em; margin: 5px 0 0 0; text-transform: uppercase;">LUXURY BESPOKE HOMES</p>
              </div>
              <hr style="border: 0; border-top: 1px solid #ccc; margin-bottom: 20px;" />
              <h3 style="color: #c5a880; font-family: serif; font-size: 20px; margin-top: 0;">New Bespoke Enquiry</h3>
              <p style="color: #555; font-size: 14px; line-height: 1.5;">A new enquiry has been received for a custom Artiziva masterpiece.</p>
              <div style="background-color: #0b0c10; color: #fff; padding: 20px; border-radius: 4px; margin-top: 20px;">
                <div style="margin-bottom: 15px;">
                  <p style="color: #c5a880; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 5px 0;">Client Name</p>
                  <p style="font-size: 15px; margin: 0; font-weight: bold; color: #fff;">${name}</p>
                </div>
                <div style="margin-bottom: 15px;">
                  <p style="color: #c5a880; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 5px 0;">Email Address</p>
                  <p style="font-size: 15px; margin: 0; color: #fff;"><a href="mailto:${email}" style="color: #c5a880; text-decoration: none;">${email}</a></p>
                </div>
                <div style="margin-bottom: 15px;">
                  <p style="color: #c5a880; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 5px 0;">Phone Number</p>
                  <p style="font-size: 15px; margin: 0; color: #fff;"><a href="tel:${phone}" style="color: #c5a880; text-decoration: none;">+91 ${phone}</a></p>
                </div>
                <div style="margin-bottom: 15px;">
                  <p style="color: #c5a880; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 5px 0;">Product Category</p>
                  <p style="font-size: 15px; margin: 0; color: #fff;">${category || "Bespoke"}</p>
                </div>
                <div style="margin-bottom: 15px;">
                  <p style="color: #c5a880; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 5px 0;">Budget Range</p>
                  <p style="font-size: 15px; margin: 0; color: #fff;">${budget || "N/A"}</p>
                </div>
                <div>
                  <p style="color: #c5a880; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 5px 0;">Message</p>
                  <p style="font-size: 14px; margin: 0; line-height: 1.5; color: #ccc;">${message || "No message provided."}</p>
                </div>
              </div>
            </div>
          `
        });
      } catch (emailErr) {
        console.error("Failed to send email notification:", emailErr);
      }
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

