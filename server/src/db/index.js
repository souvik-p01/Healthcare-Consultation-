/*
import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";

const connectDB = async () => {
  try{
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/{DB_NAME}`)
    console.log (`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`)
  }
  catch (error) {
    console.log ("MONGODB connection error", error);
    process.exit(1)
  }
}

export default connectDB

*/



/**
 * Healthcare Consultation System - Database Configuration
 * 
 * This module handles MongoDB connection setup with healthcare-specific
 * configurations including data security, connection pooling, and monitoring.
 * 
 * Features:
 * - Secure MongoDB connection with proper error handling
 * - Healthcare-optimized connection settings
 * - Connection monitoring and logging
 * - Automatic reconnection handling
 * - Data security configurations
 */

import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

/**
 * Configure MongoDB connection options for healthcare system
 * These settings are optimized for healthcare data handling requirements
 */
const connectionOptions = {
    // Connection pool settings for healthcare system scalability
    maxPoolSize: 10,        // Maximum number of connections in the pool
    minPoolSize: 2,         // Minimum number of connections in the pool
    maxIdleTimeMS: 30000,   // Close connections after 30 seconds of inactivity
    
    // Timeout settings for reliable healthcare data operations
    serverSelectionTimeoutMS: 5000,    // How long to try to connect before timing out
    socketTimeoutMS: 45000,            // How long to wait for a response
    connectTimeoutMS: 10000,           // How long to wait for initial connection
    
    // Healthcare data reliability settings
    retryWrites: true,                 // Retry write operations on network errors
    w: 'majority',                     // Write concern for data consistency
    journal: true,                     // Ensure writes are journaled (important for medical data)
    
    // Additional settings for production healthcare systems
    heartbeatFrequencyMS: 10000,       // How often to check server status
    //bufferMaxEntries: 0,               // Disable mongoose buffering
};

/**
 * Establish connection to MongoDB for Healthcare Consultation System
 * 
 * @returns {Promise<void>} Promise that resolves when connection is established
 */
const connectDB = async () => {
    try {
        // Ensure required environment variables are present
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI environment variable is not defined");
        }

        if (!DB_NAME) {
            throw new Error("Database name is not defined in constants");
        }

        console.log("🔄 Attempting to connect to Healthcare Database...");
        console.log(`📍 Database Name: ${DB_NAME}`);

        // Connect to MongoDB with healthcare database name
        // Fixed: Added missing $ before {DB_NAME}
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URI}/${DB_NAME}`,
            connectionOptions
        );

        // Log successful connection details
        console.log(`✅ MongoDB Connected Successfully!`);
        console.log(`🏥 Healthcare Database Host: ${connectionInstance.connection.host}`);
        console.log(`📊 Database Name: ${connectionInstance.connection.name}`);
        console.log(`🔌 Connection State: ${connectionInstance.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
        console.log(`⚡ Connection Pool Size: ${connectionOptions.maxPoolSize}`);

        // Set up connection event listeners for monitoring
        setupConnectionListeners();

    } catch (error) {
        console.error("❌ MONGODB Connection Error:", error.message);
        
        // Log additional error details for debugging
        if (error.code) {
            console.error(`🔢 Error Code: ${error.code}`);
        }
        
        // For healthcare systems, we want to fail fast and clearly
        console.error("🚨 Healthcare system cannot operate without database connection");
        console.error("🔄 Please check your MONGODB_URI and network connectivity");
        
        // Exit the process - healthcare systems need reliable database access
        process.exit(1);
    }
};

/**
 * Set up MongoDB connection event listeners for monitoring
 * Important for healthcare systems to track database health
 */
const setupConnectionListeners = () => {
    // Connection established
    mongoose.connection.on('connected', () => {
        console.log('🟢 Healthcare Database Status: Connected');
    });

    // Connection error
    mongoose.connection.on('error', (error) => {
        console.error('🔴 Healthcare Database Error:', error);
    });

    // Connection disconnected
    mongoose.connection.on('disconnected', () => {
        console.warn('🟡 Healthcare Database Status: Disconnected');
        console.warn('⚠️  This may affect patient data operations');
    });

    // Connection reconnected
    mongoose.connection.on('reconnected', () => {
        console.log('🟢 Healthcare Database Status: Reconnected');
        console.log('✅ Patient data operations restored');
    });

    // MongoDB driver disconnected (usually on app termination)
    mongoose.connection.on('close', () => {
        console.log('🔒 Healthcare Database Connection Closed');
    });
};

/**
 * Graceful database disconnection
 * Important for healthcare systems to properly close connections
 */
export const disconnectDB = async () => {
    try {
        await mongoose.connection.close();
        console.log('✅ Healthcare Database disconnected gracefully');
    } catch (error) {
        console.error('❌ Error during database disconnection:', error);
    }
};

/**
 * Check database connection health
 * Useful for healthcare system monitoring and health checks
 */
export const checkDBHealth = () => {
    const state = mongoose.connection.readyState;
    const states = {
        0: 'Disconnected',
        1: 'Connected',
        2: 'Connecting',
        3: 'Disconnecting'
    };
    
    return {
        status: states[state],
        readyState: state,
        host: mongoose.connection.host,
        name: mongoose.connection.name
    };
};

// Export the main connection function
export default connectDB;

/**
 * Database Configuration Notes for Healthcare System:
 * 
 * 1. MONGODB_URI should include authentication for production:
 *    mongodb://username:password@localhost:27017
 *    or mongodb+srv://username:password@cluster.mongodb.net
 * 
 * 2. For HIPAA compliance, ensure:
 *    - Enable authentication
 *    - Use TLS/SSL in production
 *    - Implement proper access controls
 *    - Enable audit logging
 * 
 * 3. Recommended production settings:
 *    - Use MongoDB Atlas with encryption at rest
 *    - Enable network security (IP whitelisting)
 *    - Regular database backups
 *    - Monitor connection metrics
 */