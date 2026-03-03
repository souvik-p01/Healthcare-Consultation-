
// /*
// import mongoose from "mongoose";
// import {DB_NAME} from "../constants.js";

// const connectDB = async () => {
//   try{
//     const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/{DB_NAME}`)
//     console.log (`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`)
//   }
//   catch (error) {
//     console.log ("MONGODB connection error", error);
//     process.exit(1)
//   }
// }

// export default connectDB

// */



// /**
//  * Healthcare Consultation System - Database Configuration
//  * 
//  * This module handles MongoDB connection setup with healthcare-specific
//  * configurations including data security, connection pooling, and monitoring.
//  * 
//  * Features:
//  * - Secure MongoDB connection with proper error handling
//  * - Healthcare-optimized connection settings
//  * - Connection monitoring and logging
//  * - Automatic reconnection handling
//  * - Data security configurations
//  */

// import mongoose from "mongoose";
// import { DB_NAME } from "../constants.js";
// import { LoggerUtils } from "../utils/logger.js";

// /**
//  * Configure MongoDB connection options for healthcare system
//  * These settings are optimized for healthcare data handling requirements
//  */
// const connectionOptions = {
//     // Connection pool settings for healthcare system scalability
//     maxPoolSize: 10,        // Maximum number of connections in the pool
//     minPoolSize: 2,         // Minimum number of connections in the pool
//     maxIdleTimeMS: 30000,   // Close connections after 30 seconds of inactivity
    
//     // Timeout settings for reliable healthcare data operations
//     serverSelectionTimeoutMS: 5000,    // How long to try to connect before timing out
//     socketTimeoutMS: 45000,            // How long to wait for a response
//     connectTimeoutMS: 10000,           // How long to wait for initial connection
    
//     // Healthcare data reliability settings
//     retryWrites: true,                 // Retry write operations on network errors
//     w: 'majority',                     // Write concern for data consistency
//     journal: true,                     // Ensure writes are journaled (important for medical data)
    
//     // Additional settings for production healthcare systems
//     heartbeatFrequencyMS: 10000,       // How often to check server status
//     //bufferMaxEntries: 0,               // Disable mongoose buffering
// };

// /**
//  * Establish connection to MongoDB for Healthcare Consultation System
//  * 
//  * @returns {Promise<void>} Promise that resolves when connection is established
//  */
// const connectDB = async () => {
//     try {
//         // Ensure required environment variables are present
//         if (!process.env.MONGODB_URI) {
//             throw new Error("MONGODB_URI environment variable is not defined");
//         }

//         if (!DB_NAME) {
//             throw new Error("Database name is not defined in constants");
//         }

//         console.log("🔄 Attempting to connect to Healthcare Database...");
//         console.log(`📍 Database Name: ${DB_NAME}`);

//         // Connect to MongoDB with healthcare database name
//         // Fixed: Added missing $ before {DB_NAME}
//         const connectionInstance = await mongoose.connect(
//             `${process.env.MONGODB_URI}/${DB_NAME}`,
//             connectionOptions
//         );

//         // Log successful connection details
//         console.log(`✅ MongoDB Connected Successfully!`);
//         console.log(`🏥 Healthcare Database Host: ${connectionInstance.connection.host}`);
//         console.log(`📊 Database Name: ${connectionInstance.connection.name}`);
//         console.log(`🔌 Connection State: ${connectionInstance.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
//         console.log(`⚡ Connection Pool Size: ${connectionOptions.maxPoolSize}`);

//         // Set up connection event listeners for monitoring
//         setupConnectionListeners();

//     } catch (error) {
//         console.error("❌ MONGODB Connection Error:", error.message);
        
//         // Log additional error details for debugging
//         if (error.code) {
//             console.error(`🔢 Error Code: ${error.code}`);
//         }
        
//         // For healthcare systems, we want to fail fast and clearly
//         console.error("🚨 Healthcare system cannot operate without database connection");
//         console.error("🔄 Please check your MONGODB_URI and network connectivity");
        
