import { X, FileText, Bot } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

const SummaryModal = ({ isOpen, onClose, summary, docName, docId, onResummarize, isSummarizing }) => {
    const navigate = useNavigate();
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-[#0B0F19]/80 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-[#1D1B42]/95 border border-white/10 p-8 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                            <Bot className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-tight">AI Summary</h3>
                            <p className="text-sm text-gray-400 mt-0.5 truncate max-w-[300px]" title={docName}>{docName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-6 shadow-inner min-h-[150px]">
                    {summary ? (
                        <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-all">
                            {summary}
                        </p>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                            <FileText className="h-8 w-8 mb-3 opacity-50" />
                            <p>No summary available.</p>
                        </div>
                    )}
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                    <button 
                        onClick={() => {
                            onClose();
                            if (docId) {
                                navigate('/chat', { state: { docId } });
                            } else {
                                navigate('/chat');
                            }
                        }}
                        className="rounded-xl bg-purple-600/80 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-600 transition-all border border-purple-500/50 flex items-center gap-2"
                    >
                        <Bot className="h-4 w-4" />
                        Chat with Document
                    </button>
                    {onResummarize && (
                        <button 
                            onClick={onResummarize}
                            disabled={isSummarizing}
                            className="rounded-xl bg-indigo-600/80 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600 transition-all border border-indigo-500/50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSummarizing ? "Summarizing..." : "Re-summarize"}
                        </button>
                    )}
                    <button 
                        onClick={onClose}
                        className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-all border border-white/10"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SummaryModal;
