import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { PharmacyOrder } from "../models/pharmacyOrder.model.js";

/**
 * GET PHARMACY ORDER DETAILS
 * GET /api/v1/pharmacy-orders/:orderId
 */
export const getPharmacyOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await PharmacyOrder.findOne({ orderId }).lean();

    if (!order) {
        throw new ApiError(404, `Order with ID ${orderId} not found`);
    }

    // Ensure access control - only user who placed the order or an admin can access
    if (req.user.role !== "admin" && order.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to access this order");
    }

    return res.status(200).json(
        new ApiResponse(200, { order }, "Order details retrieved successfully")
    );
});

/**
 * LIST PHARMACY ORDERS
 * GET /api/v1/pharmacy-orders
 */
export const listPharmacyOrders = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const query = req.user.role === "admin" ? {} : { userId };

    const orders = await PharmacyOrder.find(query).sort({ createdAt: -1 }).lean();

    return res.status(200).json(
        new ApiResponse(200, { orders }, "Orders retrieved successfully")
    );
});

/**
 * UPDATE PHARMACY ORDER STATUS
 * PATCH /api/v1/pharmacy-orders/:orderId/status
 */
export const updatePharmacyOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['pending', 'confirmed', 'out_for_delivery', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, "Invalid order status");
    }

    const order = await PharmacyOrder.findOne({ orderId });
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    order.status = status;
    
    if (status === 'completed') {
        order.paymentStatus = 'paid';
    }

    await order.save();

    return res.status(200).json(
        new ApiResponse(200, { order }, `Order status updated to ${status}`)
    );
});

/**
 * GET PHARMACY ORDERS STATISTICS
 * GET /api/v1/pharmacy-orders/stats
 */
export const getPharmacyOrderStats = asyncHandler(async (req, res) => {
    const matchQuery = req.user.role === "admin" ? {} : { userId: req.user._id };

    const [totalOrders, statusBreakdown, totalSales] = await Promise.all([
        PharmacyOrder.countDocuments(matchQuery),
        PharmacyOrder.aggregate([
            { $match: matchQuery },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]),
        PharmacyOrder.aggregate([
            { $match: { ...matchQuery, paymentStatus: "paid" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ])
    ]);

    const stats = {
        totalOrders,
        sales: totalSales[0]?.total || 0,
        byStatus: statusBreakdown.reduce((acc, current) => {
            acc[current._id] = current.count;
            return acc;
        }, {})
    };

    return res.status(200).json(
        new ApiResponse(200, { stats }, "Pharmacy order statistics fetched")
    );
});