//         // Exit the process - healthcare systems need reliable database access
//         process.exit(1);
//     }
// };

// /**
//  * Set up MongoDB connection event listeners for monitoring
//  * Important for healthcare systems to track database health
//  */
// const setupConnectionListeners = () => {
//     // Connection established
//     mongoose.connection.on('connected', () => {
//         console.log('🟢 Healthcare Database Status: Connected');
//     });

//     // Connection error
//     mongoose.connection.on('error', (error) => {
//         console.error('🔴 Healthcare Database Error:', error);
//     });

//     // Connection disconnected
//     mongoose.connection.on('disconnected', () => {
//         console.warn('🟡 Healthcare Database Status: Disconnected');
//         console.warn('⚠️  This may affect patient data operations');
//     });

//     // Connection reconnected
//     mongoose.connection.on('reconnected', () => {
//         console.log('🟢 Healthcare Database Status: Reconnected');
//         console.log('✅ Patient data operations restored');
//     });

//     // MongoDB driver disconnected (usually on app termination)
//     mongoose.connection.on('close', () => {
//         console.log('🔒 Healthcare Database Connection Closed');
//     });
// };

// /**
//  * Graceful database disconnection
//  * Important for healthcare systems to properly close connections
//  */
// export const disconnectDB = async () => {
//     try {
//         await mongoose.connection.close();
//         console.log('✅ Healthcare Database disconnected gracefully');
//     } catch (error) {
//         console.error('❌ Error during database disconnection:', error);
//     }
// };

// /**
//  * Check database connection health
//  * Useful for healthcare system monitoring and health checks
//  */
// export const checkDBHealth = () => {
//     const state = mongoose.connection.readyState;
//     const states = {
//         0: 'Disconnected',
//         1: 'Connected',
//         2: 'Connecting',
//         3: 'Disconnecting'
//     };
    
//     return {
//         status: states[state],
//         readyState: state,
//         host: mongoose.connection.host,
//         name: mongoose.connection.name
//     };
// };

// // Export the main connection function
// export default connectDB;

// /**
//  * Database Configuration Notes for Healthcare System:
//  * 
//  * 1. MONGODB_URI should include authentication for production:
//  *    mongodb://username:password@localhost:27017
//  *    or mongodb+srv://username:password@cluster.mongodb.net
//  * 
//  * 2. For HIPAA compliance, ensure:
//  *    - Enable authentication
//  *    - Use TLS/SSL in production
//  *    - Implement proper access controls
//  *    - Enable audit logging
//  * 
//  * 3. Recommended production settings:
//  *    - Use MongoDB Atlas with encryption at rest
//  *    - Enable network security (IP whitelisting)
//  *    - Regular database backups
//  *    - Monitor connection metrics
//  */


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
 * - Retry mechanism for failed connections
 * - Connection health monitoring
 * - Graceful shutdown handling
 * - Environment-based configuration
 */

import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { LoggerUtils } from "../utils/logger.js"; // Assuming you have logger utility

/**
 * Configure MongoDB connection options for healthcare system
 * These settings are optimized for healthcare data handling requirements
 */
