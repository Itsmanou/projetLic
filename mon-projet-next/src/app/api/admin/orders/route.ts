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

console.log('🔍 Admin fetching orders with match:', match);

// 🔧 FIXED: Better aggregation to handle both ObjectId and string userIds
const orders = await db.collection("orders").aggregate([
  { $match: match },
  {
    $addFields: {
      // Convert userId to ObjectId if it's a string, handle invalid cases
      userIdAsObjectId: {
        $cond: {
          if: { $eq: [{ $type: "$userId" }, "string"] },
          then: {
            $cond: {
              if: { $regexMatch: { input: "$userId", regex: /^[0-9a-fA-F]{24}$/ } },
              then: { $toObjectId: "$userId" },
              else: null
            }
          },
          else: "$userId"
        }
      }
    }
  },
  {
    $lookup: {
      from: "users",
      localField: "userIdAsObjectId",
      foreignField: "_id",
      as: "userDetails"
    }
  },
  {
    $addFields: {
      // Create userInfo field with proper fallback
      userInfo: {
        $cond: {
          if: { $gt: [{ $size: "$userDetails" }, 0] },
          then: [{
            _id: { $arrayElemAt: ["$userDetails._id", 0] },
            name: { $arrayElemAt: ["$userDetails.name", 0] },
            email: { $arrayElemAt: ["$userDetails.email", 0] }
          }],
          else: [{
            _id: null,
            name: "Utilisateur non trouvé",
            email: ""
          }]
        }
      },
      // Add computed fields for prescription info
      hasPrescription: {
        $or: [
          { $ne: ["$prescription.prescriptionFile", null] },
          { $ne: ["$prescription.clinicName", ""] },
          { $gt: [{ $size: { $ifNull: ["$prescriptionImages", []] } }, 0] }
        ]
      },
      prescriptionStatus: {
        $cond: {
          if: { $ne: ["$prescription.prescriptionFile", null] },
          then: "uploaded",
          else: {
            $cond: {
              if: { $ne: ["$prescription.clinicName", ""] },
              then: "clinic_provided",
              else: "none"
            }
          }
        }
      }
    }
  },
  { $project: { userDetails: 0, userIdAsObjectId: 0 } }, // Remove temporary fields
  { $sort: { createdAt: -1 } }
]).toArray();

console.log('📋 Admin orders fetched:', orders.length);
if (orders.length > 0) {
  console.log('📋 First order userInfo:', orders[0].userInfo);
}

// Flatten userInfo array for each order and format prescription data
const formattedOrders = orders.map(order => {
  // Handle prescription data (support both old and new format)
  const prescriptionInfo = {
    hasFile: !!(order.prescription?.prescriptionFile || (order.prescriptionImages && order.prescriptionImages.length > 0)),
    filePath: order.prescription?.prescriptionFile || (order.prescriptionImages && order.prescriptionImages[0]) || null,
    clinicName: order.prescription?.clinicName || '',
    uploadedAt: order.prescription?.uploadedAt || null,
    originalFileName: order.prescription?.originalFileName || null,
    fileSize: order.prescription?.fileSize || null,
    fileType: order.prescription?.fileType || null,
    status: order.prescriptionStatus || 'none'
  };

  return {
    ...order,
    userAccount: order.userInfo && order.userInfo.length > 0 ? order.userInfo[0] : null,
    prescriptionInfo,
    // Keep original fields for backward compatibility
    hasPrescription: order.hasPrescription || false
  };
});

return NextResponse.json({ success: true, data: formattedOrders });
} catch (error) {
console.error("💥 Admin orders fetch error:", error);
return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 });
}
}

// GET single order details for admin
export async function POST(req: NextRequest) {
try {
const auth = await verifyToken(req);
if (!auth.success || !auth.user || !isAdmin(auth.user)) {
  return NextResponse.json({ success: false, error: "Admin privileges required" }, { status: 403 });
}

const { orderId } = await req.json();

if (!orderId) {
  return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 });
}

const { db } = await connectToDatabase();

console.log('🔍 Admin fetching single order:', orderId);

// 🔧 FIXED: Use the same pattern as the GET method
const order = await db.collection("orders").aggregate([
  { $match: { _id: new ObjectId(orderId) } },
  {
    $addFields: {
      // Convert userId to ObjectId if it's a string, handle invalid cases
      userIdAsObjectId: {
        $cond: {
          if: { $eq: [{ $type: "$userId" }, "string"] },
          then: {
            $cond: {
              if: { $regexMatch: { input: "$userId", regex: /^[0-9a-fA-F]{24}$/ } },
              then: { $toObjectId: "$userId" },
              else: null
            }
          },
          else: "$userId"
        }
      }
    }
  },
  {
    $lookup: {
      from: "users",
      localField: "userIdAsObjectId",
      foreignField: "_id",
      as: "userDetails"
    }
  },
  {
    $addFields: {
      // Create userInfo field with proper fallback
      userInfo: {
        $cond: {
          if: { $gt: [{ $size: "$userDetails" }, 0] },
          then: [{
            _id: { $arrayElemAt: ["$userDetails._id", 0] },
            name: { $arrayElemAt: ["$userDetails.name", 0] },
            email: { $arrayElemAt: ["$userDetails.email", 0] },
            phone: { $arrayElemAt: ["$userDetails.phone", 0] }
          }],
          else: [{
            _id: null,
            name: "Utilisateur non trouvé",
            email: "",
            phone: ""
          }]
        }
      }
    }
  },
  { $project: { userDetails: 0, userIdAsObjectId: 0 } } // Remove temporary fields
]).toArray();

if (!order || order.length === 0) {
  return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
}

const orderData = order[0];

console.log('📋 Single order userInfo:', orderData.userInfo);

// Format prescription information
const prescriptionInfo = {
  hasFile: !!(orderData.prescription?.prescriptionFile || (orderData.prescriptionImages && orderData.prescriptionImages.length > 0)),
  filePath: orderData.prescription?.prescriptionFile || (orderData.prescriptionImages && orderData.prescriptionImages[0]) || null,
  clinicName: orderData.prescription?.clinicName || '',
  uploadedAt: orderData.prescription?.uploadedAt || null,
  originalFileName: orderData.prescription?.originalFileName || null,
  fileSize: orderData.prescription?.fileSize || null,
  fileType: orderData.prescription?.fileType || null
};

const formattedOrder = {
  ...orderData,
  userAccount: orderData.userInfo && orderData.userInfo.length > 0 ? orderData.userInfo[0] : null,
  prescriptionInfo
};

return NextResponse.json({ success: true, data: formattedOrder });
} catch (error) {
console.error("💥 Admin order detail fetch error:", error);
return NextResponse.json({ success: false, error: "Failed to fetch order details" }, { status: 500 });
}
}