import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Fetch products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      slug,
      category,
      price,
      price_on_request,
      short_description,
      description,
      materials,
      dimensions,
      images,
      featured,
      is_sold,
    } = body;

    if (!title || !category) {
      return NextResponse.json({ error: "Title and Category are required" }, { status: 400 });
    }

    const generatedSlug =
      slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from("products")
      .insert({
        title,
        slug: generatedSlug,
        category,
        price: price ? Number(price) : null,
        price_on_request: Boolean(price_on_request),
        short_description: short_description || "",
        description: description || "",
        materials: Array.isArray(materials) ? materials : [],
        dimensions: dimensions || { length: "", width: "", height: "" },
        images: Array.isArray(images) ? images : [],
        featured: Boolean(featured),
        is_sold: Boolean(is_sold),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Create product error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "Product ID is required" }, { status: 400 });

    if (updates.price !== undefined) {
      updates.price = updates.price ? Number(updates.price) : null;
    }

    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Update product error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "Product ID is required" }, { status: 400 });

    const supabase = await createServiceClient();
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete product error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
