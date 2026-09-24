import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import bgImage from '../../assets/login-bg.png';
import lightBgImage from '../../assets/light-bg.jpg';
import { useTheme } from '../../context/ThemeContext';
import { useState } from 'react';

const AppShell = () => {
    const { theme } = useTheme();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);
    const isFixedPage = location.pathname === '/chat' || location.pathname === '/summaries';

    return (
        <div 
            className={`flex h-screen w-full font-sans overflow-hidden transition-colors duration-500`}
            style={{ 
                backgroundImage: theme === 'dark' ? `url(${bgImage})` : `url(${lightBgImage})`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed'
            }}
        >
            {/* Ambient Animated Background Glow Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-600/25 blur-3xl animate-float-slow"></div>
                <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl animate-float-reverse"></div>
                <div className="absolute -bottom-24 left-1/3 w-[30rem] h-[30rem] rounded-full bg-blue-600/20 blur-3xl animate-pulse-subtle"></div>
            </div>

            {/* Global Overlay */}
            <div className="absolute inset-0 bg-[#0B0A1A]/10 mix-blend-overlay pointer-events-none"></div>

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="relative z-10 flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-transparent">
                <Header 
                    searchQuery={searchQuery} 
                    setSearchQuery={setSearchQuery} 
                    onUploadSuccess={triggerRefresh}
                    onMenuClick={() => setIsSidebarOpen(true)}
                />
                <main className={`flex-1 flex flex-col ${isFixedPage ? 'overflow-hidden' : 'overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent'}`}>
                    <div className="flex-1 px-3 sm:px-6 md:px-8 py-4 sm:py-6 min-h-0 flex flex-col overflow-hidden">
                        <div className="max-w-7xl mx-auto w-full h-full flex flex-col min-h-0">
                            <Outlet context={{ searchQuery, refreshTrigger }} />
                        </div>
                    </div>
                    {!isFixedPage && <Footer />}
                </main>
            </div>
        </div>
    );
};

export default AppShell;
