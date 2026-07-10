import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import axios from "axios";

// Detailed prompt training DeepSeek on all portals, features, routes, and roles of the application.
const DEEPSEEK_SYSTEM_INSTRUCTION = `You are DeepSeek Health AI, the official and highly intelligent virtual medical assistant integrated into the Healthcare Consultation and Management System. 

You are fully trained on every aspect of this application. When users ask questions, provide accurate, fully optimized, and context-aware responses. 

Here is the comprehensive map of the application features, portals, and routes that you know inside and out:

### 1. APPLICATION PORTALS & USER ROLES
- **Patient Portal (/patient-portal)**: Allowed for "patient" role. Allows patients to manage their dashboard, view appointments, track vitals, access prescriptions, and view billing details.
- **Doctor Portal (/doctor-portal)**: Allowed for "doctor", "nurse", and "provider" roles. Clinical decision support dashboard where healthcare professionals view patient charts, update medical histories, write prescriptions, and start audio/video consultations.
- **Technician Portal (/technician-portal)**: Allowed for "technician" and "staff" roles. Allows technicians to manage laboratory equipment, run diagnostics checks, upload patient test results, and view maintenance history.
- **Admin Dashboard (/admin)**: Allowed for "admin" role. Used for operational oversight, managing user accounts, auditing system logs, tracking financial transactions, and reviewing system performance feedback.

### 2. CORE SERVICES & SECTION ROUTES
- **Home Page (/)**: Landing page highlighting the platform's solutions and options.
- **AI Assistant (/services/assistant)**: This current page, which provides symptom analysis, general wellness guidelines, and report explanation.
- **Consultations (/services/consultations)**: Book medical appointments. Patients choose doctors by specialty (Cardiology, Pediatrics, General Medicine, etc.), pick appointment slots, and start secure audio/video video calls (powered by ZegoCloud).
- **Emergency Services (/services/emergency)**: 24/7 emergency dispatch page. Integrates Google Maps for live ambulance tracking, technician dispatch, emergency contact numbers, and fast hospital coordination.
- **Pharmacy Network (/services/pharmacy)**: Search and order verified medicines, locate nearby physical pharmacies, and track delivery status.
- **Health Monitoring (/services/monitoring)**: Logs and tracks patient vitals in real-time (Heart Rate, Blood Pressure, Glucose, Oxygen Saturation, Temperature) with color-coded alerts (Optimal, Alert, Danger).
- **Secure Records (/services/records)**: A secure Electronic Health Records (EHR) area where patients and authorized clinicians access historical prescriptions, test reports, and lab results.
- **Wellness Programs (/services/wellness-programs)**: Contains custom diet charts, lifestyle advice, fitness routines, and personalized wellness tracking.

### 3. EXTRA SERVICES
- **Telemedicine (/services/telemedicine)**: Virtual care entrypoint.
- **Lab Tests (/services/lab-tests)**: Booking and tracking diagnostic tests.
- **Health Reports (/services/health-reports)**: Dynamic summary metrics of general wellness history.

### YOUR BEHAVIOR & GUIDELINES:
1. **Navigational Guidance**: If the user is confused about how to perform a task (e.g. booking an appointment, checking vitals, ordering medicines, uploading a lab report), explain the steps clearly and point them to the exact route or portal listed above (always make sure to link the routes or mention the exact pages!).
2. **Empathetic & Professional Tone**: Maintain a reassuring, empathetic, yet highly professional and expert clinical tone.
3. **Medical Disclaimer**: You are an AI. Always provide evidence-based, clean, helpful medical information, but conclude clinical queries with a standard polite disclaimer: "This guidance is for informational purposes only. Please consult a licensed professional or go to the Emergency Services (/services/emergency) page for urgent matters."
4. **Structured Format**: Use bold text, bullet points, and neat spacing to make your answers easy to scan. Keep answers optimized, precise, and highly readable.
5. **Security/HIPAA**: Reassure users that their data is secure and that patient-provider chats are end-to-end encrypted under standard HIPAA compliance guidelines.`;

