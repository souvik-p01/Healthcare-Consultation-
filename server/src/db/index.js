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
 * - Integration with healthcare logger
 * - HIPAA compliance considerations
 */

import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { LoggerUtils } from "../utils/logger.js";

/**
 * Configure MongoDB connection options for healthcare system
 * These settings are optimized for healthcare data handling requirements
 * and HIPAA compliance considerations
 */
const connectionOptions = {
    // Connection pool settings for healthcare system scalability
    maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,        // Maximum connections in pool
    minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 2,         // Minimum connections in pool
    maxIdleTimeMS: parseInt(process.env.DB_MAX_IDLE_TIME) || 30000,   // Close idle connections after 30s
    
    // Timeout settings for reliable healthcare data operations
    serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECT_TIMEOUT) || 5000,
    socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 45000,
    connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT) || 10000,
    
    // Healthcare data reliability settings (critical for patient data)
    retryWrites: process.env.DB_RETRY_WRITES !== 'false',             // Retry write operations
    w: process.env.DB_WRITE_CONCERN || 'majority',                    // Write concern for data consistency
    j: process.env.DB_JOURNAL !== 'false',                            // Journal writes (critical for medical data)
    readPreference: process.env.DB_READ_PREFERENCE || 'primary',      // Read preference
    readConcern: { level: process.env.DB_READ_CONCERN || 'majority' }, // Read concern level
    
    // Additional settings for production healthcare systems
    heartbeatFrequencyMS: parseInt(process.env.DB_HEARTBEAT_FREQ) || 10000,
    retryReads: process.env.DB_RETRY_READS !== 'false',               // Retry read operations
    
    // SSL/TLS settings for production (HIPAA requirement)
    ssl: process.env.NODE_ENV === 'production' ? true : false,
    tls: process.env.NODE_ENV === 'production' ? true : false,
    tlsAllowInvalidCertificates: process.env.NODE_ENV !== 'production',
    
    // Authentication mechanism
    authSource: process.env.DB_AUTH_SOURCE || 'admin',
};

/**
 * Validate required environment variables
 * @throws {Error} If required variables are missing
 */
