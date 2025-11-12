// src/middlewares/roleAuth.middleware.js
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Authentication required. Please log in."
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          message: "Access denied. Insufficient permissions."
        });
      }

      next();
    } catch (error) {
      console.error("Role Authorization Error:", error);
      return res.status(500).json({
        message: "Internal server error during authorization."
      });
    }
  };
};

export const isAdmin = authorize('admin');
export const isProvider = authorize('provider');
export const isPatient = authorize('patient');
export const isAdminOrProvider = authorize('admin', 'provider');