// Highly optimized local keyword-based fallback system that replicates DeepSeek's training on the app's features
const generateLocalFallbackResponse = (message, role) => {
    const lc = message.toLowerCase();
    
    // Consultation matching
    if (lc.includes("appointment") || lc.includes("book") || lc.includes("doctor") || lc.includes("consult") || lc.includes("video") || lc.includes("call")) {
        return `### 📅 Appointment & Consultations Guide

To schedule a consultation with our certified doctors:
1. Go to the **[Consultations Page](/services/consultations)**.
2. Select your required department or specialty (e.g., Cardiology, Pediatrics, General Medicine).
3. Browse our list of certified physicians, check their availability, and click **Book Appointment**.
4. At the scheduled time, you can launch a secure video/audio consultation right from the portal (powered by ZegoCloud).

*This guidance is for informational purposes only. Please consult a licensed professional or go to the [Emergency Services](/services/emergency) page for urgent matters.*

*(Running in optimized local mode due to API connection limits)*`;
    }

    // Emergency matching
    if (lc.includes("emergency") || lc.includes("ambulance") || lc.includes("accident") || lc.includes("urgent") || lc.includes("critical") || lc.includes("pain") || lc.includes("breath")) {
        return `### 🚨 Urgent / Emergency Action

If you are experiencing a medical emergency, please act immediately:
1. Visit our **[Emergency Services Page](/services/emergency)**.
2. Call our direct 24/7 hotline listed on that page.
3. You can request an instant ambulance dispatch or technician arrival.
4. The page provides a real-time tracking map (Google Maps integration) showing the exact location and ETA of the dispatched vehicle.

*For life-threatening symptoms, please call your local emergency services (112 or 911) immediately or head to the nearest emergency room.*

*(Running in optimized local mode due to API connection limits)*`;
    }

    // Vitals matching
    if (lc.includes("vital") || lc.includes("blood pressure") || lc.includes("bp") || lc.includes("glucose") || lc.includes("sugar") || lc.includes("heart rate") || lc.includes("pulse") || lc.includes("pulse") || lc.includes("oxygen") || lc.includes("temperature")) {
        return `### 🫀 Vital Signs & Health Monitoring

To log and keep track of your daily vitals:
1. Head over to the **[Health Monitoring Page](/services/monitoring)**.
2. You can log metrics for **Heart Rate**, **Blood Pressure**, **Blood Glucose**, **Oxygen Saturation (SpO2)**, and **Body Temperature**.
3. The system automatically plots these values and flags them using color-coded categories:
   - 🟢 **Optimal**: Vitals are in a healthy normal range.
   - 🟡 **Alert**: Slight variance from normal. Suggests monitoring.
   - 🔴 **Danger**: Significant variance. Please contact a physician immediately.

*This guidance is for informational purposes only. Please consult a licensed professional or go to the [Emergency Services](/services/emergency) page for urgent matters.*

*(Running in optimized local mode due to API connection limits)*`;
    }

    // Pharmacy matching
    if (lc.includes("medicine") || lc.includes("pill") || lc.includes("prescription") || lc.includes("drug") || lc.includes("pharmacy") || lc.includes("order") || lc.includes("buy")) {
        return `### 💊 Pharmacy Network & Medication Orders

To search for, browse, or purchase medications:
1. Navigate to the **[Pharmacy Network Page](/services/pharmacy)**.
2. Use the search bar to filter medications by name or category.
3. You can locate nearby physical pharmacies and check which items are in stock.
4. Add items to your cart, fill in your delivery details, and submit your order. You can track your package directly from your portal.

*This guidance is for informational purposes only. Please consult a licensed professional or go to the [Emergency Services](/services/emergency) page for urgent matters.*

*(Running in optimized local mode due to API connection limits)*`;
    }

    // Records matching
    if (lc.includes("record") || lc.includes("report") || lc.includes("history") || lc.includes("ehr") || lc.includes("pdf") || lc.includes("lab") || lc.includes("test")) {
        return `### 📁 Electronic Health Records & Lab Reports

To view your secure medical history:
1. Go to the **[Secure Records Page](/services/records)**.
2. Here you can find:
   - **Lab Test Results**: Review diagnostic findings uploaded by laboratory technicians.
   - **Prescriptions**: Digital copies of medications ordered by your consultation doctors.
   - **Clinical Notes**: Summaries and diagnostic histories logged during your checkups.
3. You can also upload custom PDF or image files on the **AI Assistant (/services/assistant)** left panel to get immediate explanations of specific values (like HbA1c or Cholesterol).

*This guidance is for informational purposes only. Please consult a licensed professional or go to the [Emergency Services](/services/emergency) page for urgent matters.*

*(Running in optimized local mode due to API connection limits)*`;
    }

    // Wellness matching
    if (lc.includes("wellness") || lc.includes("diet") || lc.includes("food") || lc.includes("exercise") || lc.includes("program") || lc.includes("lifestyle") || lc.includes("weight")) {
        return `### 🥗 Wellness & Lifestyle Programs

To participate in wellness programs:
1. Access the **[Wellness Programs Page](/services/wellness-programs)**.
2. You can view personalized diet routines, workout suggestions, and healthy lifestyle trackers.
3. Use the logs to maintain a log of your weight and hydration levels to receive custom health reports.

*This guidance is for informational purposes only. Please consult a licensed professional or go to the [Emergency Services](/services/emergency) page for urgent matters.*

*(Running in optimized local mode due to API connection limits)*`;
    }

    // Portal role matching
    if (lc.includes("portal") || lc.includes("role") || lc.includes("technician") || lc.includes("doctor") || lc.includes("patient") || lc.includes("admin")) {
        return `### 🏢 Platform Portals & User Roles

This system operates four dedicated portals tailored to specific healthcare roles:
- **[Patient Portal](/patient-portal)**: Accessible to patients. Contains personal vital monitoring, appointment schedules, and pharmacy logs.
- **[Doctor Portal](/doctor-portal)**: Accessible to clinical staff. Contains patient medical charts, prescription writers, and video calling.
- **[Technician Portal](/technician-portal)**: Accessible to lab technicians. Handles diagnostic testing logs and machine maintenance lists.
- **[Admin Dashboard](/admin)**: Accessible to administrators. Handles compliance, platform metrics, and user management.

*This guidance is for informational purposes only. Please consult a licensed professional or go to the [Emergency Services](/services/emergency) page for urgent matters.*

*(Running in optimized local mode due to API connection limits)*`;
    }

    // General fallback response
    return `### 👋 Hello! I'm DeepSeek Health AI

I am your virtual assistant for this Healthcare Consultation platform. Here is how I can help you:
- **📅 Consultations**: Book appointments, consult specialists, and join video calls. Visit the **[Consultations Page](/services/consultations)**.
- **🚨 Emergency**: Live ambulance tracking and quick technician dispatches. Go to the **[Emergency Services Page](/services/emergency)**.
- **💊 Pharmacy**: Search and order medicines with home delivery. Visit the **[Pharmacy Page](/services/pharmacy)**.
- **🫀 Vitals**: Log heart rate, BP, and sugar on the **[Health Monitoring Page](/services/monitoring)**.
- **📁 Secure Records**: Access historical prescriptions and EHR files on the **[Records Page](/services/records)**.

What would you like assistance with today?

*This guidance is for informational purposes only. Please consult a licensed professional or go to the [Emergency Services](/services/emergency) page for urgent matters.*

*(Running in optimized local mode due to API connection limits)*`;
};

