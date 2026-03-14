import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Technician } from '../models/technician.model.js';

export const getTechnicianDashboard = asyncHandler(async (req, res) => {
    const technician = await Technician.findOne({ userId: req.user._id }).lean();
    if (!technician) throw new ApiError(404, 'Technician profile not found');
    return res.status(200).json(new ApiResponse(200, { technician }, 'Dashboard fetched'));
});

export const getTechnicianTests = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, { tests: [] }, 'Tests fetched'));
});

export const startTest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    return res.status(200).json(new ApiResponse(200, { testId: id }, 'Test started'));
});

export const completeTest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    return res.status(200).json(new ApiResponse(200, { testId: id }, 'Test completed'));
});

export const getTechnicianEquipment = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, { equipment: [] }, 'Equipment fetched'));
});

export const controlEquipment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { action } = req.body;
    return res.status(200).json(new ApiResponse(200, { equipmentId: id, action }, 'Equipment controlled'));
});

export const updateTechnicianProfile = asyncHandler(async (req, res) => {
    const technician = await Technician.findOneAndUpdate(
        { userId: req.user._id },
        { $set: req.body },
        { new: true, runValidators: true }
    );
    if (!technician) throw new ApiError(404, 'Technician not found');
    return res.status(200).json(new ApiResponse(200, { technician }, 'Profile updated'));
});

export const getPerformanceMetrics = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, { metrics: {} }, 'Performance metrics fetched'));
});
