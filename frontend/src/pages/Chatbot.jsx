import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Send, Loader2, MessageCircle, Bot, User,
    Sparkles, ArrowLeft, TrendingUp, PiggyBank, Shield, HelpCircle,
    Globe, ExternalLink
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { chatbotService } from '../services/chatbotService';
import { authService } from '../services/authService';

const SUGGESTED_PROMPTS = [
    { icon: TrendingUp, text: "How can I improve my savings rate?", color: "text-emerald-600 bg-emerald-50" },
    { icon: PiggyBank, text: "Analyze my investment portfolio", color: "text-blue-600 bg-blue-50" },
    { icon: Shield, text: "Give me tax saving tips", color: "text-purple-600 bg-purple-50" },
    { icon: Globe, text: "What's happening in the market today?", color: "text-cyan-600 bg-cyan-50" },
    { icon: HelpCircle, text: "Am I on track for my financial goals?", color: "text-amber-600 bg-amber-50" },
    { icon: TrendingUp, text: "Best mutual funds to invest in right now?", color: "text-rose-600 bg-rose-50" },
];

const TypingIndicator = () => (
    <div className="flex items-start gap-3 mb-6">
        <div className="w-9 h-9 rounded-2xl bg-slate-900 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Bot className="w-5 h-5 text-white" />
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl rounded-tl-lg px-5 py-4 shadow-premium">
            <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
        </div>
    </div>
);

const ChatMessage = ({ message }) => {
    const isUser = message.role === 'user';

    // Markdown-like formatting for bot messages (with link + citation support)
    const formatContent = (text) => {
        if (isUser) return text;

        // Convert markdown links [text](url) to <a> tags
        const processLinks = (line) => {
            return line.replace(
                /\[([^\]]+)\]\(([^)]+)\)/g,
                '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-accent hover:text-accent-dark underline underline-offset-2 inline-flex items-center gap-0.5 font-semibold">$1 ↗</a>'
            );
        };

        return text.split('\n').map((line, i) => {
            // Horizontal rule (source separator)
            if (line.trim() === '---') {
                return <hr key={i} className="my-3 border-slate-200" />;
            }
            // Bold text
            line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Process markdown links
            line = processLinks(line);
            // Source header with 📌 emoji
            if (line.includes('📌')) {
                return <p key={i} className="mb-1 mt-2 text-xs font-black text-slate-400 uppercase tracking-wider" dangerouslySetInnerHTML={{ __html: line }} />;
            }
            // Bullet points
            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                return <li key={i} className="ml-4 mb-1" dangerouslySetInnerHTML={{ __html: line.replace(/^[\s]*[-*]\s/, '') }} />;
            }
            // Numbered lists
            if (/^\d+\.\s/.test(line.trim())) {
                return <li key={i} className="ml-4 mb-1 list-decimal" dangerouslySetInnerHTML={{ __html: line.replace(/^\d+\.\s/, '') }} />;
            }
            // Empty line = paragraph break
            if (line.trim() === '') return <br key={i} />;
            return <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: line }} />;
        });
    };

    return (
        <div className={`flex items-start gap-3 mb-6 ${isUser ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${isUser
                ? 'bg-accent shadow-accent/20'
                : 'bg-slate-900 shadow-primary/20'
                }`}>
                {isUser
                    ? <User className="w-5 h-5 text-white" />
                    : <Bot className="w-5 h-5 text-white" />
                }
            </div>

            {/* Message Bubble */}
            <div className={`max-w-[75%] px-5 py-4 text-sm leading-relaxed ${isUser
                ? 'bg-accent text-white rounded-3xl rounded-tr-lg shadow-lg shadow-accent/20'
                : 'bg-white text-slate-700 border border-slate-200 rounded-3xl rounded-tl-lg shadow-premium'
                }`}>
                {formatContent(message.content)}
            </div>
        </div>
    );
};

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const chatEndRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const sendMessage = async (text) => {
        if (!text.trim() || loading) return;

        const userMessage = { role: 'user', content: text.trim() };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setShowSuggestions(false);
        setLoading(true);

        try {
            const reply = await chatbotService.sendMessage(
                text.trim(),
                messages // Send existing history (before this message)
            );
            setMessages([...newMessages, { role: 'assistant', content: reply }]);
        } catch (err) {
            console.error('Chatbot error:', err);
            setMessages([
                ...newMessages,
                {
                    role: 'assistant',
                    content: "I'm sorry, I couldn't process your request right now. Please check your connection and try again.",
                },
            ]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />

            <main className="flex-1 lg:ml-72 flex flex-col h-screen">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 px-6 lg:px-12 py-5 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-all lg:hidden"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-black text-slate-900 leading-tight">Finance Advisor AI</h1>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                                    <span className="text-xs font-bold text-slate-400">Online • Powered by Gemini + Web Search</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1.5 bg-accent/10 rounded-full">
                            <span className="text-[10px] font-black text-accent uppercase tracking-widest">AI Advisor</span>
                        </div>
                    </div>
                </header>

                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto px-6 lg:px-12 py-8">
                    <div className="max-w-3xl mx-auto">
                        {/* Welcome message */}
                        {messages.length === 0 && (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 bg-slate-900 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/20">
                                    <Sparkles className="w-10 h-10 text-accent" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 mb-3">
                                    Your Personal Finance <span className="text-accent">Advisor</span>
                                </h2>
                                <p className="text-slate-500 font-medium max-w-md mx-auto mb-10 leading-relaxed">
                                    I have access to your financial profile, investments, goals,
                                    and <span className="text-accent font-bold">live market data</span>.
                                    Ask me anything about your finances or current market trends — I'll give you
                                    personalized advice backed by reliable sources.
                                </p>

                                {/* Suggested Prompts */}
                                {showSuggestions && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                                        {SUGGESTED_PROMPTS.map((prompt, i) => (
                                            <button
                                                key={i}
                                                onClick={() => sendMessage(prompt.text)}
                                                className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all text-left group"
                                            >
                                                <div className={`p-2 rounded-xl ${prompt.color} flex-shrink-0`}>
                                                    <prompt.icon className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                                                    {prompt.text}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Messages */}
                        {messages.map((msg, i) => (
                            <ChatMessage key={i} message={msg} />
                        ))}

                        {/* Typing indicator */}
                        {loading && <TypingIndicator />}

                        <div ref={chatEndRef} />
                    </div>
                </div>

                {/* Input Bar */}
                <div className="bg-white border-t border-slate-200 px-6 lg:px-12 py-5 flex-shrink-0">
                    <form
                        onSubmit={handleSubmit}
                        className="max-w-3xl mx-auto flex items-center gap-3"
                    >
                        <div className="flex-1 relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask about your finances..."
                                disabled={loading}
                                className="input-premium pr-4 py-4 text-sm"
                                id="chatbot-input"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className={`p-4 rounded-2xl transition-all flex items-center justify-center shadow-lg ${input.trim() && !loading
                                ? 'bg-accent text-white hover:bg-accent-dark shadow-accent/20 active:scale-95'
                                : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                                }`}
                            id="chatbot-send-btn"
                        >
                            {loading
                                ? <Loader2 className="w-5 h-5 animate-spin" />
                                : <Send className="w-5 h-5" />
                            }
                        </button>
                    </form>
                    <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-3">
                        AI-powered advice • Not a substitute for professional financial planning
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Chatbot;
