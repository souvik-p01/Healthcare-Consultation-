import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Equipment } from '../models/equipment.model.js';

export const getEquipment = asyncHandler(async (req, res) => {
    const { status, type, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const equipment = await Equipment.find(filter).skip(skip).limit(parseInt(limit)).lean();
    const total = await Equipment.countDocuments(filter);

    return res.status(200).json(new ApiResponse(200, { equipment, total }, 'Equipment fetched'));
});

export const getEquipmentById = asyncHandler(async (req, res) => {
    const equipment = await Equipment.findById(req.params.id).lean();
    if (!equipment) throw new ApiError(404, 'Equipment not found');
    return res.status(200).json(new ApiResponse(200, { equipment }, 'Equipment fetched'));
});

export const createEquipment = asyncHandler(async (req, res) => {
    const equipment = await Equipment.create(req.body);
    return res.status(201).json(new ApiResponse(201, { equipment }, 'Equipment created'));
});

export const updateEquipment = asyncHandler(async (req, res) => {
    const equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!equipment) throw new ApiError(404, 'Equipment not found');
    return res.status(200).json(new ApiResponse(200, { equipment }, 'Equipment updated'));
});

export const deleteEquipment = asyncHandler(async (req, res) => {
    const equipment = await Equipment.findByIdAndDelete(req.params.id);
    if (!equipment) throw new ApiError(404, 'Equipment not found');
    return res.status(200).json(new ApiResponse(200, {}, 'Equipment deleted'));
});

export const scheduleMaintenance = asyncHandler(async (req, res) => {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) throw new ApiError(404, 'Equipment not found');
    equipment.status = 'Maintenance';
    await equipment.save();
    return res.status(200).json(new ApiResponse(200, { equipment }, 'Maintenance scheduled'));
});

export const completeMaintenance = asyncHandler(async (req, res) => {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) throw new ApiError(404, 'Equipment not found');
    equipment.status = 'Idle';
    await equipment.save();
    return res.status(200).json(new ApiResponse(200, { equipment }, 'Maintenance completed'));
});

export const createAlert = asyncHandler(async (req, res) => {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) throw new ApiError(404, 'Equipment not found');
    if (!equipment.alerts) equipment.alerts = [];
    equipment.alerts.push({ ...req.body, timestamp: new Date() });
    await equipment.save();
    return res.status(201).json(new ApiResponse(201, { equipment }, 'Alert created'));
});

export const resolveAlert = asyncHandler(async (req, res) => {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) throw new ApiError(404, 'Equipment not found');
    const alert = equipment.alerts?.id(req.params.alertId);
    if (!alert) throw new ApiError(404, 'Alert not found');
    alert.resolved = true;
    alert.resolvedAt = new Date();
    await equipment.save();
    return res.status(200).json(new ApiResponse(200, { alert }, 'Alert resolved'));
});

export const getEquipmentStatistics = asyncHandler(async (req, res) => {
    const total = await Equipment.countDocuments();
    const byStatus = await Equipment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    return res.status(200).json(new ApiResponse(200, { total, byStatus }, 'Statistics fetched'));
});
