import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      customer_city,
      customer_pin,
      items,
      subtotal,
    } = body;

    if (!amount || isNaN(amount)) {
      return NextResponse.json({ error: "Amount is required and must be a number" }, { status: 400 });
    }

    if (!customer_name || !customer_email || !customer_phone) {
      return NextResponse.json({ error: "Customer name, email, and phone are required" }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId.includes("your-razorpay-key-id") || keySecret.includes("your-razorpay-key-secret")) {
      return NextResponse.json({ error: "Razorpay credentials are not configured on the server." }, { status: 500 });
    }

    // 1. Save pending order in Supabase
    const supabase = await createServiceClient();
    const { data: dbOrder, error: dbError } = await supabase
      .from("orders")
      .insert({
        customer_name,
        customer_email,
        customer_phone,
        customer_address: customer_address || "",
        customer_city: customer_city || "",
        customer_pin: customer_pin || "",
        items: items || [],
        subtotal: subtotal || amount,
        status: "pending",
        payment_status: "pending",
        order_status: "pending",
        notes: `50% Advance Booking. Total item value: INR ${subtotal || amount}`
      })
      .select()
      .single();

    if (dbError) {
      console.error("Supabase order creation failed:", dbError);
      return NextResponse.json({ error: "Failed to create order record in database" }, { status: 500 });
    }

    // 2. Call Razorpay API to create an order
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // convert to paise
        currency: "INR",
        receipt: `receipt_${dbOrder.id}`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.description || errorData.error?.reason || "Failed to create payment order with Razorpay";
      console.error("Razorpay order creation failed:", errorData);
      
      // Clean up the created order row since checkout failed
      await supabase.from("orders").delete().eq("id", dbOrder.id);
      
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const order = await response.json();
    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      supabaseOrderId: dbOrder.id,
    });
  } catch (error: any) {
    console.error("Checkout server error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