const validateEnvironmentVariables = () => {
    const requiredVars = ['MONGODB_URI'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    if (!DB_NAME) {
        throw new Error("Database name is not defined in constants");
    }
};

/**
 * Build MongoDB connection URI with proper formatting
 * @returns {string} Formatted MongoDB connection URI
 */
const buildConnectionURI = () => {
    let uri = process.env.MONGODB_URI;
    
    // Ensure URI ends with proper separator
    if (!uri.endsWith('/') && !uri.includes('/?')) {
        uri += '/';
    }
    
    // Add database name to URI if not already present
    if (!uri.includes(DB_NAME)) {
        uri += DB_NAME;
    }
    
    // Add connection parameters if not present
    if (!uri.includes('?')) {
        uri += '?retryWrites=true&w=majority';
    }
    
    return uri;
};

/**
 * Establish connection to MongoDB for Healthcare Consultation System
 * 
 * @returns {Promise<mongoose.Connection>} Mongoose connection instance
 */
const connectDB = async () => {
    try {
        // Step 1: Validate environment variables
        LoggerUtils.info('Validating database environment variables...');
        validateEnvironmentVariables();

        // Step 2: Build connection URI
        const connectionURI = buildConnectionURI();
        
        LoggerUtils.info('🔄 Attempting to connect to Healthcare Database...', {
            database: DB_NAME,
            environment: process.env.NODE_ENV || 'development',
            poolSize: connectionOptions.maxPoolSize,
            sslEnabled: connectionOptions.ssl
        });

        // Step 3: Set mongoose configuration
        mongoose.set('strictQuery', true);
        mongoose.set('debug', process.env.DB_DEBUG === 'true');

        // Step 4: Attempt connection with retry logic
        let retries = 0;
        const maxRetries = parseInt(process.env.DB_MAX_RETRIES) || 3;
        let lastError = null;

        while (retries < maxRetries) {
            try {
                const connectionInstance = await mongoose.connect(connectionURI, connectionOptions);
                
                // Log successful connection
                LoggerUtils.success('✅ MongoDB Connected Successfully!', {
                    host: connectionInstance.connection.host,
                    database: connectionInstance.connection.name,
                    port: connectionInstance.connection.port,
                    readyState: 'Connected',
                    poolSize: connectionOptions.maxPoolSize,
                    retryAttempts: retries + 1
                });

                // Set up connection event listeners
                setupConnectionListeners();

                // Return connection instance for further use
                return connectionInstance;

            } catch (connError) {
                retries++;
                lastError = connError;
                
                if (retries < maxRetries) {
                    const delay = Math.pow(2, retries) * 1000; // Exponential backoff
                    LoggerUtils.warn(`⚠️  Connection attempt ${retries} failed. Retrying in ${delay/1000}s...`, {
                        error: connError.message,
                        attempt: retries,
                        maxRetries: maxRetries
                    });
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        // If we get here, all retries failed
        throw lastError || new Error('Failed to connect after multiple retries');

    } catch (error) {
        // Log detailed error information
        LoggerUtils.error('❌ MONGODB Connection Error:', {
            message: error.message,
            code: error.code,
            codeName: error.codeName,
            name: error.name,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });

        // Additional error context
        if (error.message.includes('ECONNREFUSED')) {
            LoggerUtils.error('🔴 MongoDB server is not running or not accessible');
            LoggerUtils.info('💡 Tip: Make sure MongoDB is running with: mongod');
        } else if (error.message.includes('Authentication failed')) {
            LoggerUtils.error('🔐 Authentication failed - Check username and password');
        } else if (error.message.includes('ENOTFOUND')) {
            LoggerUtils.error('🌐 Host not found - Check MongoDB URI hostname');
        }

        // For healthcare systems, we want to fail fast and clearly
        LoggerUtils.emergency('🚨 Healthcare system cannot operate without database connection', {
            error: error.message,
            severity: 'critical',
            impact: 'Patient data operations unavailable'
        });

        // Graceful shutdown
        await gracefulShutdown();
        
        // Exit with error code
        process.exit(1);
    }
};

/**
 * Set up MongoDB connection event listeners for monitoring
 * Important for healthcare systems to track database health
 */
const setupConnectionListeners = () => {
    // Remove any existing listeners to avoid duplicates
    mongoose.connection.removeAllListeners();

    // Connection established
    mongoose.connection.on('connected', () => {
        LoggerUtils.success('🟢 Healthcare Database Status: Connected', {
            host: mongoose.connection.host,
            database: mongoose.connection.name
        });
    });

    // Connection error
    mongoose.connection.on('error', (error) => {
        LoggerUtils.error('🔴 Healthcare Database Error:', {
            error: error.message,
            code: error.code,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });

        // Log to security events for monitoring
        LoggerUtils.logSecurityEvent('database_error', 'high', 'system', {
            description: 'Database connection error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    });

    // Connection disconnected
    mongoose.connection.on('disconnected', () => {
        LoggerUtils.warn('🟡 Healthcare Database Status: Disconnected', {
            timestamp: new Date().toISOString(),
            impact: 'Patient data operations interrupted'
        });

        // Log to audit trail
        LoggerUtils.logSecurityEvent('database_disconnect', 'high', 'system', {
            description: 'Database connection lost',
            timestamp: new Date().toISOString()
        });
    });

    // Connection reconnected
    mongoose.connection.on('reconnected', () => {
        LoggerUtils.success('🟢 Healthcare Database Status: Reconnected', {
            timestamp: new Date().toISOString(),
            impact: 'Patient data operations restored'
        });

        // Log successful reconnection
        LoggerUtils.logSecurityEvent('database_reconnect', 'info', 'system', {
            description: 'Database connection restored',
            timestamp: new Date().toISOString()
        });
    });

    // Connection close (usually on app termination)
    mongoose.connection.on('close', () => {
        LoggerUtils.info('🔒 Healthcare Database Connection Closed', {
            timestamp: new Date().toISOString()
        });
    });

    // Initial connection success
    mongoose.connection.once('open', () => {
        LoggerUtils.success('🔓 Database connection fully established and ready');
    });
};

/**
 * Graceful database disconnection
 * Important for healthcare systems to properly close connections and prevent data loss
 */
export const disconnectDB = async () => {
    try {
        LoggerUtils.info('🔄 Initiating graceful database disconnection...');

        // Close all open connections
        await mongoose.connection.close();
        
        LoggerUtils.success('✅ Healthcare Database disconnected gracefully', {
            host: mongoose.connection.host,
            database: mongoose.connection.name,
            timestamp: new Date().toISOString()
        });

        // Log disconnection for audit
        LoggerUtils.logSecurityEvent('database_disconnect', 'info', 'system', {
            description: 'Graceful database disconnection',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        LoggerUtils.error('❌ Error during database disconnection:', {
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Check database connection health
 * Useful for healthcare system monitoring and health checks
 * 
 * @returns {Object} Database health status object
 */
export const checkDBHealth = () => {
    const state = mongoose.connection.readyState;
    const states = {
        0: { status: 'Disconnected', color: '🔴', level: 'critical' },
        1: { status: 'Connected', color: '🟢', level: 'healthy' },
        2: { status: 'Connecting', color: '🟡', level: 'warning' },
        3: { status: 'Disconnecting', color: '🟠', level: 'warning' }
    };
    
    const currentState = states[state] || { status: 'Unknown', color: '⚫', level: 'unknown' };
    
    const healthInfo = {
        status: currentState.status,
        color: currentState.color,
        level: currentState.level,
        readyState: state,
        host: mongoose.connection.host || 'Not connected',
        database: mongoose.connection.name || 'Not connected',
        port: mongoose.connection.port || 'Not connected',
        models: Object.keys(mongoose.models).length,
        collections: mongoose.connection.collections ? Object.keys(mongoose.connection.collections).length : 0,
        timestamp: new Date().toISOString()
    };

    // Log health check based on status
    if (currentState.level === 'critical') {
        LoggerUtils.warn('⚠️ Database health check: CRITICAL', healthInfo);
    } else if (currentState.level === 'warning') {
        LoggerUtils.warn('⚠️ Database health check: WARNING', healthInfo);
    } else {
        LoggerUtils.info('✅ Database health check: HEALTHY', healthInfo);
    }

    return healthInfo;
};

/**
 * Graceful shutdown handler
 * Ensures database connections are properly closed before application exit
 */
const gracefulShutdown = async () => {
    LoggerUtils.info('🔄 Received shutdown signal, cleaning up...');
    
    try {
        await disconnectDB();
        LoggerUtils.success('✅ Cleanup completed successfully');
    } catch (error) {
        LoggerUtils.error('❌ Error during cleanup:', error);
    } finally {
        process.exit(0);
    }
};

/**
 * Get database connection statistics
 * Useful for monitoring and performance tuning
 * 
 * @returns {Promise<Object>} Database statistics
 */
export const getDBStats = async () => {
    try {
        const adminDb = mongoose.connection.db.admin();
        const serverStatus = await adminDb.serverStatus();
        
        return {
            connections: serverStatus.connections,
            network: serverStatus.network,
            opcounters: serverStatus.opcounters,
            uptime: serverStatus.uptime,
            version: serverStatus.version,
            currentTime: new Date().toISOString()
        };
    } catch (error) {
        LoggerUtils.error('Error getting database stats:', error);
        return null;
    }
};

/**
 * Initialize database with required collections and indexes
 * Ensures optimal performance for healthcare queries
 */
export const initializeDatabase = async () => {
    try {
        LoggerUtils.info('🔄 Initializing database collections and indexes...');

        // Ensure connection is established
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database not connected');
        }

        // Create collections if they don't exist
        const collections = ['users', 'patients', 'doctors', 'appointments', 'payments', 'invoices'];
        
        for (const collectionName of collections) {
            try {
                await mongoose.connection.createCollection(collectionName);
                LoggerUtils.debug(`✅ Collection verified: ${collectionName}`);
            } catch (error) {
                // Collection might already exist
                LoggerUtils.debug(`ℹ️ Collection ${collectionName}: ${error.message}`);
            }
        }

        LoggerUtils.success('✅ Database initialization completed');
        return true;

    } catch (error) {
        LoggerUtils.error('❌ Database initialization failed:', error);
        return false;
    }
};

// Handle application termination gracefully
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('uncaughtException', (error) => {
    LoggerUtils.error('Uncaught Exception:', error);
    gracefulShutdown();
});

// Export the main connection function and utilities
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
 *    - Encrypt data at rest
 *    - Regular security updates
 * 
 * 3. Recommended production settings:
 *    - Use MongoDB Atlas with encryption at rest
 *    - Enable network security (IP whitelisting)
 *    - Regular database backups (at least daily)
 *    - Monitor connection metrics
 *    - Enable database auditing
 *    - Implement data retention policies
 * 
 * 4. Environment variables needed:
 *    - MONGODB_URI: Database connection string
 *    - DB_NAME: Database name (from constants)
 *    - NODE_ENV: Environment (development/production)
 *    - DB_MAX_POOL_SIZE: Max connections (default: 10)
 *    - DB_SSL: Enable SSL (true in production)
 *    - DB_AUTH_SOURCE: Authentication database (default: admin)
 * 
 * 5. Connection pooling recommendations:
 *    - Development: min 1, max 5
 *    - Production: min 2, max 20 (adjust based on load)
 *    - Monitor connection usage to optimize pool size
 */ 