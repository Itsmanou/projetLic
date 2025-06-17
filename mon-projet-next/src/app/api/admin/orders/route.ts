import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyToken, isAdmin } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyToken(req);
    if (!auth.success || !auth.user || !isAdmin(auth.user)) {
      return NextResponse.json({ success: false, error: "Admin privileges required" }, { status: 403 });
    }

    const { db } = await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let match: any = {};
    if (status && status !== "all") match.status = status;
    if (search) match["shippingAddress.fullName"] = { $regex: search, $options: "i" };

    // Aggregation to join user info
    const orders = await db.collection("orders").aggregate([
      { $match: match },
      {
        $lookup: {
          from: "users",
          let: { userId: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    "$_id",
                    { $cond: [
                      { $eq: [ { $type: "$$userId" }, "objectId" ] },
                      "$$userId",
                      { $toObjectId: "$$userId" }
                    ]}
                  ]
                }
              }
            },
            { $project: { name: 1, email: 1, _id: 1 } }
          ],
          as: "userInfo"
        }
      },
      { $sort: { createdAt: -1 } }
    ]).toArray();

    // Flatten userInfo array for each order
    const formattedOrders = orders.map(order => ({
      ...order,
      userAccount: order.userInfo && order.userInfo.length > 0 ? order.userInfo[0] : null
    }));

    return NextResponse.json({ success: true, data: formattedOrders });
  } catch (error) {
    console.error("Admin orders fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 });
  }
}