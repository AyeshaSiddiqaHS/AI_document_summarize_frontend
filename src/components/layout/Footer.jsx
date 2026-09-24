const Footer = () => {
    return (
        <footer className="mt-auto py-3 px-8 text-center text-xs text-gray-300 font-medium bg-[#0B0A1A]/10 backdrop-blur-sm border-t border-white/5">
            &copy; {new Date().getFullYear()} DocuMind AI. All rights reserved.
        </footer>
    );
};

export default Footer;
