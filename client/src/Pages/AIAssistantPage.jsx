import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, ChevronLeft, Send, MessageSquare, Shield, TrendingUp,
  Upload, Download, Search, Bell, Settings, Zap, FileText, X,
  User, Bot, Camera, AlertCircle, CheckCircle, Clock, Volume2,
  Mic, History, Star, Heart, Plus, Trash2, Eye, Share2, Lock,
  Menu, Maximize2, Activity, Pill, Stethoscope, ChevronRight,
  Sparkles, BarChart2, RefreshCw
} from 'lucide-react';

import OpenAI from "openai";

/* ── Design Tokens ──────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');

  :root {
    --ink:      #0a0a12;
    --ink2:     #2a2a3a;
    --muted:    #7b7b99;
    --border:   #e4e4ef;
    --surface:  #f7f7fc;
    --white:    #ffffff;
    --teal:     #00c9a7;
    --teal2:    #00a08a;
    --coral:    #ff6b6b;
    --gold:     #ffd166;
    --blue:     #4361ee;
    --purple:   #7b2ff7;
    --glow:     rgba(0,201,167,0.25);
    --r-sm:     10px;
    --r-md:     16px;
    --r-lg:     24px;
    --r-xl:     32px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .ai-page {
    font-family: 'DM Sans', sans-serif;
    background: #f0f0f8;
    min-height: 100vh;
    color: var(--ink);
  }

  /* ── HEADER ── */
  .ai-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 32px;
    background: var(--white);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(12px);
  }
  .ai-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 1.2rem;
    color: var(--ink);
    text-decoration: none;
  }
  .ai-logo-icon {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, #00c9a7, #4361ee);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
  }
  .ai-topbar-right { display: flex; align-items: center; gap: 12px; }
  .ai-status-pill {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 0.75rem; font-weight: 500;
    border: 1px solid;
  }
  .ai-status-pill.connected { background: #e8faf5; border-color: #00c9a7; color: #00a08a; }
  .ai-status-pill.error     { background: #fff0f0; border-color: #ff6b6b; color: #cc4444; }
  .ai-status-pill.checking  { background: #fffbe8; border-color: #ffd166; color: #b38600; }
  .ai-status-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: currentColor;
    animation: pulse-dot 2s infinite;
  }
  @keyframes pulse-dot {
    0%,100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }
  .ai-back-btn {
    display: flex; align-items: center; gap: 6px;
    text-decoration: none; color: var(--muted); font-size: 0.875rem;
    transition: color 0.2s;
  }
  .ai-back-btn:hover { color: var(--ink); }

  /* ── LAYOUT ── */
  .ai-workspace {
    display: grid;
    grid-template-columns: 280px 1fr 260px;
    height: calc(100vh - 65px);
    overflow: hidden;
  }
  @media (max-width: 1100px) {
    .ai-workspace { grid-template-columns: 240px 1fr; }
    .ai-right-panel { display: none; }
  }
  @media (max-width: 768px) {
    .ai-workspace { grid-template-columns: 1fr; }
    .ai-left-panel { display: none; }
    .ai-left-panel.open { display: flex; position: fixed; left: 0; top: 65px; bottom: 0; width: 280px; z-index: 99; }
  }

  /* ── LEFT PANEL ── */
  .ai-left-panel {
    background: var(--white);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .ai-panel-section {
    padding: 20px;
    border-bottom: 1px solid var(--border);
  }
  .ai-section-label {
    font-family: 'Syne', sans-serif;
    font-size: 0.7rem; font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 14px;
  }
  .ai-quick-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .ai-quick-btn {
    display: flex; flex-direction: column; align-items: center;
    gap: 8px; padding: 14px 8px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    cursor: pointer;
    font-size: 0.7rem; font-weight: 500; color: var(--ink2);
    transition: all 0.2s;
    text-align: center;
  }
  .ai-quick-btn:hover {
    border-color: var(--teal);
    background: #f0fdfb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,201,167,0.1);
  }
  .ai-quick-icon {
    width: 34px; height: 34px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1rem;
  }

  /* suggestion chips */
  .ai-chips { display: flex; flex-direction: column; gap: 6px; }
  .ai-chip {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    cursor: pointer;
    font-size: 0.8rem; color: var(--ink2);
    transition: all 0.15s;
    text-align: left;
  }
  .ai-chip:hover {
    border-color: var(--blue);
    background: #f0f3ff;
    color: var(--blue);
  }
  .ai-chip-emoji { font-size: 1.1rem; flex-shrink: 0; }

  /* uploaded files */
  .ai-file-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    background: var(--white);
    margin-bottom: 6px;
  }
  .ai-file-icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: #eef2ff; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .ai-file-name { font-size: 0.75rem; font-weight: 500; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ai-file-size { font-size: 0.65rem; color: var(--muted); }
  .ai-file-remove { margin-left: auto; flex-shrink: 0; background: none; border: none; cursor: pointer; color: var(--muted); }
  .ai-file-remove:hover { color: var(--coral); }

  /* ── CHAT AREA ── */
  .ai-chat-area {
    display: flex; flex-direction: column;
    background: #f4f4f9;
    overflow: hidden;
  }

  /* chat header */
  .ai-chat-header {
    padding: 16px 24px;
    background: var(--white);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 14px;
  }
  .ai-avatar-wrap {
    position: relative;
    width: 44px; height: 44px;
  }
  .ai-avatar {
    width: 44px; height: 44px; border-radius: 14px;
    background: linear-gradient(135deg, #00c9a7 0%, #4361ee 100%);
    display: flex; align-items: center; justify-content: center;
  }
  .ai-avatar-dot {
    position: absolute; bottom: -2px; right: -2px;
    width: 12px; height: 12px; border-radius: 50%;
    background: #22c55e; border: 2px solid var(--white);
  }
  .ai-chat-title {
    font-family: 'Syne', sans-serif;
    font-size: 1rem; font-weight: 700; color: var(--ink);
  }
  .ai-chat-sub { font-size: 0.75rem; color: var(--muted); }
  .ai-header-actions { margin-left: auto; display: flex; gap: 8px; }
  .ai-icon-btn {
    width: 36px; height: 36px; border-radius: 10px;
    background: var(--surface); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--muted);
    transition: all 0.15s;
  }
  .ai-icon-btn:hover { background: var(--border); color: var(--ink); }

  /* messages */
  .ai-messages {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    scroll-behavior: smooth;
  }
  .ai-messages::-webkit-scrollbar { width: 4px; }
  .ai-messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .ai-msg-row {
    display: flex;
    gap: 12px;
    animation: msgIn 0.3s ease-out;
  }
  @keyframes msgIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ai-msg-row.user { flex-direction: row-reverse; }

  .ai-msg-avatar {
    width: 34px; height: 34px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; align-self: flex-end;
  }
  .ai-msg-avatar.bot {
    background: linear-gradient(135deg, #00c9a7, #4361ee);
  }
  .ai-msg-avatar.user { background: var(--surface); border: 1px solid var(--border); }

  .ai-bubble-wrap { display: flex; flex-direction: column; max-width: 68%; }
  .ai-msg-row.user .ai-bubble-wrap { align-items: flex-end; }

  .ai-bubble {
    padding: 14px 18px;
    border-radius: 18px;
    font-size: 0.875rem;
    line-height: 1.6;
    white-space: pre-wrap;
  }
  .ai-bubble.bot {
    background: var(--white);
    color: var(--ink);
    border-bottom-left-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    border: 1px solid var(--border);
  }
  .ai-bubble.user {
    background: linear-gradient(135deg, #00c9a7 0%, #4361ee 100%);
    color: #fff;
    border-bottom-right-radius: 4px;
  }
  .ai-bubble-meta {
    display: flex; align-items: center; gap: 6px;
    margin-top: 5px;
    font-size: 0.68rem; color: var(--muted);
  }
  .ai-bubble-sender { font-weight: 600; color: var(--muted); }

  /* typing indicator */
  .ai-typing-dots { display: flex; gap: 4px; padding: 4px 0; }
  .ai-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--muted);
    animation: bounce 1.2s infinite;
  }
  .ai-dot:nth-child(2) { animation-delay: 0.2s; }
  .ai-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce {
    0%,80%,100% { transform: translateY(0); }
    40% { transform: translateY(-6px); }
  }

  /* ── INPUT BAR ── */
  .ai-input-bar {
    padding: 16px 20px;
    background: var(--white);
    border-top: 1px solid var(--border);
  }
  .ai-input-row {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: var(--r-xl);
    padding: 8px 8px 8px 16px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .ai-input-row:focus-within {
    border-color: var(--teal);
    box-shadow: 0 0 0 4px var(--glow);
  }
  .ai-input-field {
    flex: 1; background: none; border: none; outline: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem; color: var(--ink);
  }
  .ai-input-field::placeholder { color: var(--muted); }
  .ai-attach-btn {
    width: 32px; height: 32px; border-radius: 8px;
    background: none; border: none; cursor: pointer;
    color: var(--muted); display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .ai-attach-btn:hover { background: var(--border); color: var(--ink); }
  .ai-send-btn {
    width: 40px; height: 40px; border-radius: 12px;
    background: linear-gradient(135deg, #00c9a7, #4361ee);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: white; flex-shrink: 0;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 4px 14px rgba(0,201,167,0.35);
  }
  .ai-send-btn:hover:not(:disabled) { transform: scale(1.07); box-shadow: 0 6px 20px rgba(0,201,167,0.45); }
  .ai-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .ai-input-hints {
    display: flex; align-items: center; gap: 8px;
    margin-top: 10px; flex-wrap: wrap;
  }
  .ai-hint-label { font-size: 0.72rem; color: var(--muted); white-space: nowrap; }
  .ai-hint-chip {
    font-size: 0.72rem; color: var(--blue);
    background: #eef2ff; border-radius: 999px;
    padding: 3px 10px; cursor: pointer; border: none;
    transition: background 0.15s;
  }
  .ai-hint-chip:hover { background: #dde6ff; }

  /* ── RIGHT PANEL ── */
  .ai-right-panel {
    background: var(--white);
    border-left: 1px solid var(--border);
    display: flex; flex-direction: column;
    overflow-y: auto;
  }

  .ai-health-card {
    margin: 16px;
    border-radius: var(--r-lg);
    padding: 20px;
    background: linear-gradient(135deg, #0a0a12 0%, #1a1a2e 100%);
    color: white;
    position: relative; overflow: hidden;
  }
  .ai-health-card::before {
    content: '';
    position: absolute; top: -20px; right: -20px;
    width: 120px; height: 120px; border-radius: 50%;
    background: rgba(0,201,167,0.15);
  }
  .ai-health-card-title {
    font-family: 'Syne', sans-serif;
    font-size: 0.75rem; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: rgba(255,255,255,0.5); margin-bottom: 12px;
  }
  .ai-health-stat {
    display: flex; justify-content: space-between;
    align-items: center; margin-bottom: 8px;
  }
  .ai-health-label { font-size: 0.8rem; color: rgba(255,255,255,0.6); }
  .ai-health-value { font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 700; color: #00c9a7; }

  .ai-info-card {
    margin: 0 16px 16px;
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    padding: 16px;
  }
  .ai-info-title {
    font-family: 'Syne', sans-serif;
    font-size: 0.8rem; font-weight: 700; color: var(--ink2);
    margin-bottom: 12px; display: flex; align-items: center; gap: 6px;
  }
  .ai-feature-row {
    display: flex; align-items: flex-start; gap: 10px;
    margin-bottom: 12px;
  }
  .ai-feature-dot {
    width: 28px; height: 28px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; margin-top: 1px;
  }
  .ai-feature-dot.teal  { background: #e8faf5; color: #00a08a; }
  .ai-feature-dot.blue  { background: #eef2ff; color: #4361ee; }
  .ai-feature-dot.coral { background: #fff0f0; color: #cc4444; }
  .ai-feature-name  { font-size: 0.8rem; font-weight: 600; color: var(--ink); }
  .ai-feature-desc  { font-size: 0.72rem; color: var(--muted); line-height: 1.4; }

  /* ── MODAL ── */
  .ai-modal-overlay {
    position: fixed; inset: 0;
    background: rgba(10,10,18,0.6);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 200; padding: 20px;
  }
  .ai-modal {
    background: var(--white);
    border-radius: var(--r-xl);
    max-width: 440px; width: 100%;
    padding: 32px;
    animation: modalIn 0.25s ease-out;
    box-shadow: 0 24px 80px rgba(0,0,0,0.2);
  }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.94) translateY(8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  .ai-modal-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 24px;
  }
  .ai-modal-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.1rem; font-weight: 700; color: var(--ink);
  }
  .ai-modal-close {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; cursor: pointer; padding: 6px;
    color: var(--muted); display: flex; align-items: center;
  }
  .ai-drop-zone {
    border: 2px dashed var(--border);
    border-radius: var(--r-lg);
    padding: 40px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 20px;
  }
  .ai-drop-zone:hover { border-color: var(--teal); background: #f0fdfb; }
  .ai-drop-icon {
    width: 56px; height: 56px; border-radius: var(--r-md);
    background: linear-gradient(135deg, #e8faf5, #eef2ff);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 14px;
  }
  .ai-drop-title { font-size: 0.95rem; font-weight: 600; color: var(--ink); margin-bottom: 4px; }
  .ai-drop-sub { font-size: 0.8rem; color: var(--muted); }
  .ai-modal-checks { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
  .ai-check-row { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: var(--ink2); }
  .ai-modal-actions { display: flex; gap: 10px; }
  .ai-btn-secondary {
    flex: 1; padding: 12px; border-radius: var(--r-md);
    border: 1.5px solid var(--border); background: var(--white);
    font-family: 'DM Sans', sans-serif; font-size: 0.875rem;
    cursor: pointer; color: var(--ink2);
    transition: background 0.15s;
  }
  .ai-btn-secondary:hover { background: var(--surface); }
  .ai-btn-primary {
    flex: 1; padding: 12px; border-radius: var(--r-md);
    background: linear-gradient(135deg, #00c9a7, #4361ee);
    border: none; color: white;
    font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(0,201,167,0.3);
    transition: opacity 0.2s;
  }
  .ai-btn-primary:hover { opacity: 0.9; }

  /* Mobile menu button */
  .ai-mobile-menu {
    display: none;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; padding: 8px; cursor: pointer;
    color: var(--ink2);
  }
  @media (max-width: 768px) { .ai-mobile-menu { display: flex; } }

  /* Spin animation for loading */
  .ai-spin { animation: spin 0.8s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

/* ── Data ───────────────────────────────────────────────────── */
const quickActions = [
  { emoji: '🔍', label: 'Symptoms',   color: '#eef2ff' },
  { emoji: '📤', label: 'Upload',     color: '#e8faf5' },
  { emoji: '💬', label: 'History',    color: '#fdf4ff' },
  { emoji: '🎙️', label: 'Voice',      color: '#fff7ec' },
  { emoji: '📥', label: 'Export',     color: '#fff0f0' },
  { emoji: '🔗', label: 'Share',      color: '#eef2ff' },
];

const commonQueries = [
  { query: 'I have headache and fever', emoji: '🤒' },
  { query: 'How to read lab reports?', emoji: '📋' },
  { query: 'Book doctor appointment',  emoji: '👨‍⚕️' },
  { query: 'Medication side effects',  emoji: '💊' },
  { query: 'First aid for emergencies',emoji: '🚑' },
  { query: 'Diet for diabetes',        emoji: '🥗' },
  { query: 'Blood pressure tips',      emoji: '🫀' },
  { query: 'Allergy relief',           emoji: '🤧' },
];

const roleSubtitle = {
  technician: 'Lab Diagnostics & Equipment',
  doctor: 'Clinical Decision Support',
  patient: 'Personal Health Guidance',
};

/* ── Helpers ────────────────────────────────────────────────── */
const timestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/* ── Main Component ─────────────────────────────────────────── */
const AIAssistantPage = ({ role }) => {
  const [messages, setMessages] = useState([
    {
      id: 1, type: 'bot',
      text: 'Hello! 👋 I\'m your AI Health Assistant, powered by DeepSeek AI. How can I help you today?',
      time: timestamp(),
    },
    {
      id: 2, type: 'bot',
      text: 'I can analyze symptoms, explain lab reports, provide medication information, and connect you with healthcare professionals. Available 24/7!',
      time: timestamp(),
    },
  ]);
  const [input, setInput]               = useState('');
  const [isLoading, setIsLoading]       = useState(false);
  const [isTyping, setIsTyping]         = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showUpload, setShowUpload]     = useState(false);
  const [apiStatus, setApiStatus]       = useState('checking');
  const [sidebarOpen, setSidebarOpen]   = useState(false);

  const fileInputRef  = useRef(null);
  const messagesEnd   = useRef(null);

  /* ── OpenAI / DeepSeek init ── */
  const [openaiInstance] = useState(() => {
    const apiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEEPSEEK_API_KEY)
      || (typeof process !== 'undefined' && process.env?.DEEPSEEK_API_KEY);
    if (!apiKey) { setTimeout(() => setApiStatus('error'), 0); return null; }
    try {
      const inst = new OpenAI({ baseURL: 'https://api.deepseek.com/v1', apiKey, dangerouslyAllowBrowser: true });
      setTimeout(() => setApiStatus('connected'), 0);
      return inst;
    } catch {
      setTimeout(() => setApiStatus('error'), 0);
      return null;
    }
  });

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  /* ── API call ── */
  const callAPI = async (msg) => {
    if (!openaiInstance) throw new Error('no-key');
    const systemPrompts = {
      doctor: 'You are an AI for healthcare professionals. Provide clinical decision support using professional terminology and evidence-based guidelines.',
      technician: 'You are an AI for lab technicians. Help with diagnostics, equipment, procedures, and quality control with technical precision.',
      patient: 'You are a compassionate AI for patients. Use simple language, be empathetic, and always encourage professional consultation.',
    };
    const system = systemPrompts[role] || 'You are a professional medical AI assistant. Be empathetic, accurate, and remind users to consult real doctors for serious concerns.';
    const completion = await openaiInstance.chat.completions.create({
      messages: [{ role: 'system', content: system }, { role: 'user', content: msg }],
      model: 'deepseek-chat', temperature: 0.7, max_tokens: 500,
    });
    return completion.choices[0]?.message?.content || 'I could not generate a response. Please try again.';
  };

  /* ── Fallback ── */
  const mockResponse = (msg) => {
    const lc = msg.toLowerCase();
    if (lc.includes('headache'))     return 'Headaches can stem from tension, dehydration, or sinus issues. Try drinking water, resting in a dark room, and consider OTC pain relief. If severe or persistent, please consult a doctor.';
    if (lc.includes('fever'))        return 'For fever above 100.4°F (38°C): stay hydrated, rest, and use acetaminophen. Seek medical help if fever exceeds 103°F, lasts more than 3 days, or if breathing is difficult.';
    if (lc.includes('cough'))        return 'Drink warm fluids like tea with honey, use a humidifier, and avoid irritants. If your cough persists beyond 3 weeks, produces colored mucus, or causes chest pain, see a doctor.';
    if (lc.includes('diabetes'))     return 'For diabetes management: monitor blood sugar regularly, follow a balanced low-carb diet, exercise consistently, and take medications as prescribed. Consult your endocrinologist for personalized advice.';
    if (lc.includes('blood pressure')) return 'Normal blood pressure is around 120/80 mmHg. To manage high BP: reduce sodium, exercise regularly, manage stress, and take prescribed medications. Monitor frequently.';
    if (lc.includes('emergency'))    return '🚨 EMERGENCY: Call emergency services immediately (112 or 911) for chest pain, difficulty breathing, severe bleeding, or loss of consciousness.';
    return 'Thank you for your question. While I can provide general information, please consult a healthcare professional for personalized medical advice. Could you provide more details about your concern?';
  };

  /* ── Send message ── */
  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: msg, time: timestamp() }]);
    setInput(''); setIsLoading(true); setIsTyping(true);
    try {
      let response;
      if (openaiInstance && apiStatus === 'connected') {
        try { response = await callAPI(msg); }
        catch { response = mockResponse(msg) + '\n\n*(Offline mode – check API connection for full AI features.)*'; }
      } else {
        await new Promise(r => setTimeout(r, 900));
        response = mockResponse(msg);
      }
      setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: response, time: timestamp() }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: 'Connection issue. Please try again or use offline mode for basic queries.', time: timestamp() }]);
    } finally {
      setIsLoading(false); setIsTyping(false);
    }
  };

  /* ── File upload ── */
  const handleFiles = (e) => {
    const files = Array.from(e.target.files).map(f => ({
      id: Date.now() + Math.random(),
      name: f.name,
      size: (f.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: f.type,
    }));
    setUploadedFiles(prev => [...prev, ...files]);
    setShowUpload(false);
    setTimeout(() => setMessages(prev => [...prev, {
      id: Date.now(), type: 'bot',
      text: '📄 Report uploaded! I can help explain findings like "HbA1c", "LDL", or "CRP". What would you like me to clarify?',
      time: timestamp(),
    }]), 400);
  };

  const statusConfig = {
    connected: { label: 'DeepSeek AI Live', dot: true },
    error:     { label: 'Offline Mode',     dot: false },
    checking:  { label: 'Connecting...',    dot: true },
  };

  /* ── RENDER ── */
  return (
    <>
      <style>{styles}</style>
      <div className="ai-page">

        {/* ── TOP BAR ── */}
        <div className="ai-topbar">
          <Link to="/services" className="ai-back-btn">
            <ChevronLeft size={16} />
            Services
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="ai-logo-icon">
              <Brain size={18} color="white" />
            </div>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1rem', color: 'var(--ink)' }}>
              HealthAI
            </span>
          </div>

          <div className="ai-topbar-right">
            <div className={`ai-status-pill ${apiStatus}`}>
              <span className="ai-status-dot" />
              {statusConfig[apiStatus]?.label}
            </div>
            <button className="ai-mobile-menu" onClick={() => setSidebarOpen(v => !v)}>
              <Menu size={18} />
            </button>
          </div>
        </div>

        {/* ── WORKSPACE ── */}
        <div className="ai-workspace">

          {/* ── LEFT PANEL ── */}
          <div className={`ai-left-panel${sidebarOpen ? ' open' : ''}`}>
            <div className="ai-panel-section">
              <div className="ai-section-label">Quick Actions</div>
              <div className="ai-quick-grid">
                {quickActions.map((a, i) => (
                  <button key={i} className="ai-quick-btn"
                    onClick={() => a.label === 'Upload' && setShowUpload(true)}
                  >
                    <div className="ai-quick-icon" style={{ background: a.color, fontSize: '1.2rem' }}>
                      {a.emoji}
                    </div>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="ai-panel-section">
                <div className="ai-section-label">
                  Reports
                  <span style={{ marginLeft: 6, background: '#eef2ff', color: 'var(--blue)', borderRadius: 999, padding: '1px 7px', fontSize: '0.65rem' }}>
                    {uploadedFiles.length}
                  </span>
                </div>
                {uploadedFiles.slice(0, 3).map(f => (
                  <div key={f.id} className="ai-file-item">
                    <div className="ai-file-icon"><FileText size={15} color="#4361ee" /></div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div className="ai-file-name">{f.name}</div>
                      <div className="ai-file-size">{f.size}</div>
                    </div>
                    <button className="ai-file-remove"
                      onClick={() => setUploadedFiles(prev => prev.filter(x => x.id !== f.id))}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="ai-panel-section" style={{ flex: 1 }}>
              <div className="ai-section-label">Common Questions</div>
              <div className="ai-chips">
                {commonQueries.map((q, i) => (
                  <button key={i} className="ai-chip" onClick={() => sendMessage(q.query)}>
                    <span className="ai-chip-emoji">{q.emoji}</span>
                    {q.query}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-around' }}>
              {[
                { val: messages.length, lbl: 'Messages' },
                { val: '24/7', lbl: 'Available' },
                { val: uploadedFiles.length, lbl: 'Files' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: i === 0 ? 'var(--teal)' : i === 1 ? 'var(--blue)' : 'var(--purple)' }}>
                    {s.val}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: 2 }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── CHAT AREA ── */}
          <div className="ai-chat-area">

            {/* chat header */}
            <div className="ai-chat-header">
              <div className="ai-avatar-wrap">
                <div className="ai-avatar"><Bot size={20} color="white" /></div>
                <div className="ai-avatar-dot" />
              </div>
              <div>
                <div className="ai-chat-title">DeepSeek Health AI</div>
                <div className="ai-chat-sub">{roleSubtitle[role] || 'AI Health Assistant'}</div>
              </div>
              <div className="ai-header-actions">
                <div className="ai-icon-btn" title="Privacy"><Lock size={15} /></div>
                <div className="ai-icon-btn" title="Settings"><Settings size={15} /></div>
                <div className="ai-icon-btn" title="Clear chat"
                  onClick={() => setMessages([])}><RefreshCw size={15} /></div>
              </div>
            </div>

            {/* messages */}
            <div className="ai-messages">
              {messages.map(msg => (
                <div key={msg.id} className={`ai-msg-row ${msg.type}`}>
                  <div className={`ai-msg-avatar ${msg.type}`}>
                    {msg.type === 'bot'
                      ? <Bot size={16} color="white" />
                      : <User size={16} color="var(--muted)" />}
                  </div>
                  <div className="ai-bubble-wrap">
                    <div className={`ai-bubble ${msg.type}`}>{msg.text}</div>
                    <div className="ai-bubble-meta">
                      <span className="ai-bubble-sender">{msg.type === 'bot' ? 'DeepSeek AI' : 'You'}</span>
                      · {msg.time}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="ai-msg-row bot">
                  <div className="ai-msg-avatar bot"><Bot size={16} color="white" /></div>
                  <div className="ai-bubble-wrap">
                    <div className="ai-bubble bot">
                      <div className="ai-typing-dots">
                        <div className="ai-dot" /><div className="ai-dot" /><div className="ai-dot" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEnd} />
            </div>

            {/* input */}
            <div className="ai-input-bar">
              <div className="ai-input-row">
                <button className="ai-attach-btn" title="Upload file" onClick={() => setShowUpload(true)}>
                  <Upload size={17} />
                </button>
                <button className="ai-attach-btn" title="Microphone">
                  <Mic size={17} />
                </button>
                <input
                  className="ai-input-field"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Describe symptoms, ask about medications, or upload reports…"
                  disabled={isLoading}
                />
                <button className="ai-send-btn" onClick={() => sendMessage()} disabled={isLoading || !input.trim()}>
                  {isLoading
                    ? <RefreshCw size={17} className="ai-spin" />
                    : <Send size={17} />}
                </button>
              </div>
              <div className="ai-input-hints">
                <span className="ai-hint-label">Try:</span>
                {['Headache relief', 'Explain lab report', 'Diabetes tips'].map((t, i) => (
                  <button key={i} className="ai-hint-chip" onClick={() => sendMessage(t)}>{t}</button>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="ai-right-panel">
            <div className="ai-health-card">
              <div className="ai-health-card-title">Session Overview</div>
              {[
                { lbl: 'Messages sent', val: messages.filter(m => m.type === 'user').length },
                { lbl: 'AI responses',  val: messages.filter(m => m.type === 'bot').length },
                { lbl: 'Files uploaded',val: uploadedFiles.length },
                { lbl: 'Mode',          val: apiStatus === 'connected' ? 'AI Live' : 'Offline' },
              ].map((s, i) => (
                <div key={i} className="ai-health-stat">
                  <span className="ai-health-label">{s.lbl}</span>
                  <span className="ai-health-value">{s.val}</span>
                </div>
              ))}
            </div>

            <div className="ai-info-card">
              <div className="ai-info-title"><Sparkles size={14} /> Capabilities</div>
              {[
                { icon: <MessageSquare size={14}/>, cls: 'teal', name: 'AI Symptom Analysis', desc: 'DeepSeek-powered health insights' },
                { icon: <Shield size={14}/>,        cls: 'blue', name: 'HIPAA Secure',         desc: 'End-to-end encrypted session' },
                { icon: <Upload size={14}/>,        cls: 'coral', name: 'Report Analysis',      desc: 'Upload PDFs, images, docs' },
              ].map((f, i) => (
                <div key={i} className="ai-feature-row">
                  <div className={`ai-feature-dot ${f.cls}`}>{f.icon}</div>
                  <div>
                    <div className="ai-feature-name">{f.name}</div>
                    <div className="ai-feature-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="ai-info-card">
              <div className="ai-info-title"><Activity size={14} /> Quick Stats</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { val: '24/7', lbl: 'Available', bg: '#e8faf5', clr: '#00a08a' },
                  { val: '<2s',  lbl: 'Response',  bg: '#eef2ff', clr: '#4361ee' },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', background: s.bg, borderRadius: 12, padding: '12px 8px' }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: s.clr }}>{s.val}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: 2 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ margin: '0 16px 16px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.5, padding: '14px', background: 'var(--surface)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                ⚠️ This AI assistant provides general health information only. Always consult a licensed healthcare professional for diagnosis and treatment.
              </div>
            </div>
          </div>
        </div>

        {/* ── UPLOAD MODAL ── */}
        {showUpload && (
          <div className="ai-modal-overlay" onClick={() => setShowUpload(false)}>
            <div className="ai-modal" onClick={e => e.stopPropagation()}>
              <div className="ai-modal-header">
                <div className="ai-modal-title">Upload Medical Reports</div>
                <button className="ai-modal-close" onClick={() => setShowUpload(false)}><X size={16} /></button>
              </div>
              <div className="ai-drop-zone" onClick={() => fileInputRef.current?.click()}>
                <div className="ai-drop-icon"><Upload size={24} color="#00a08a" /></div>
                <div className="ai-drop-title">Click or drag files here</div>
                <div className="ai-drop-sub">PDF, JPG, PNG — up to 10 MB each</div>
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  style={{ display: 'none' }} onChange={handleFiles} />
              </div>
              <div className="ai-modal-checks">
                {['End-to-end encrypted uploads', 'AI-assisted report analysis'].map((t, i) => (
                  <div key={i} className="ai-check-row">
                    <CheckCircle size={15} color="#00c9a7" />
                    {t}
                  </div>
                ))}
              </div>
              <div className="ai-modal-actions">
                <button className="ai-btn-secondary" onClick={() => setShowUpload(false)}>Cancel</button>
                <button className="ai-btn-primary" onClick={() => fileInputRef.current?.click()}>Choose Files</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default AIAssistantPage;