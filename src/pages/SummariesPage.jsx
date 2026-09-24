import { useState, useEffect } from 'react';
import { 
    FileText, 
    Bot, 
    Loader2, 
    Copy, 
    Check, 
    RefreshCw, 
    MessageSquare, 
    Star, 
    File, 
    FileSpreadsheet, 
    FileIcon, 
    Calendar, 
    HardDrive,
    Sparkles,
    Lightbulb,
    Zap,
    Download,
    AlignLeft,
    Trash2,
    AlertTriangle,
    Eye
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import api from '../services/api';
import DocumentViewModal from '../components/DocumentViewModal';

const SummariesPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [documents, setDocuments] = useState([]);
    const [selectedDocId, setSelectedDocId] = useState('');
    const [activeTab, setActiveTab] = useState(location.state?.initialTab || 'summary'); // 'summary' | 'insights'
    const [summaryLength, setSummaryLength] = useState('medium'); // 'short' | 'medium' | 'long'
    const [loading, setLoading] = useState(true);
    const [resummarizing, setResummarizing] = useState(false);
    const [generatingInsights, setGeneratingInsights] = useState(false);
    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (location.state?.initialTab) {
            setActiveTab(location.state.initialTab);
        }
        if (location.state?.docId) {
            setSelectedDocId(location.state.docId);
        }
    }, [location.state]);

    useEffect(() => {
        fetchDocuments();
    }, [location.state?.docId]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await api.get('/documents');
            const allDocs = response.data;
            const summarizedDocs = allDocs.filter(d => d.summary || d.summaryShort || d.summaryMedium || d.summaryLong || d.keyInsights);

            summarizedDocs.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
            setDocuments(summarizedDocs);

            if (summarizedDocs.length > 0) {
                const targetId = (location.state?.docId && summarizedDocs.some(d => d.id === location.state.docId))
                    ? location.state.docId
                    : summarizedDocs[0].id;
                setSelectedDocId(targetId);
            }
        } catch (err) {
            console.error('Failed to fetch documents', err);
            setError('Failed to load documents. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const selectedDoc = documents.find(d => d.id === selectedDocId);

    // Get current summary text based strictly on selected length
    const getCurrentSummaryText = () => {
        if (!selectedDoc) return '';
        if (summaryLength === 'short') {
            return selectedDoc.summaryShort || '';
        } else if (summaryLength === 'long') {
            return selectedDoc.summaryLong || '';
        } else if (summaryLength === 'medium') {
            return selectedDoc.summaryMedium || '';
        }
        return '';
    };

    const handleCopy = () => {
        const textToCopy = activeTab === 'summary' ? getCurrentSummaryText() : selectedDoc?.keyInsights;
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!selectedDoc) return;
        const textContent = activeTab === 'summary' ? getCurrentSummaryText() : (selectedDoc.keyInsights || '');
        if (!textContent) return;

        setDownloading(true);
        try {
            const pdfDoc = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4'
            });

            const pageWidth = pdfDoc.internal.pageSize.getWidth();
            const pageHeight = pdfDoc.internal.pageSize.getHeight();
            const margin = 45;
            const contentWidth = pageWidth - (margin * 2);

            // Document Header / Branding
            pdfDoc.setFillColor(23, 21, 59); // Deep purple/navy accent (#17153B)
            pdfDoc.rect(0, 0, pageWidth, 55, 'F');

            pdfDoc.setFont('helvetica', 'bold');
            pdfDoc.setFontSize(16);
            pdfDoc.setTextColor(255, 255, 255);
            pdfDoc.text('DocuMind AI Summary', margin, 35);

            pdfDoc.setFont('helvetica', 'normal');
            pdfDoc.setFontSize(9);
            pdfDoc.setTextColor(200, 200, 230);
            const dateStr = new Date().toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            pdfDoc.text(`Generated: ${dateStr}`, pageWidth - margin, 35, { align: 'right' });

            // Metadata card section
            let currentY = 80;
            pdfDoc.setFillColor(245, 246, 250);
            pdfDoc.roundedRect(margin, currentY, contentWidth, 54, 6, 6, 'F');

            pdfDoc.setFont('helvetica', 'bold');
            pdfDoc.setFontSize(10);
            pdfDoc.setTextColor(70, 70, 90);
            pdfDoc.text('Document:', margin + 14, currentY + 20);
            pdfDoc.setFont('helvetica', 'normal');
            pdfDoc.setTextColor(20, 20, 30);
            const truncatedFilename = selectedDoc.filename.length > 55
                ? selectedDoc.filename.substring(0, 52) + '...'
                : selectedDoc.filename;
            pdfDoc.text(truncatedFilename, margin + 80, currentY + 20);

            pdfDoc.setFont('helvetica', 'bold');
            pdfDoc.setTextColor(70, 70, 90);
            pdfDoc.text('Summary Type:', margin + 14, currentY + 38);
            pdfDoc.setFont('helvetica', 'bold');
            pdfDoc.setTextColor(109, 40, 217); // purple accent
            const typeLabel = activeTab === 'summary' 
                ? `${summaryLength.toUpperCase()} SUMMARY (${summaryLength === 'short' ? '~120 words' : summaryLength === 'medium' ? '~250 words' : '~600 words'})`
                : 'KEY INSIGHTS';
            pdfDoc.text(typeLabel, margin + 98, currentY + 38);

            // Divider
            currentY += 72;
            pdfDoc.setDrawColor(220, 224, 235);
            pdfDoc.setLineWidth(1);
            pdfDoc.line(margin, currentY, pageWidth - margin, currentY);

            // Body text rendering with page wrapping
            currentY += 22;
            pdfDoc.setFont('helvetica', 'normal');
            pdfDoc.setFontSize(11);
            pdfDoc.setTextColor(35, 35, 45);

            // Split into paragraphs to preserve line spacing
            const paragraphs = textContent.split(/\n+/);
            const lineHeight = 16;
            const maxY = pageHeight - 50;

            for (const para of paragraphs) {
                const trimmed = para.trim();
                if (!trimmed) continue;

                const lines = pdfDoc.splitTextToSize(trimmed, contentWidth);

                // Check if paragraph lines exceed current page
                if (currentY + (lines.length * lineHeight) > maxY) {
                    // Render line by line across page breaks
                    for (const line of lines) {
                        if (currentY > maxY) {
                            pdfDoc.addPage();
                            currentY = margin;
                        }
                        pdfDoc.text(line, margin, currentY);
                        currentY += lineHeight;
                    }
                } else {
                    pdfDoc.text(lines, margin, currentY);
                    currentY += (lines.length * lineHeight);
                }

                // Add small spacing between paragraphs
                currentY += 10;
            }

            // Add page numbers at bottom
            const totalPages = pdfDoc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                pdfDoc.setPage(i);
                pdfDoc.setFont('helvetica', 'normal');
                pdfDoc.setFontSize(9);
                pdfDoc.setTextColor(140, 140, 150);
                pdfDoc.text(
                    `Page ${i} of ${totalPages}`,
                    pageWidth / 2,
                    pageHeight - 20,
                    { align: 'center' }
                );
            }

            const cleanDocName = selectedDoc.filename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
            const pdfFilename = activeTab === 'summary'
                ? `${cleanDocName}_${summaryLength}_summary.pdf`
                : `${cleanDocName}_key_insights.pdf`;

            pdfDoc.save(pdfFilename);
        } catch (err) {
            console.error('Failed to download PDF summary', err);
            setError('Failed to generate PDF download. Please try again.');
        } finally {
            setTimeout(() => setDownloading(false), 500);
        }
    };

    const handleSelectSummaryLength = async (length) => {
        setSummaryLength(length);
        if (!selectedDoc) return;

        const hasThisLength = length === 'short' ? !!selectedDoc.summaryShort
            : length === 'long' ? !!selectedDoc.summaryLong
            : !!selectedDoc.summaryMedium;

        // If this specific length hasn't been generated yet, automatically generate it!
        if (!hasThisLength) {
            await handleResummarize(selectedDoc.id, length, true);
        }
    };

    const handleResummarize = async (targetId = selectedDocId, lengthOverride = null, force = true) => {
        const idToUse = targetId || selectedDocId;
        if (!idToUse) return;
        const lengthToUse = lengthOverride || summaryLength;
        try {
            setResummarizing(true);
            setError('');
            const response = await api.post(`/documents/${idToUse}/summarize?force=${force}&length=${lengthToUse}`);
            const updatedDoc = response.data;
            setDocuments(prev => prev.map(d => d.id === idToUse ? { 
                ...d, 
                summary: updatedDoc.summary,
                summaryShort: updatedDoc.summaryShort,
                summaryMedium: updatedDoc.summaryMedium,
                summaryLong: updatedDoc.summaryLong 
            } : d));
        } catch (err) {
            console.error('Failed to re-summarize', err);
            setError(err.response?.data?.detail || 'Failed to generate summary. Please try again.');
        } finally {
            setResummarizing(false);
        }
    };

    const handleGenerateInsights = async (force = false, targetId = selectedDocId) => {
        const idToUse = targetId || selectedDocId;
        if (!idToUse) return;
        try {
            setGeneratingInsights(true);
            setError('');
            const response = await api.post(`/documents/${idToUse}/insights${force ? '?force=true' : ''}`);
            const updatedInsights = response.data.keyInsights;
            setDocuments(prev => prev.map(d => d.id === idToUse ? { ...d, keyInsights: updatedInsights } : d));
        } catch (err) {
            console.error('Failed to generate insights', err);
            setError(err.response?.data?.detail || 'Failed to generate key insights. Please try again.');
        } finally {
            setGeneratingInsights(false);
        }
    };

    const toggleFavorite = async () => {
        if (!selectedDoc) return;
        try {
            const response = await api.patch(`/documents/${selectedDoc.id}/favorite`);
            setDocuments(prev => prev.map(d => d.id === selectedDoc.id ? { ...d, isFavorite: response.data.isFavorite } : d));
        } catch (err) {
            console.error('Failed to toggle favorite', err);
        }
    };

    const handleDeleteSummary = async () => {
        if (!selectedDoc) return;
        try {
            setDeleting(true);
            setError('');
            await api.delete(`/documents/${selectedDoc.id}/summary`);
            
            // Remove from local summarized documents list since its summary is deleted
            const remainingDocs = documents.filter(d => d.id !== selectedDoc.id);
            setDocuments(remainingDocs);
            setShowDeleteModal(false);

            // Select another summarized document if available
            if (remainingDocs.length > 0) {
                setSelectedDocId(remainingDocs[0].id);
            } else {
                setSelectedDocId('');
            }
        } catch (err) {
            console.error('Failed to delete summary', err);
            setError(err.response?.data?.detail || 'Failed to delete summary. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    const getFileIcon = (format) => {
        switch (format) {
            case 'PDF': return { icon: File, color: 'text-red-400', bg: 'bg-red-400/20' };
            case 'DOCX':
            case 'DOC': return { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/20' };
            case 'XLSX': return { icon: FileSpreadsheet, color: 'text-green-400', bg: 'bg-green-400/20' };
            default: return { icon: FileIcon, color: 'text-orange-400', bg: 'bg-orange-400/20' };
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Unknown date';
        return date.toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const { icon: DocIcon, color: iconColor, bg: iconBg } = selectedDoc 
        ? getFileIcon(selectedDoc.fileFormat) 
        : { icon: FileText, color: 'text-indigo-400', bg: 'bg-indigo-400/20' };

    return (
        <div className="flex flex-col h-full min-h-0 text-white w-full">
            {/* Top Bar: Title + Select Document Dropdown in one compact row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 shrink-0">
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-400 shrink-0" />
                    Document Summaries
                </h2>

                {documents.length > 0 && (
                    <div className="flex items-center gap-2.5 bg-[#17153B]/80 border border-white/20 rounded-xl px-3 py-1.5 backdrop-blur-md shadow-md hover:border-white/30 transition-all max-w-md w-full sm:w-auto">
                        <FileText className="h-4 w-4 text-purple-400 shrink-0" />
                        <span className="text-[11px] font-bold text-gray-400 shrink-0 hidden sm:inline">Doc:</span>
                        <select
                            value={selectedDocId}
                            onChange={(e) => {
                                setSelectedDocId(e.target.value);
                                setError('');
                            }}
                            className="bg-transparent text-white font-medium text-xs outline-none cursor-pointer pr-3 focus:ring-0 truncate w-full sm:w-72"
                        >
                            {documents.map((doc, idx) => (
                                <option key={doc.id} value={doc.id} className="bg-[#17153B] text-white">
                                    {doc.filename} {idx === 0 ? '(Most Recent)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {error && (
                <div className="mb-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400 shrink-0">
                    {error}
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 rounded-2xl bg-[#17153B]/50 border border-white/10 p-4 md:p-5 backdrop-blur-xl shadow-2xl flex flex-col min-h-0 overflow-hidden">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                        <p className="text-sm">Loading summaries...</p>
                    </div>
                ) : documents.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-12">
                        <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 text-purple-400">
                            <Sparkles className="h-7 w-7 opacity-60" />
                        </div>
                        <p className="text-base font-semibold text-white">No summarized documents yet</p>
                        <p className="text-xs mt-1 max-w-sm text-center text-gray-300">
                            Upload a document in Documents or Dashboard, then click &quot;Summarize&quot; to review it here.
                        </p>
                        <button
                            onClick={() => navigate('/documents')}
                            className="mt-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:opacity-90 transition-all"
                        >
                            Go to Documents
                        </button>
                    </div>
                ) : selectedDoc ? (
                    <div className="flex flex-col h-full min-h-0">
                        {/* Compact Single Header Row: Document Details + Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10 mb-3 shrink-0">
                            {/* Document Info in one tight row */}
                            <div className="flex items-center gap-3 min-w-0 max-w-xl">
                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor} shadow-inner`}>
                                    <DocIcon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-white truncate drop-shadow" title={selectedDoc.filename}>
                                            {selectedDoc.filename}
                                        </h3>
                                        <button
                                            onClick={toggleFavorite}
                                            title={selectedDoc.isFavorite ? 'Remove favorite' : 'Add favorite'}
                                            className="text-gray-400 hover:text-yellow-400 transition-colors shrink-0"
                                        >
                                            <Star className={`h-3.5 w-3.5 ${selectedDoc.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3 text-gray-500" />
                                            {formatDate(selectedDoc.updatedAt || selectedDoc.createdAt)}
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <HardDrive className="h-3 w-3 text-gray-500" />
                                            {(selectedDoc.fileSize / (1024 * 1024)).toFixed(2)} MB • {selectedDoc.fileFormat}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons in single clean row */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                    onClick={() => setViewModalOpen(true)}
                                    title="Open & View original document"
                                    className="flex items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 hover:border-emerald-400 transition-all shadow-sm"
                                >
                                    <Eye className="h-3.5 w-3.5 text-emerald-400" />
                                    Open Doc
                                </button>

                                <button
                                    onClick={handleCopy}
                                    title={activeTab === 'summary' ? 'Copy Summary' : 'Copy Key Insights'}
                                    className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-gray-200 hover:bg-white/10 hover:text-white transition-all shadow-sm"
                                >
                                    {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                                    {copied ? 'Copied' : 'Copy'}
                                </button>

                                <button
                                    onClick={handleDownload}
                                    disabled={downloading}
                                    title="Download as PDF"
                                    className="flex items-center gap-1 rounded-lg border border-blue-400/40 bg-blue-500/15 px-2.5 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-500/25 hover:border-blue-400 transition-all shadow-sm disabled:opacity-50"
                                >
                                    <Download className="h-3.5 w-3.5 text-blue-400" />
                                    {downloading ? 'Generating...' : 'Download PDF'}
                                </button>

                                {activeTab === 'summary' ? (
                                    <button
                                        onClick={() => handleResummarize(selectedDoc.id, summaryLength, true)}
                                        disabled={resummarizing}
                                        title={`Regenerate ${summaryLength} Summary`}
                                        className="flex items-center gap-1 rounded-lg border border-purple-400/50 bg-purple-500/20 px-2.5 py-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-500/30 hover:border-purple-400 transition-all shadow-sm disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                        <RefreshCw className={`h-3.5 w-3.5 text-purple-600 dark:text-purple-300 ${resummarizing ? 'animate-spin' : ''}`} />
                                        {resummarizing ? 'Generating...' : 'Re-summarize'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleGenerateInsights(true, selectedDoc.id)}
                                        disabled={generatingInsights}
                                        title="Regenerate Key Insights"
                                        className="flex items-center gap-1 rounded-lg border border-amber-400/50 bg-amber-500/20 px-2.5 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-500/30 hover:border-amber-400 transition-all shadow-sm disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                        <RefreshCw className={`h-3.5 w-3.5 text-amber-600 dark:text-amber-300 ${generatingInsights ? 'animate-spin' : ''}`} />
                                        {generatingInsights ? 'Analyzing...' : (selectedDoc.keyInsights ? 'Re-generate' : 'Generate Insights')}
                                    </button>
                                )}

                                <button
                                    onClick={() => navigate('/chat', { state: { docId: selectedDoc.id } })}
                                    title="Chat with Document"
                                    className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:opacity-90 transition-all"
                                >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    Chat with Document
                                </button>

                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    title="Delete Summary"
                                    className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-300 transition-all shadow-sm"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete Summary
                                </button>
                            </div>
                        </div>

                        {/* View Switcher Tabs: AI Summary vs Key Insights + Length Filters in compact row */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 shrink-0">
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => {
                                        setActiveTab('summary');
                                        setError('');
                                    }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                        activeTab === 'summary'
                                            ? 'bg-purple-600 text-white shadow-md'
                                            : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10'
                                    }`}
                                >
                                    <Sparkles className="h-3 w-3" />
                                    Document Summary
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveTab('insights');
                                        setError('');
                                        if (!selectedDoc.keyInsights && !generatingInsights) {
                                            handleGenerateInsights(false, selectedDoc.id);
                                        }
                                    }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                        activeTab === 'insights'
                                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                                            : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10'
                                    }`}
                                >
                                    <Lightbulb className="h-3 w-3" />
                                    Key Insights
                                    {selectedDoc.keyInsights ? (
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                                    ) : null}
                                </button>
                            </div>

                            {/* Summary Length Filter (Short, Medium, Long) with Exact Word Targets */}
                            {activeTab === 'summary' && (
                                <div className="flex items-center gap-1.5">
                                    <div className="flex items-center gap-1 bg-black/20 dark:bg-black/20 p-1 rounded-lg border border-white/10 shadow-inner">
                                        <span className="text-[10px] font-bold text-gray-400 px-1.5 uppercase tracking-wider flex items-center gap-1">
                                            <AlignLeft className="h-2.5 w-2.5" /> Length:
                                        </span>
                                        {[
                                            { key: 'short', label: 'Short', desc: '120w' },
                                            { key: 'medium', label: 'Medium', desc: '250w' },
                                            { key: 'long', label: 'Long', desc: '600w' }
                                        ].map(({ key, label, desc }) => {
                                            const isSelected = summaryLength === key;
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => handleSelectSummaryLength(key)}
                                                    disabled={resummarizing}
                                                    title={`${label} Summary (${desc})`}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                                        isSelected
                                                            ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.5)] scale-105'
                                                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                                                    }`}
                                                >
                                                    <span>{label}</span>
                                                    <span className={`text-[10px] font-normal opacity-75`}>({desc})</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Content Body - ONLY THIS SCROLLS */}
                        <div className="flex-1 min-h-0 overflow-y-auto pr-3 rounded-2xl bg-[#0B0A1A]/40 border border-white/5 p-6 md:p-8 scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent">
                            {activeTab === 'summary' ? (
                                resummarizing ? (
                                    <div className="h-full flex flex-col items-center justify-center text-purple-300 gap-3 py-16">
                                        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                                        <p className="text-sm font-medium">Generating a fresh {summaryLength} summary with Qwen 2.5 / Llama 3.3...</p>
                                    </div>
                                ) : getCurrentSummaryText() ? (
                                    <div className="space-y-4">
                                        {/* Word count & length status pill */}
                                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                                                    {summaryLength} summary
                                                </span>
                                                <span className="text-xs text-gray-400 font-medium">
                                                    Target: {summaryLength === 'short' ? '120 words' : (summaryLength === 'long' ? '600 words' : '250 words')}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-400 font-mono bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                                                {getCurrentSummaryText().trim().split(/\s+/).filter(Boolean).length} words
                                            </span>
                                        </div>

                                        <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap font-sans space-y-4">
                                            {getCurrentSummaryText()}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                                        <Bot className="h-10 w-10 mb-2 opacity-50" />
                                        <p>No {summaryLength} summary generated yet for this document.</p>
                                        <button
                                            onClick={() => handleResummarize(selectedDoc.id, summaryLength, true)}
                                            className="mt-3 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-purple-500 transition-all"
                                        >
                                            Generate {summaryLength.charAt(0).toUpperCase() + summaryLength.slice(1)} Summary
                                        </button>
                                    </div>
                                )
                            ) : (
                                generatingInsights ? (
                                    <div className="h-full flex flex-col items-center justify-center text-amber-300 gap-3 py-16">
                                        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                                        <p className="text-sm font-medium">Extracting core key insights & strategic takeaways...</p>
                                    </div>
                                ) : selectedDoc.keyInsights ? (
                                    <div className="text-gray-100 text-sm leading-relaxed whitespace-pre-wrap font-sans space-y-4">
                                        {selectedDoc.keyInsights}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                                        <Lightbulb className="h-12 w-12 mb-3 text-amber-400/60" />
                                        <p className="text-base font-semibold text-white">No key insights generated yet</p>
                                        <p className="text-xs text-gray-400 mt-1 mb-4">Click below to extract high-value insights, metrics, and takeaways.</p>
                                        <button
                                            onClick={() => handleGenerateInsights(false, selectedDoc.id)}
                                            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:opacity-90 transition-all flex items-center gap-1.5"
                                        >
                                            <Zap className="h-3.5 w-3.5" />
                                            Generate Key Insights
                                        </button>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Delete Summary Confirmation Modal */}
            {showDeleteModal && selectedDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="w-full max-w-md rounded-2xl bg-[#17153B] border border-white/20 p-6 shadow-2xl text-white transform transition-all animate-scale-up">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-white">Delete Document Summary?</h3>
                                <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                                    Are you sure you want to delete the summaries and key insights for <span className="font-semibold text-white break-all">"{selectedDoc.filename}"</span>?
                                </p>
                                <p className="text-[11px] text-gray-400 mt-2 bg-white/5 p-2.5 rounded-xl border border-white/10">
                                    💡 <strong className="text-gray-200">Note:</strong> Your uploaded file will <span className="text-green-400 font-semibold">remain intact</span> in your documents list. You can re-generate summaries anytime.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={() => setShowDeleteModal(false)}
                                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={handleDeleteSummary}
                                className="flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
                            >
                                {deleting ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete Summary
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Viewer Modal */}
            <DocumentViewModal
                isOpen={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                doc={selectedDoc}
            />
        </div>
    );
};

export default SummariesPage;
