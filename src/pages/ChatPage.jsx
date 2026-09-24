import { useState, useEffect, useRef } from 'react';
import { 
    Send, Bot, FileText, Loader2, MessageSquare, Trash2, 
    Mic, MicOff, Volume2, VolumeX, Sparkles, Zap, Radio, 
    Activity
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const ChatPage = () => {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const location = useLocation();
    const [documents, setDocuments] = useState([]);
    const [selectedDocId, setSelectedDocId] = useState('');
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState(location.state?.question || '');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingHistory, setIsFetchingHistory] = useState(false);
    const [error, setError] = useState('');
    
    // Voice & Audio States
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [autoSpeak, setAutoSpeak] = useState(true);
    const [recognitionSupported, setRecognitionSupported] = useState(false);
    const [synthesisSupported, setSynthesisSupported] = useState(false);
    const [activeSpeakerMessageId, setActiveSpeakerMessageId] = useState(null);

    const avatarRef = useRef(null);
    const recognitionRef = useRef(null);
    const synthRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchDocuments();

        // Check speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            setRecognitionSupported(true);
            const recog = new SpeechRecognition();
            recog.continuous = false;
            recog.interimResults = false;
            recog.lang = 'en-US';

            recog.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                if (transcript) {
                    setInputValue(transcript);
                    // Automatically trigger send after voice recognition completes
                    sendMessageDirectly(transcript);
                }
                setIsListening(false);
            };

            recog.onerror = (err) => {
                console.error("Speech recognition error:", err);
                setIsListening(false);
            };

            recog.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recog;
        }

        // Check speech synthesis
        if ('speechSynthesis' in window) {
            setSynthesisSupported(true);
            synthRef.current = window.speechSynthesis;
        }

        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch(e) {}
            }
            if (synthRef.current) {
                try { synthRef.current.cancel(); } catch(e) {}
            }
        };
    }, []);

    useEffect(() => {
        if (location.state?.docId) {
            setSelectedDocId(location.state.docId);
        }
        if (location.state?.question) {
            setInputValue(location.state.question);
        }
    }, [location.state]);

    useEffect(() => {
        if (selectedDocId) {
            fetchChatHistory(selectedDocId);
        } else {
            setMessages([]);
        }
    }, [selectedDocId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const fetchDocuments = async () => {
        try {
            const response = await api.get('/documents');
            setDocuments(response.data);
            if (response.data.length > 0) {
                const targetId = (location.state?.docId && response.data.some(d => d.id === location.state.docId))
                    ? location.state.docId
                    : (selectedDocId && response.data.some(d => d.id === selectedDocId) ? selectedDocId : response.data[0].id);
                setSelectedDocId(targetId);
            }
        } catch (err) {
            setError("Failed to fetch documents");
        }
    };

    const fetchChatHistory = async (docId) => {
        try {
            setIsFetchingHistory(true);
            const response = await api.get(`/documents/${docId}/chat`);
            setMessages(response.data.map(m => ({
                id: m.id,
                role: m.role,
                content: m.content,
                createdAt: m.createdAt
            })));
        } catch (err) {
            console.error("Failed to load chat history", err);
        } finally {
            setIsFetchingHistory(false);
        }
    };

    const handleClearChat = async () => {
        if (!selectedDocId || messages.length === 0) return;
        if (!window.confirm("Are you sure you want to clear chat history for this document?")) return;
        try {
            stopSpeaking();
            await api.delete(`/documents/${selectedDocId}/chat`);
            setMessages([]);
        } catch (err) {
            console.error("Failed to clear chat history", err);
        }
    };

    // Voice Output (Text to Speech) with customized anime/bright pitch
    const speakText = (text, messageId = null) => {
        if (!synthRef.current || !synthesisSupported) return;
        
        synthRef.current.cancel();

        const cleanText = text.replace(/[*#_~`>]/g, '').trim();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        // Pick friendly female voice if available
        const voices = synthRef.current.getVoices();
        const femaleVoice = voices.find(v => 
            v.lang.startsWith('en') && (
                v.name.includes('Female') || 
                v.name.includes('Google UK English Female') || 
                v.name.includes('Zira') || 
                v.name.includes('Samantha') ||
                v.name.includes('Victoria')
            )
        ) || voices.find(v => v.lang.startsWith('en'));

        if (femaleVoice) {
            utterance.voice = femaleVoice;
        }

        // Higher pitch and brisk energetic cadence for anime persona
        utterance.pitch = 1.35;
        utterance.rate = 1.08;

        utterance.onstart = () => {
            setIsSpeaking(true);
            setActiveSpeakerMessageId(messageId);
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            setActiveSpeakerMessageId(null);
        };

        utterance.onerror = () => {
            setIsSpeaking(false);
            setActiveSpeakerMessageId(null);
        };

        synthRef.current.speak(utterance);
    };

    const stopSpeaking = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
            setActiveSpeakerMessageId(null);
        }
    };

    // Voice Input Toggle
    const toggleVoiceInput = () => {
        if (!recognitionSupported) {
            alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            stopSpeaking();
            try {
                recognitionRef.current?.start();
                setIsListening(true);
            } catch (err) {
                console.error("Voice start error", err);
                setIsListening(false);
            }
        }
    };

    const sendMessageDirectly = async (text) => {
        if (!text.trim() || !selectedDocId || isLoading) return;

        const userMsg = text.trim();
        setInputValue('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const response = await api.post(`/documents/${selectedDocId}/chat`, { question: userMsg });
            const aiAnswer = response.data.answer;
            const newAiMsg = { role: 'ai', content: aiAnswer, id: Date.now() };
            setMessages(prev => [...prev, newAiMsg]);

            if (autoSpeak) {
                speakText(aiAnswer, newAiMsg.id);
            }
        } catch (err) {
            console.error("Error asking question:", err);
            const errMsg = err.response?.data?.detail || "Sorry! I had an issue analyzing that document. Please try again.";
            setMessages(prev => [...prev, { role: 'ai', content: errMsg }]);
            if (autoSpeak) {
                speakText(errMsg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        sendMessageDirectly(inputValue);
    };

    const selectedDoc = documents.find(d => d.id === selectedDocId);

    return (
        <div className="flex flex-col h-full min-h-0 text-white w-full select-none">
            {/* Top Bar Header (Clean header without tagline as requested) */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
                <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.5)]">
                        <Sparkles className="h-6 w-6 text-white animate-spin-slow" />
                    </span>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2 drop-shadow">
                            <span className={isLight ? "text-slate-900 font-extrabold" : "text-white"}>
                                Aili 3D <span className={isLight ? "text-purple-700 font-black" : "bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent"}>Voice AI Companion</span>
                            </span>
                            <span className="inline-flex items-center gap-1 ml-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold tracking-wide">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                                ONLINE
                            </span>
                        </h2>
                    </div>
                </div>

                {/* Audio Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            if (isSpeaking) stopSpeaking();
                            setAutoSpeak(!autoSpeak);
                        }}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold backdrop-blur-md transition-all shadow-sm ${
                            autoSpeak 
                                ? (isLight ? 'bg-purple-100 border-purple-300 text-purple-900 shadow-sm' : 'bg-purple-600/30 border-purple-400/50 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.3)]')
                                : (isLight ? 'bg-white/80 border-slate-300 text-slate-700 hover:bg-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white')
                        }`}
                        title={autoSpeak ? "Auto-Voice Speak is ON" : "Auto-Voice Speak is MUTED"}
                    >
                        {autoSpeak ? <Volume2 className={`h-4 w-4 ${isLight ? "text-purple-700" : "text-pink-400"}`} /> : <VolumeX className="h-4 w-4" />}
                        <span>{autoSpeak ? "Voice On" : "Muted"}</span>
                    </button>

                    {isSpeaking && (
                        <button
                            onClick={stopSpeaking}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold animate-pulse ${
                                isLight 
                                    ? 'bg-rose-100 border-rose-300 text-rose-800' 
                                    : 'bg-pink-600/30 border-pink-500/50 text-pink-300'
                            }`}
                        >
                            <VolumeX className="h-3.5 w-3.5" />
                            Stop Voice
                        </button>
                    )}
                </div>
            </div>

            {/* Split Screen Layout: Realistic Standing AI Companion Stage + Cyber Chat */}
            <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-4 lg:gap-5 overflow-y-auto lg:overflow-hidden">
                {/* LEFT: Realistic Standing AI Companion Stage */}
                <div 
                    ref={avatarRef}
                    className="w-full lg:w-80 xl:w-96 flex flex-col items-center justify-between shrink-0 relative select-none pb-2 pt-1 max-h-[300px] sm:max-h-[380px] lg:max-h-none"
                >
                    {/* Sleek Minimal Status Badge (Compact so character's face is never covered) */}
                    <div className="relative z-20 flex items-center justify-between w-full px-3 py-1.5 rounded-full bg-[#181335]/75 border border-purple-400/30 backdrop-blur-md shadow-md mb-1 shrink-0">
                        <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${
                                isSpeaking ? 'bg-pink-400 animate-ping' : isListening ? 'bg-red-500 animate-ping' : 'bg-emerald-400'
                            }`}></span>
                            <span className="text-xs font-black tracking-wider uppercase bg-gradient-to-r from-pink-300 to-purple-200 bg-clip-text text-transparent">
                                Aili • AI Companion
                            </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isSpeaking 
                                ? 'bg-pink-500/30 text-pink-300 border border-pink-400/50' 
                                : isListening 
                                ? 'bg-red-500/30 text-red-300 border border-red-400/50' 
                                : isLoading
                                ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-400/50'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                        }`}>
                            {isSpeaking ? 'Speaking' : isListening ? 'Listening' : isLoading ? 'Thinking...' : 'Active'}
                        </span>
                    </div>

                    {/* Central Freestanding Realistic Character Stage */}
                    <div className="relative z-10 flex-1 flex flex-col items-center justify-end w-full min-h-[220px] sm:min-h-[280px] lg:min-h-[440px] overflow-visible">
                        
                        {/* Elegant Ambient Floor Glow & Base Pedestal */}
                        <div className="absolute bottom-1 inset-x-8 h-10 sm:h-12 pointer-events-none flex items-center justify-center">
                            <div className="absolute w-44 sm:w-56 h-10 sm:h-12 rounded-[50%] bg-gradient-to-r from-pink-500/20 via-purple-600/30 to-indigo-500/20 blur-md"></div>
                            <div className="absolute w-36 sm:w-44 h-4 sm:h-5 rounded-[50%] border border-purple-400/40 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.4)]"></div>
                        </div>

                        {/* Audio Wave Halo behind head/shoulders when speaking or listening */}
                        {(isSpeaking || isListening) && (
                            <div className="absolute top-6 sm:top-10 w-48 sm:w-64 h-48 sm:h-64 rounded-full border-2 border-pink-400/40 radar-ring pointer-events-none"></div>
                        )}
                        {isSpeaking && (
                            <div className="absolute top-10 sm:top-14 w-36 sm:w-52 h-36 sm:h-52 rounded-full border border-purple-400/50 radar-ring pointer-events-none" style={{ animationDelay: '0.7s' }}></div>
                        )}

                        {/* Professional 3D Stylized Character Graphic */}
                        <div className="relative w-full h-full flex items-end justify-center pb-2">
                            <img 
                                src="/aili_professional_standing.png" 
                                alt="Aili 3D AI Companion" 
                                onError={(e) => {
                                    e.target.src = "/aili_realistic_3d.png";
                                }}
                                className={`h-[200px] sm:h-[280px] lg:h-[400px] xl:h-[460px] w-auto max-w-full object-contain pointer-events-none transition-all duration-300 ${
                                    isSpeaking 
                                        ? 'standing-character-speaking' 
                                        : isListening 
                                        ? 'standing-character-listening' 
                                        : isLoading
                                        ? 'standing-character-thinking'
                                        : 'standing-character-idle'
                                }`}
                            />
                        </div>
                    </div>

                    {/* Stage Foot Controls: Voice Interaction Mic + Live State */}
                    <div className="relative z-20 w-full mt-2 flex flex-col items-center">
                        <button
                            onClick={toggleVoiceInput}
                            disabled={!selectedDocId || isLoading}
                            className={`p-4 rounded-full border-2 transition-all flex items-center justify-center shadow-2xl disabled:opacity-40 disabled:cursor-not-allowed group hover:scale-105 active:scale-95 ${
                                isListening
                                    ? 'bg-red-500 border-red-200 text-white shadow-[0_0_35px_rgba(239,68,68,0.9)] scale-110 animate-pulse'
                                    : 'bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 border-pink-300/60 text-white shadow-[0_0_30px_rgba(219,39,119,0.55)]'
                            }`}
                            title={isListening ? "Listening... click to send" : "Tap to speak directly to Aili"}
                        >
                            {isListening ? (
                                <MicOff className="h-6 w-6 animate-pulse" />
                            ) : (
                                <Mic className="h-6 w-6 text-white" />
                            )}
                        </button>
                        <p className="text-xs font-bold text-purple-200 mt-2 tracking-wide flex items-center gap-1.5 drop-shadow">
                            {isListening ? (
                                <span className="text-red-300 font-extrabold flex items-center gap-1 animate-pulse">
                                    <span className="h-2 w-2 rounded-full bg-red-400"></span> Listening to your voice...
                                </span>
                            ) : isSpeaking ? (
                                <span className="text-pink-300 font-semibold flex items-center gap-1">
                                    <Volume2 className="h-3.5 w-3.5 animate-bounce" /> Aili is speaking...
                                </span>
                            ) : (
                                <span className="text-purple-300/80 text-[11px]">Tap mic to speak with Aili</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* RIGHT: High-Tech Anime Message Terminal */}
                <div className="flex-1 flex flex-col bg-[#141130]/80 border border-purple-500/25 rounded-3xl backdrop-blur-2xl shadow-2xl overflow-hidden min-h-0 relative">
                    
                    {/* Terminal Top Control Bar */}
                    <div className="p-4 border-b border-purple-500/20 flex flex-wrap items-center justify-between gap-3 bg-purple-950/30 shrink-0">
                        {/* Document Selector */}
                        <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-md bg-[#19153a] border border-purple-500/30 rounded-2xl px-4 py-2 backdrop-blur-md shadow-inner">
                            <FileText className="h-5 w-5 text-pink-400 shrink-0" />
                            <div className="flex-1 flex flex-col min-w-0">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-purple-300">Active Document</span>
                                <select 
                                    value={selectedDocId} 
                                    onChange={(e) => setSelectedDocId(e.target.value)}
                                    className="w-full bg-transparent text-white font-semibold text-xs md:text-sm outline-none cursor-pointer pr-4 focus:ring-0 truncate"
                                >
                                    {documents.length === 0 && <option value="" className="bg-[#19153a] text-white">No documents uploaded yet</option>}
                                    {documents.map(doc => (
                                        <option key={doc.id} value={doc.id} className="bg-[#19153a] text-white">{doc.filename}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Clear & Voice Toggle Controls */}
                        <div className="flex items-center gap-2">
                            {messages.length > 0 && (
                                <button
                                    onClick={handleClearChat}
                                    title="Clear chat history"
                                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 px-3 py-2 rounded-xl border border-white/10 hover:border-red-400/30 hover:bg-white/5 transition-all"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Clear History</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent">
                        {isFetchingHistory ? (
                            <div className="h-full flex flex-col items-center justify-center text-purple-300 gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-pink-400" />
                                <p className="text-xs font-semibold tracking-wider">Synchronizing Neural Records...</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-purple-200/70 p-6 text-center">
                                <div className="h-20 w-20 rounded-3xl bg-gradient-to-tr from-pink-500/20 to-purple-600/20 border border-pink-400/30 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(236,72,153,0.3)]">
                                    <Sparkles className="h-10 w-10 text-pink-400 animate-pulse" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">Hi, I&apos;m Aili 👋</h3>
                                <p className="text-xs md:text-sm max-w-md text-purple-200/80 mb-4">
                                    I&apos;m your 3D AI companion. Ask me any question using text or your voice microphone, and I&apos;ll read through your document and answer back!
                                </p>
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-pink-300">
                                        &quot;Summarize the main goal&quot;
                                    </span>
                                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-purple-300">
                                        &quot;What are the key dates?&quot;
                                    </span>
                                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-indigo-300">
                                        &quot;Who is the author?&quot;
                                    </span>
                                </div>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div 
                                    key={idx} 
                                    className={`flex gap-3 md:gap-4 items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {/* AI Avatar Icon on AI messages */}
                                    {msg.role === 'ai' && (
                                        <div className="h-9 w-9 rounded-2xl overflow-hidden border border-pink-400/40 shadow-[0_0_12px_rgba(236,72,153,0.4)] shrink-0 mt-0.5">
                                            <img src="/aili_avatar_crop.png" onError={(e) => { e.target.src = "/aili_professional_standing.png"; }} alt="Aili" className="w-full h-full object-cover" />
                                        </div>
                                    )}

                                    {/* Bubble */}
                                    <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-5 py-3.5 relative group shadow-lg ${
                                        msg.role === 'user' 
                                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none border border-purple-400/30' 
                                            : 'bg-[#1e1942]/90 text-purple-100 border border-purple-500/30 rounded-bl-none shadow-[0_4px_20px_rgba(0,0,0,0.25)]'
                                    }`}>
                                        <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-words select-text">
                                            {msg.content}
                                        </p>

                                        {/* Speaker Re-play Button for AI Messages */}
                                        {msg.role === 'ai' && (
                                            <div className="mt-2 pt-2 border-t border-purple-500/20 flex items-center justify-between text-[11px] text-purple-300">
                                                <button
                                                    onClick={() => speakText(msg.content, msg.id || idx)}
                                                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 transition-colors"
                                                    title="Speak answer aloud"
                                                >
                                                    {activeSpeakerMessageId === (msg.id || idx) && isSpeaking ? (
                                                        <>
                                                            <VolumeX className="h-3 w-3 text-pink-400 animate-pulse" />
                                                            <span className="font-semibold text-pink-400">Playing voice...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Volume2 className="h-3 w-3" />
                                                            <span>Play Voice</span>
                                                        </>
                                                    )}
                                                </button>
                                                <span className="text-[10px] text-purple-400/60 font-mono">AILI-AI</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Loading Typing Indicator with Hologram Flair */}
                        {isLoading && (
                            <div className="flex gap-3 items-center justify-start">
                                <div className="h-9 w-9 rounded-2xl overflow-hidden border border-pink-400/40 shadow-[0_0_12px_rgba(236,72,153,0.4)] shrink-0">
                                    <img src="/aili_avatar_crop.png" onError={(e) => { e.target.src = "/aili_professional_standing.png"; }} alt="Aili" className="w-full h-full object-cover animate-pulse" />
                                </div>
                                <div className="bg-[#1e1942]/90 border border-purple-500/30 rounded-2xl rounded-bl-none px-5 py-3 flex items-center gap-3">
                                    <Loader2 className="h-4 w-4 text-pink-400 animate-spin" />
                                    <span className="text-xs font-semibold text-pink-200">
                                        Aili is analyzing document neural nodes...
                                    </span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Console with Voice & Send */}
                    <div className="p-4 border-t border-purple-500/20 bg-purple-950/40 shrink-0">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-3">
                            {/* Voice Button inline */}
                            <button
                                type="button"
                                onClick={toggleVoiceInput}
                                disabled={!selectedDocId || isLoading}
                                className={`p-3 rounded-2xl border transition-all flex items-center justify-center shrink-0 ${
                                    isListening
                                        ? 'bg-red-500 border-red-300 text-white shadow-[0_0_20px_rgba(239,68,68,0.7)] animate-pulse'
                                        : 'bg-pink-500/20 hover:bg-pink-500/30 border-pink-500/40 text-pink-300 hover:text-white'
                                }`}
                                title={isListening ? "Listening... click to stop" : "Speak your question"}
                            >
                                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                            </button>

                            {/* Text Input */}
                            <input 
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={
                                    isListening 
                                        ? "Listening to your voice... Speak now!" 
                                        : (selectedDocId ? "Type or voice your question to Aili..." : "Select a document to begin...")
                                }
                                disabled={!selectedDocId || isLoading}
                                className="flex-1 bg-[#19153a] border border-purple-500/30 rounded-2xl px-4 py-3 text-xs md:text-sm text-white placeholder:text-purple-300/50 focus:outline-none focus:border-pink-500/60 focus:ring-1 focus:ring-pink-500/60 disabled:opacity-50 transition-all shadow-inner"
                            />

                            {/* Send Submit Button */}
                            <button 
                                type="submit"
                                disabled={!inputValue.trim() || !selectedDocId || isLoading}
                                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white px-5 py-3 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(219,39,119,0.4)] hover:scale-105 active:scale-95"
                            >
                                <Send className="h-5 w-5" />
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ChatPage;
