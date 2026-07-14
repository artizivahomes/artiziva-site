import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { amount } = await request.json();
    if (!amount || isNaN(amount)) {
      return NextResponse.json({ error: "Amount is required and must be a number" }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId.includes("your-razorpay-key-id") || keySecret.includes("your-razorpay-key-secret")) {
      return NextResponse.json({ error: "Razorpay credentials are not configured on the server." }, { status: 500 });
    }

    // Call Razorpay API to create an order
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
        receipt: `receipt_${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Razorpay order creation failed:", errorText);
      return NextResponse.json({ error: "Failed to create payment order with Razorpay" }, { status: response.status });
    }

    const order = await response.json();
    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (error: any) {
    console.error("Checkout server error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
