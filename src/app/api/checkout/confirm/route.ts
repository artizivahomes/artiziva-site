import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supabaseOrderId, razorpayPaymentId } = body;

    if (!supabaseOrderId || !razorpayPaymentId) {
      return NextResponse.json({ error: "Supabase Order ID and Razorpay Payment ID are required" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // 1. Fetch the order details
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", supabaseOrderId)
      .single();

    if (fetchError || !order) {
      console.error("Order fetch failed during confirmation:", fetchError);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 2. Update order status in database
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "pending", // Keep status as pending/processing for completion
        payment_status: "paid",
        order_status: "pending",
        payment_id: razorpayPaymentId,
        notes: `50% Advance paid via Razorpay. Payment ID: ${razorpayPaymentId}`
      })
      .eq("id", supabaseOrderId)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update order confirmation:", updateError);
      return NextResponse.json({ error: "Failed to confirm payment in database" }, { status: 500 });
    }

    // 3. Send email confirmation to Admin via Resend
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
          subject: `New Confirmed Order: ${order.customer_name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #c5a880; font-family: serif; letter-spacing: 0.15em; margin: 0; font-size: 24px;">ARTIZIVA</h2>
                <p style="color: #888; font-size: 10px; letter-spacing: 0.3em; margin: 5px 0 0 0; text-transform: uppercase;">LUXURY BESPOKE HOMES</p>
              </div>
              <hr style="border: 0; border-top: 1px solid #ccc; margin-bottom: 20px;" />
              <h3 style="color: #c5a880; font-family: serif; font-size: 20px; margin-top: 0;">New Confirmed Order (Deposit Paid)</h3>
              <p style="color: #555; font-size: 14px; line-height: 1.5;">An advance booking payment has been successfully completed via Razorpay.</p>
              
              <div style="background-color: #0b0c10; color: #fff; padding: 20px; border-radius: 4px; margin-top: 20px;">
                <div style="margin-bottom: 15px;">
                  <p style="color: #c5a880; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 5px 0;">Customer Name</p>
                  <p style="font-size: 15px; margin: 0; font-weight: bold; color: #fff;">${order.customer_name}</p>
                </div>
                <div style="margin-bottom: 15px;">
                  <p style="color: #c5a880; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 5px 0;">Email / Phone</p>
                  <p style="font-size: 15px; margin: 0; color: #fff;">
                    <a href="mailto:${order.customer_email}" style="color: #c5a880; text-decoration: none;">${order.customer_email}</a> · 
                    <a href="tel:${order.customer_phone}" style="color: #c5a880; text-decoration: none;">+91 ${order.customer_phone}</a>
                  </p>
                </div>
                <div style="margin-bottom: 15px;">
                  <p style="color: #c5a880; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 5px 0;">Shipping Details</p>
                  <p style="font-size: 14px; margin: 0; color: #fff;">${order.customer_address}, ${order.customer_city} - ${order.customer_pin}</p>
                </div>
                <div style="margin-bottom: 15px;">
                  <p style="color: #c5a880; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 5px 0;">Payment Details</p>
                  <p style="font-size: 14px; margin: 0; color: #fff;">
                    Deposit Paid: ₹${(Math.min(order.subtotal * 0.5, 51000)).toLocaleString()}<br/>
                    Razorpay Payment ID: <strong>${razorpayPaymentId}</strong>
                  </p>
                </div>
              </div>
            </div>
          `
        });
      } catch (emailErr) {
        console.error("Failed to send order email notification:", emailErr);
      }
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error("Payment confirmation server error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