export const aiChat = asyncHandler(async (req, res) => {
    const { message, history, role } = req.body;

    if (!message) {
        return res.status(400).json({
            success: false,
            message: "Message is required"
        });
    }

    console.log(`🤖 [AI CHAT] Request received. Role: ${role || "patient"}. Message: "${message}"`);

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
        console.warn("⚠️ DEEPSEEK_API_KEY not configured. Using local fallback.");
        const fallbackResponse = generateLocalFallbackResponse(message, role);
        return res.status(200).json(
            new ApiResponse(200, { response: fallbackResponse }, "Fallback response generated successfully")
        );
    }

    // Map client chat history to OpenAI/DeepSeek compatible role structure
    const formattedMessages = [
        { role: "system", content: DEEPSEEK_SYSTEM_INSTRUCTION }
    ];

    if (Array.isArray(history)) {
        history.forEach(msg => {
            if (msg && msg.text) {
                formattedMessages.push({
                    role: msg.type === "bot" ? "assistant" : "user",
                    content: msg.text
                });
            }
        });
    }

    formattedMessages.push({ role: "user", content: message });

    try {
        console.log("📡 Sending request to DeepSeek API...");
        const response = await axios.post(
            "https://api.deepseek.com/chat/completions",
            {
                model: "deepseek-chat",
                messages: formattedMessages,
                temperature: 0.7,
                max_tokens: 1000
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                timeout: 8000 // 8 seconds timeout
            }
        );

        const aiResponse = response.data?.choices?.[0]?.message?.content;
        
        if (!aiResponse) {
            throw new Error("Empty response content from DeepSeek API");
        }

        console.log("✅ [AI CHAT SUCCESS] Response received from DeepSeek");
        return res.status(200).json(
            new ApiResponse(200, { response: aiResponse }, "Chat response generated successfully")
        );

    } catch (error) {
        console.warn("⚠️ DeepSeek API call failed or returned error. Triggering optimized local fallback:", error.message);
        
        // Return fallback instead of crash
        const fallbackResponse = generateLocalFallbackResponse(message, role);
        return res.status(200).json(
            new ApiResponse(200, { response: fallbackResponse }, "Fallback response generated successfully")
        );
    }
});
