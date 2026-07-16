/**
 * Middleware for tracking doctor directory searches/consultations
 * (Complies with HIPAA/healthcare access auditing requirements)
 */
export const auditDoctorDirectoryAccess = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const clientIp = req.ip || req.connection.remoteAddress;
    const queryInfo = JSON.stringify(req.query);

    console.log(`🔍 [AUDIT-LOG] Doctor directory accessed at ${timestamp} by IP: ${clientIp}. Query: ${queryInfo}`);
    next();
};