const connectionOptions = {
    // Connection pool settings for healthcare system scalability
    maxPoolSize: process.env.DB_MAX_POOL_SIZE ? parseInt(process.env.DB_MAX_POOL_SIZE) : 10,
    minPoolSize: process.env.DB_MIN_POOL_SIZE ? parseInt(process.env.DB_MIN_POOL_SIZE) : 2,
    maxIdleTimeMS: process.env.DB_MAX_IDLE_TIME ? parseInt(process.env.DB_MAX_IDLE_TIME) : 30000,
    
    // Timeout settings for reliable healthcare data operations
    serverSelectionTimeoutMS: process.env.DB_SERVER_SELECT_TIMEOUT ? parseInt(process.env.DB_SERVER_SELECT_TIMEOUT) : 5000,
    socketTimeoutMS: process.env.DB_SOCKET_TIMEOUT ? parseInt(process.env.DB_SOCKET_TIMEOUT) : 45000,
    connectTimeoutMS: process.env.DB_CONNECT_TIMEOUT ? parseInt(process.env.DB_CONNECT_TIMEOUT) : 10000,
    
    // Healthcare data reliability settings
    retryWrites: process.env.DB_RETRY_WRITES !== 'false',
    w: process.env.DB_WRITE_CONCERN || 'majority',
    journal: process.env.DB_JOURNAL !== 'false',
    retryReads: process.env.DB_RETRY_READS !== 'false',
    
    // Additional settings for production healthcare systems
    heartbeatFrequencyMS: process.env.DB_HEARTBEAT_FREQ ? parseInt(process.env.DB_HEARTBEAT_FREQ) : 10000,
    
    // SSL/TLS settings for production (HIPAA compliance)
    ssl: process.env.NODE_ENV === 'production' ? true : false,
    tls: process.env.NODE_ENV === 'production' ? true : false,
    tlsAllowInvalidCertificates: process.env.NODE_ENV !== 'production',
    
    // Authentication mechanism
    authSource: process.env.DB_AUTH_SOURCE || 'admin',
    
    // Write concern settings
    writeConcern: {
        w: process.env.DB_WRITE_CONCERN || 'majority',
        j: process.env.DB_JOURNAL !== 'false',
        wtimeout: process.env.DB_WTIMEOUT ? parseInt(process.env.DB_WTIMEOUT) : 10000
    },
    
    // Read preference for replica sets
    readPreference: process.env.DB_READ_PREFERENCE || 'primary',
    readConcern: {
        level: process.env.DB_READ_CONCERN || 'majority'
    },
    
    // Enable autoIndex in development, disable in production for performance
    autoIndex: process.env.NODE_ENV !== 'production',
    
    // Enable debug mode in development
    debug: process.env.DB_DEBUG === 'true'
};

/**
 * Validate environment variables before connection attempt
 * @throws {Error} If required environment variables are missing
 */
const validateEnvironmentVariables = () => {
    const missingVars = [];
    
    if (!process.env.MONGODB_URI) {
        missingVars.push('MONGODB_URI');
    }
    
    if (!DB_NAME) {
        missingVars.push('DB_NAME (from constants)');
    }
    
    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    return true;
};

/**
 * Build MongoDB connection URI with proper formatting
 * @returns {string} Formatted MongoDB connection URI
 */
const buildConnectionURI = () => {
    let uri = process.env.MONGODB_URI;
    
    // Remove trailing slash if present
    uri = uri.replace(/\/$/, '');
    
    // Add database name
    const finalURI = `${uri}/${DB_NAME}`;
    
    return finalURI;
};

/**
 * Retry connection with exponential backoff
 * @param {number} retries - Number of retries attempted
 * @param {number} maxRetries - Maximum number of retries allowed
 * @returns {Promise<boolean>} - Whether to retry or not
 */
const shouldRetry = (retries, maxRetries) => {
    return retries < maxRetries;
};

/**
 * Calculate delay for next retry using exponential backoff
 * @param {number} retries - Number of retries attempted
 * @returns {number} - Delay in milliseconds
 */
const getRetryDelay = (retries) => {
    const baseDelay = process.env.DB_RETRY_DELAY ? parseInt(process.env.DB_RETRY_DELAY) : 5000;
    return Math.min(baseDelay * Math.pow(2, retries), 30000); // Max 30 seconds
};

/**
 * Establish connection to MongoDB for Healthcare Consultation System
 * 
 * @returns {Promise<mongoose.Connection>} Promise that resolves with connection instance
 */
