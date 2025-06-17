import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyToken, isAdmin } from "@/lib/auth";

// PUT /api/admin/orders/[id]/status
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyToken(req);
    if (!auth.success || !auth.user || !isAdmin(auth.user)) {
      return NextResponse.json({ success: false, error: "Admin privileges required" }, { status: 403 });
    }

    const orderId = params.id;
    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json({ success: false, error: "Invalid order ID" }, { status: 400 });
    }

    const { status } = await req.json();
    const validStatuses = ["confirmed", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status value" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const order = await db.collection("orders").findOne({ _id: new ObjectId(orderId) });
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Only update status if not already delivered or cancelled
    if (["delivered", "cancelled"].includes(order.status)) {
      return NextResponse.json({ success: false, error: "Cannot update order in final state" }, { status: 400 });
    }

    await db.collection("orders").updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { status, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true, message: "Order status updated" });
  } catch (error) {
    console.error("Admin order status update error:", error);
    return NextResponse.json({ success: false, error: "Failed to update order" }, { status: 500 });
  }
}