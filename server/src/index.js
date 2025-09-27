/*

import dotenv from "dotenv" //another approach and down there a configure also require
import {DB_NAME} from "./constants.js";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({// and also write in package.json file "dev": "nodemon -r dotenv/config --experimental-json-modules src/index.js"
  path: './.env'
})



connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port : ${process.env.PORT}`);
    });

    app.on("error", (error) => {
      console.log("ERROR", error);
      throw error;
    });
  })
  .catch((error) => {
    console.log("MONGODB connection failed !!", error);
  });

*/




/**
 * Healthcare Consultation System - Main Entry Point
 * 
 * This file serves as the main entry point for the healthcare consultation backend.
 * It handles environment configuration, database connection, and server startup.
 * 
 * Features:
 * - Environment variables configuration
 * - MongoDB database connection
 * - Express server initialization
 * - Error handling for server and database
 * - Graceful shutdown handling
 */

// Import environment configuration at the top to ensure all modules have access
import dotenv from "dotenv";

// Import database name constant
import { DB_NAME } from "./constants.js";

// Import database connection function
import connectDB from "./db/index.js";

// Import Express app configuration
import { app } from "./app.js";

// Configure environment variables from .env file
// Make sure to add "dev": "nodemon -r dotenv/config --experimental-json-modules src/index.js" in package.json
dotenv.config({
    path: './.env'
});

// Define the port for the healthcare system server
const PORT = process.env.PORT || 8000;

/**
 * Initialize Database Connection and Start Server
 * 
 * This function establishes connection to MongoDB and starts the Express server.
 * It includes proper error handling for both database and server initialization.
 */
const startServer = async () => {
    try {
        // Connect to MongoDB database
        await connectDB();
        console.log(`📊 Database connected successfully to ${DB_NAME}`);
        
        // Start the Express server
        const server = app.listen(PORT, () => {
            console.log(`🏥 Healthcare Consultation Server is running at port: ${PORT}`);
            console.log(`🌐 Server URL: http://localhost:${PORT}`);
            console.log(`📅 Started at: ${new Date().toLocaleString()}`);
        });

        // Handle server errors
        server.on("error", (error) => {
            console.error("❌ Server Error:", error);
            throw error;
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
            console.log('🔄 Shutting down server due to uncaught exception');
            process.exit(1);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (error) => {
            console.error('❌ Unhandled Rejection:', error);
            console.log('🔄 Shutting down server due to unhandled promise rejection');
            server.close(() => {
                process.exit(1);
            });
        });

        // Graceful shutdown on SIGTERM (for production deployments)
        process.on('SIGTERM', () => {
            console.log('🛑 SIGTERM received. Shutting down gracefully');
            server.close(() => {
                console.log('✅ Process terminated gracefully');
            });
        });

        // Graceful shutdown on SIGINT (Ctrl+C)
        process.on('SIGINT', () => {
            console.log('\n🛑 SIGINT received. Shutting down gracefully');
            server.close(() => {
                console.log('✅ Process terminated gracefully');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error("❌ MongoDB connection failed:", error);
        console.log("🔄 Retrying connection in 5 seconds...");
        
        // Retry connection after 5 seconds for healthcare system reliability
        // setTimeout(() => {
        //     startServer();
        // }, 5000);
    }
};

// Start the healthcare consultation server
startServer();

/**
 * Environment Variables Required:
 * 
 * Essential for Healthcare System:
 * - PORT: Server port number (default: 8000)
 * - MONGODB_URI: MongoDB connection string
 * - JWT_SECRET: Secret key for JWT tokens
 * - JWT_EXPIRY: JWT token expiry time
 * 
 * For File Uploads (Medical Documents/Images):
 * - CLOUDINARY_CLOUD_NAME: Cloudinary cloud name
 * - CLOUDINARY_API_KEY: Cloudinary API key
 * - CLOUDINARY_API_SECRET: Cloudinary API secret
 * 
 * Security & CORS:
 * - CORS_ORIGIN: Allowed origins for CORS
 * - NODE_ENV: Environment (development/production)
 * 
 * Optional Healthcare Features:
 * - EMAIL_SERVICE: Email service for notifications
 * - EMAIL_USER: Email username
 * - EMAIL_PASS: Email password
 * - TWILIO_SID: Twilio SID for SMS notifications
 * - TWILIO_AUTH_TOKEN: Twilio auth token
 */