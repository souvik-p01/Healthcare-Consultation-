import { Server } from "socket.io";
import { Message } from "./models/message.model.js";

let io = null;

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log(`🔌 New client connected: ${socket.id}`);

        // Join personal notification channel
        socket.on("join", (userId) => {
            if (userId) {
                socket.join(userId.toString());
                console.log(`👤 User ${userId} joined personal channel`);
            }
        });

        // Join consultation chat room
        socket.on("join_consultation", (consultationId) => {
            if (consultationId) {
                socket.join(consultationId.toString());
                console.log(`💬 Client joined consultation room: ${consultationId}`);
            }
        });

        // Leave consultation room
        socket.on("leave_consultation", (consultationId) => {
            if (consultationId) {
                socket.leave(consultationId.toString());
                console.log(`💬 Client left consultation room: ${consultationId}`);
            }
        });

        // Send message in consultation
        socket.on("send_message", async (data) => {
            const { consultationId, senderId, content, messageType, fileUrl } = data;
            console.log(`📨 Message from ${senderId} in room ${consultationId}: ${content}`);

            try {
                // Save message to database
                const message = await Message.create({
                    consultationId,
                    senderId,
                    content,
                    messageType: messageType || 'text',
                    fileUrl
                });

                // Populate sender information
                const populatedMessage = await Message.findById(message._id)
                    .populate({
                        path: 'senderId',
                        select: 'firstName lastName avatar role'
                    })
                    .lean();

                // Broadcast to everyone in the room (including sender)
                io.to(consultationId.toString()).emit("receive_message", populatedMessage);
            } catch (err) {
                console.error("❌ Failed to save and send socket message:", err);
                socket.emit("message_error", { error: "Failed to send message" });
            }
        });

        // Handle typing indicator
        socket.on("typing", (data) => {
            const { consultationId, userId, isTyping } = data;
            // Broadcast typing event to everyone else in the room
            socket.to(consultationId.toString()).emit("typing", { userId, isTyping });
        });

        // Technician Portal updates
        socket.on("test-update", (data) => {
            console.log(`🔬 Lab test update:`, data);
            io.emit("test-update", data);
        });

        socket.on("equipment-update", (data) => {
            console.log(`⚙️ Equipment update:`, data);
            io.emit("equipment-update", data);
        });

        socket.on("disconnect", () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io is not initialized!");
    }
    return io;
};
