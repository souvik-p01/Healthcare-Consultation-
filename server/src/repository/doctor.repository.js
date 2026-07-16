import { Doctor } from "../models/Doctor.js";

class DoctorRepository {
    async find(filter = {}, sort = { rating: -1 }, skip = 0, limit = 10) {
        return await Doctor.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit);
    }

    async findById(id) {
        return await Doctor.findById(id);
    }

    async findOne(filter = {}) {
        return await Doctor.findOne(filter);
    }

    async create(data) {
        return await Doctor.create(data);
    }

    async update(id, data) {
        return await Doctor.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }

    async delete(id) {
        return await Doctor.findByIdAndDelete(id);
    }

    async count(filter = {}) {
        return await Doctor.countDocuments(filter);
    }

    async getSpecialtyCounts() {
        return await Doctor.aggregate([
            {
                $group: {
                    _id: "$specialization",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: "$_id",
                    count: 1
                }
            },
            {
                $sort: { name: 1 }
            }
        ]);
    }

    async findNearby(lng, lat, maxDistanceInMeters = 10000, filter = {}, skip = 0, limit = 10) {
        const geoFilter = {
            ...filter,
            location: {
                $nearSphere: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: maxDistanceInMeters
                }
            }
        };
        return await Doctor.find(geoFilter)
            .skip(skip)
            .limit(limit);
    }
}

export default new DoctorRepository();
