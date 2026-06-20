import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
    {
        consultationId: {
            type: Schema.Types.ObjectId,
            ref: 'Appointment', // We'll map consultation messages to the Appointment ID/Room ID
            required: true,
            index: true
        },
        senderId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true,
            trim: true
        },
        messageType: {
            type: String,
            enum: ['text', 'image', 'file'],
            default: 'text'
        },
        fileUrl: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

// Optimize search by consultationId and createdAt
messageSchema.index({ consultationId: 1, createdAt: 1 });

export const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);
