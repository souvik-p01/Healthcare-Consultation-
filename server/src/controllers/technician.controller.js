import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Technician } from '../models/technician.model.js';

export const getTechnicianDashboard = asyncHandler(async (req, res) => {
    let technician = await Technician.findOne({ user: req.user._id }).lean();
    if (!technician) {
        const allowedRoles = ['technician', 'staff', 'admin'];
        if (allowedRoles.includes(req.user.role)) {
            const employeeId = `TECH_${req.user._id.toString().substring(18).toUpperCase()}`;
            const name = `${req.user.firstName || 'Technician'} ${req.user.lastName || ''}`.trim();
            const newTechnician = await Technician.create({
                user: req.user._id,
                name: name || 'Default Technician',
                employeeId,
                role: 'Lab Technician',
                experience: '2 years',
                department: 'Pathology & Diagnostics',
                phone: req.user.phoneNumber || '0000000000',
                shift: 'Morning (8 AM - 4 PM)',
                status: 'active'
            });
            technician = newTechnician.toObject ? newTechnician.toObject() : newTechnician;
        } else {
            throw new ApiError(404, 'Technician profile not found');
        }
    }
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
        { user: req.user._id },
        { $set: req.body },
        { new: true, runValidators: true }
    );
    if (!technician) throw new ApiError(404, 'Technician not found');
    return res.status(200).json(new ApiResponse(200, { technician }, 'Profile updated'));
});

export const getPerformanceMetrics = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, { metrics: {} }, 'Performance metrics fetched'));
});
