import doctorRepository from "../repository/doctor.repository.js";

class DoctorService {
    async queryDoctors(params) {
        const {
            page = 1,
            limit = 10,
            specialization,
            specialty,
            gender,
            search,
            lat,
            lng,
            radius = 10 // km
        } = params;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const parsedLimit = parseInt(limit);

        // Build filter query
        const filter = {};
        
        // Handle specialization or specialty
        const spec = specialization || specialty;
        if (spec && spec !== "all" && spec !== "") {
            filter.specialization = new RegExp(`^${spec}$`, "i");
        }

        if (gender) {
            filter.gender = new RegExp(`^${gender}$`, "i");
        }

        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: "i" } },
                { specialization: { $regex: search, $options: "i" } },
                { hospitalName: { $regex: search, $options: "i" } },
                { clinicName: { $regex: search, $options: "i" } }
            ];
        }

        let doctors = [];
        let total = 0;

        if (lat && lng) {
            const distanceInMeters = parseFloat(radius) * 1000;
            doctors = await doctorRepository.findNearby(
                parseFloat(lng),
                parseFloat(lat),
                distanceInMeters,
                filter,
                skip,
                parsedLimit
            );
            // Count total matching without limit for geospatial
            total = await doctorRepository.count(filter);
        } else {
            doctors = await doctorRepository.find(filter, { rating: -1 }, skip, parsedLimit);
            total = await doctorRepository.count(filter);
        }

        return {
            doctors,
            pagination: {
                total,
                page: parseInt(page),
                limit: parsedLimit,
                pages: Math.ceil(total / parsedLimit)
            }
        };
    }

    async getDoctorById(id) {
        return await doctorRepository.findById(id);
    }

    async getDoctorByEmail(email) {
        return await doctorRepository.findOne({ email });
    }

    async addDoctor(data) {
        if (data.longitude && data.latitude) {
            data.location = {
                type: "Point",
                coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)]
            };
        }
        return await doctorRepository.create(data);
    }

    async deleteDoctor(id) {
        return await doctorRepository.delete(id);
    }

    async getSpecialties() {
        return await doctorRepository.getSpecialtyCounts();
    }
}

export default new DoctorService();
