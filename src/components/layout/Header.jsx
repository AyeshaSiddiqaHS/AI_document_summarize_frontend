import { Search, Plus, LogOut, User, Menu } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import UploadModal from '../UploadModal';

const Header = ({ searchQuery, setSearchQuery, onUploadSuccess, onMenuClick }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const firstName = user?.firstName || 'User';
    
    // Determine if the user is a brand new user or a returning user.
    // If they just registered, or have an active is_new_user session flag, or were created within the last 15 minutes and haven't logged in before:
    const [isReturningUser, setIsReturningUser] = useState(() => {
        if (!user?.email) return false;
        const isKnownReturning = localStorage.getItem(`user_has_visited_${user.email}`);
        return Boolean(isKnownReturning);
    });

    useEffect(() => {
        if (user?.email) {
            const isKnownReturning = localStorage.getItem(`user_has_visited_${user.email}`);
            const justRegistered = sessionStorage.getItem(`just_registered_${user.email}`) === 'true';

            // Also check account creation timestamp if available (e.g., created in the last 15 minutes)
            let isRecentlyCreated = false;
            if (user.createdAt) {
                const createdTime = new Date(user.createdAt).getTime();
                const now = new Date().getTime();
                // If created in the last 15 minutes
                if (now - createdTime < 15 * 60 * 1000) {
                    isRecentlyCreated = true;
                }
            }

            if (justRegistered || (!isKnownReturning && isRecentlyCreated)) {
                // Brand new user: display "Welcome, {firstName}! 👋" during this session
                setIsReturningUser(false);
                // Mark for subsequent future visits / logins
                localStorage.setItem(`user_has_visited_${user.email}`, 'true');
            } else if (isKnownReturning) {
                // Existing / returning user
                setIsReturningUser(true);
            } else {
                // First time visit for an existing user without flag, or new user
                setIsReturningUser(false);
                localStorage.setItem(`user_has_visited_${user.email}`, 'true');
            }
        }
    }, [user?.email, user?.createdAt]);

    return (
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 md:px-8 py-3.5 sm:py-5 bg-[#0B0A1A]/30 backdrop-blur-md border-b border-white/5">
            <div className="flex items-center gap-3">
                {/* Mobile hamburger menu toggle */}
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 rounded-xl text-white hover:bg-white/10 active:scale-95 transition-all"
                    aria-label="Open Navigation Menu"
                >
                    <Menu className="h-6 w-6" />
                </button>
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-md">Dashboard</h2>
                    <p className="text-xs sm:text-sm text-gray-200 mt-0.5 sm:mt-1 font-medium drop-shadow truncate max-w-[200px] sm:max-w-none">
                        {isReturningUser ? `Welcome back, ${firstName}! 👋` : `Welcome, ${firstName}! 👋`}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
                {/* Actions */}
                <button 
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:opacity-90 hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus className="h-4 w-4" /> 
                    <span className="hidden xs:inline sm:inline">Upload</span>
                    <span className="hidden sm:inline">Document</span>
                </button>

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <div 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-full overflow-hidden border-2 border-white/30 shadow-lg cursor-pointer hover:border-white/50 transition-all"
                    >
                        <img src={`https://ui-avatars.com/api/?name=${firstName}&background=6366f1&color=fff`} alt="User Avatar" className="h-full w-full object-cover" />
                    </div>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-3 w-48 rounded-xl bg-[#1D1B42] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl z-50">
                            <div className="px-4 py-3 border-b border-white/5">
                                <p className="text-sm text-white font-medium truncate">{user?.firstName} {user?.lastName}</p>
                                <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                            </div>
                            <div className="py-1">
                                <button 
                                    onClick={() => {
                                        setIsProfileOpen(false);
                                        navigate('/settings', { state: { section: 'user' } });
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                                >
                                    <User className="h-4 w-4" /> Profile
                                </button>
                                <button 
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                                >
                                    <LogOut className="h-4 w-4" /> Log out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            <UploadModal 
                isOpen={isUploadModalOpen} 
                onClose={() => setIsUploadModalOpen(false)} 
                onSuccess={(doc) => {
                    console.log("Uploaded successfully:", doc);
                    if (onUploadSuccess) onUploadSuccess();
                    alert(`Successfully uploaded ${doc.filename}!`);
                }}
            />
        </header>
    );
};

export default Header;