const connectDB = async () => {
    let retries = 0;
    const maxRetries = process.env.DB_MAX_RETRIES ? parseInt(process.env.DB_MAX_RETRIES) : 5;
    
    while (shouldRetry(retries, maxRetries)) {
        try {
            // Validate environment variables
            validateEnvironmentVariables();

            console.log("🔄 Attempting to connect to Healthcare Database...");
            console.log(`📍 Database Name: ${DB_NAME}`);
            console.log(`🔁 Connection Attempt: ${retries + 1}/${maxRetries}`);

            // Build connection URI
            const connectionURI = buildConnectionURI();
            
            // Set mongoose configuration
            mongoose.set('strictQuery', true);
            if (connectionOptions.debug) {
                mongoose.set('debug', true);
            }

            // Connect to MongoDB with healthcare database name
            const connectionInstance = await mongoose.connect(
                connectionURI,
                connectionOptions
            );

            // Log successful connection details
            console.log(`\n✅ MongoDB Connected Successfully!`);
            console.log(`🏥 Healthcare Database Host: ${connectionInstance.connection.host}`);
            console.log(`📊 Database Name: ${connectionInstance.connection.name}`);
            console.log(`🔌 Connection State: ${connectionInstance.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
            console.log(`⚡ Connection Pool Size: ${connectionInstance.connection.client?.options?.maxPoolSize || connectionOptions.maxPoolSize}`);
            console.log(`🌐 Connection URI: ${connectionURI.replace(/:[^:@]*@/, ':***@')}`); // Mask password
            console.log(`⏱️  Connection Time: ${new Date().toLocaleString()}\n`);

            // Set up connection event listeners for monitoring
            setupConnectionListeners();

            // Initialize database with required collections and indexes
            await initializeDatabase();

            // Return connection instance for further use
            return connectionInstance;

        } catch (error) {
            retries++;
            
            console.error(`❌ MongoDB Connection Attempt ${retries} Failed:`, error.message);
            
            // Log additional error details for debugging
            if (error.code) {
                console.error(`🔢 Error Code: ${error.code}`);
                console.error(`📝 Error Code Name: ${error.codeName || 'N/A'}`);
            }
            
            if (error.name) {
                console.error(`📋 Error Type: ${error.name}`);
            }

            // Specific error handling
            if (error.message.includes('ECONNREFUSED')) {
                console.error('🔴 MongoDB server is not running or not accessible');
                console.error('💡 Tip: Make sure MongoDB is running with: mongod');
            } else if (error.message.includes('Authentication failed')) {
                console.error('🔐 Authentication failed - Check username and password in MONGODB_URI');
            } else if (error.message.includes('ENOTFOUND')) {
                console.error('🌐 Host not found - Check MongoDB URI hostname');
            } else if (error.message.includes('ETIMEDOUT')) {
                console.error('⏱️  Connection timeout - Check network connectivity');
            }

            if (shouldRetry(retries, maxRetries)) {
                const delay = getRetryDelay(retries - 1);
                console.log(`🔄 Retrying in ${delay / 1000} seconds... (Attempt ${retries + 1}/${maxRetries})`);
                
                // Log to logger utility if available
                if (LoggerUtils) {
                    LoggerUtils.warn(`Database connection retry`, {
                        attempt: retries + 1,
                        maxRetries,
                        delay,
                        error: error.message
                    });
                }
                
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // Max retries reached
                console.error("\n❌ Failed to connect to MongoDB after maximum retries");
                console.error("🚨 Healthcare system cannot operate without database connection");
                console.error("🔄 Please check your MONGODB_URI and network connectivity");
                
                // Log fatal error
                if (LoggerUtils) {
                    LoggerUtils.emergency('Database connection failed after max retries', {
                        error: error.message,
                        retries,
                        maxRetries
                    });
                }
                
                // Exit the process - healthcare systems need reliable database access
                process.exit(1);
            }
        }
    }
};

/**
 * Set up MongoDB connection event listeners for monitoring
 * Important for healthcare systems to track database health
 */
const setupConnectionListeners = () => {
    // Remove existing listeners to avoid duplicates
    mongoose.connection.removeAllListeners();

    // Connection established
    mongoose.connection.on('connected', () => {
        console.log('🟢 Healthcare Database Status: Connected');
        if (LoggerUtils) {
            LoggerUtils.info('Database connected', {
                host: mongoose.connection.host,
                database: mongoose.connection.name
            });
        }
    });

    // Connection error
    mongoose.connection.on('error', (error) => {
        console.error('🔴 Healthcare Database Error:', error.message);
        if (LoggerUtils) {
            LoggerUtils.error('Database error', {
                error: error.message,
                code: error.code
            });
        }
    });

    // Connection disconnected
    mongoose.connection.on('disconnected', () => {
        console.warn('🟡 Healthcare Database Status: Disconnected');
        console.warn('⚠️  This may affect patient data operations');
        if (LoggerUtils) {
            LoggerUtils.warn('Database disconnected', {
                timestamp: new Date().toISOString()
            });
        }
    });

    // Connection reconnected
    mongoose.connection.on('reconnected', () => {
        console.log('🟢 Healthcare Database Status: Reconnected');
        console.log('✅ Patient data operations restored');
        if (LoggerUtils) {
            LoggerUtils.info('Database reconnected', {
                timestamp: new Date().toISOString()
            });
        }
    });

    // Connection close (usually on app termination)
    mongoose.connection.on('close', () => {
        console.log('🔒 Healthcare Database Connection Closed');
        if (LoggerUtils) {
            LoggerUtils.info('Database connection closed');
        }
    });

    // Initial connection open
    mongoose.connection.once('open', () => {
        console.log('🔓 Database connection fully established and ready');
    });

    // Full setup complete
    mongoose.connection.on('fullsetup', () => {
        console.log('🟢 Replica set primary and secondary connections established');
    });
};

/**
 * Graceful database disconnection
 * Important for healthcare systems to properly close connections
 * @param {boolean} force - Force close without waiting for operations to complete
 */
export const disconnectDB = async (force = false) => {
    try {
        console.log('🔄 Gracefully disconnecting from Healthcare Database...');
        
        if (force) {
            await mongoose.connection.close(true);
            console.log('✅ Healthcare Database forcefully disconnected');
        } else {
            await mongoose.connection.close();
            console.log('✅ Healthcare Database disconnected gracefully');
        }
        
        if (LoggerUtils) {
            LoggerUtils.info('Database disconnected', { force });
        }
    } catch (error) {
        console.error('❌ Error during database disconnection:', error.message);
        if (LoggerUtils) {
            LoggerUtils.error('Error during database disconnection', {
                error: error.message
            });
        }
        throw error;
    }
};

/**
 * Check database connection health
 * Useful for healthcare system monitoring and health checks
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
    
    return healthInfo;
};

/**
 * Get database connection statistics
 * @returns {Object} Database statistics
 */
export const getDBStats = async () => {
    try {
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database not connected');
        }
        
        const adminDb = mongoose.connection.db.admin();
        const serverStatus = await adminDb.serverStatus();
        const dbStats = await mongoose.connection.db.stats();
        
        return {
            server: {
                version: serverStatus.version,
                uptime: serverStatus.uptime,
                connections: serverStatus.connections,
                network: serverStatus.network,
                opcounters: serverStatus.opcounters
            },
            database: {
                name: mongoose.connection.name,
                collections: dbStats.collections,
                objects: dbStats.objects,
                avgObjSize: dbStats.avgObjSize,
                dataSize: dbStats.dataSize,
                storageSize: dbStats.storageSize,
                indexes: dbStats.indexes,
                indexSize: dbStats.indexSize
            },
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error getting database stats:', error.message);
        return null;
    }
};

/**
 * Initialize database with required collections and indexes
 * Ensures optimal performance for healthcare queries
 */
export const initializeDatabase = async () => {
    try {
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database not connected');
        }
        
        console.log('🗄️  Initializing database collections and indexes...');
        
        // Get list of existing collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        
        // Required collections for healthcare system
        const requiredCollections = [
            'users',
            'patients',
            'doctors', 
            'appointments',
            'payments',
            'invoices',
            'prescriptions',
            'medicalrecords',
            'auditlogs'
        ];
        
        // Create missing collections
        for (const collectionName of requiredCollections) {
            if (!collectionNames.includes(collectionName)) {
                await mongoose.connection.createCollection(collectionName);
                console.log(`✅ Created collection: ${collectionName}`);
            } else {
                console.log(`ℹ️  Collection already exists: ${collectionName}`);
            }
        }
        
        // Create indexes for better query performance
        if (mongoose.connection.db) {
            const usersCollection = mongoose.connection.collection('users');
            await usersCollection.createIndex({ email: 1 }, { unique: true });
            await usersCollection.createIndex({ role: 1 });
            
            const patientsCollection = mongoose.connection.collection('patients');
            await patientsCollection.createIndex({ userId: 1 });
            
            const appointmentsCollection = mongoose.connection.collection('appointments');
            await appointmentsCollection.createIndex({ patientId: 1, appointmentDate: -1 });
            await appointmentsCollection.createIndex({ doctorId: 1, appointmentDate: -1 });
            await appointmentsCollection.createIndex({ status: 1 });
            
            const paymentsCollection = mongoose.connection.collection('payments');
            await paymentsCollection.createIndex({ userId: 1, createdAt: -1 });
            await paymentsCollection.createIndex({ status: 1 });
            await paymentsCollection.createIndex({ transactionId: 1 }, { unique: true, sparse: true });
            
            console.log('✅ Database indexes created successfully');
        }
        
        console.log('✅ Database initialization completed\n');
        
    } catch (error) {
        console.error('❌ Database initialization error:', error.message);
        if (LoggerUtils) {
            LoggerUtils.error('Database initialization failed', {
                error: error.message
            });
        }
    }
};

/**
 * Check if database is connected
 * @returns {boolean} True if connected, false otherwise
 */
export const isDBConnected = () => {
    return mongoose.connection.readyState === 1;
};

/**
 * Get database connection status message
 * @returns {string} Connection status message
 */
export const getDBStatusMessage = () => {
    const state = mongoose.connection.readyState;
    const messages = {
        0: 'Disconnected',
        1: 'Connected',
        2: 'Connecting',
        3: 'Disconnecting'
    };
    return messages[state] || 'Unknown';
};

// Handle application termination gracefully
process.on('SIGINT', async () => {
    await disconnectDB();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await disconnectDB();
    process.exit(0);
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
 * 4. Environment variables that can be configured:
 *    - DB_MAX_POOL_SIZE: Maximum connections in pool (default: 10)
 *    - DB_MIN_POOL_SIZE: Minimum connections in pool (default: 2)
 *    - DB_MAX_IDLE_TIME: Close idle connections after (default: 30000ms)
 *    - DB_MAX_RETRIES: Maximum connection retry attempts (default: 5)
 *    - DB_RETRY_DELAY: Base delay between retries (default: 5000ms)
 *    - DB_SERVER_SELECT_TIMEOUT: Server selection timeout (default: 5000ms)
 *    - DB_SOCKET_TIMEOUT: Socket timeout (default: 45000ms)
 *    - DB_CONNECT_TIMEOUT: Connection timeout (default: 10000ms)
 *    - DB_SSL: Enable SSL connection (default: true in production)
 *    - DB_DEBUG: Enable mongoose debug mode (default: false)
 * 
 * 5. Required collections for healthcare system:
 *    - users: User accounts and authentication
 *    - patients: Patient information
 *    - doctors: Doctor profiles
 *    - appointments: Appointment scheduling
 *    - payments: Payment transactions
 *    - invoices: Billing invoices
 *    - prescriptions: Medical prescriptions
 *    - medicalrecords: Patient medical records
 *    - auditlogs: HIPAA compliance audit logs
 */ 