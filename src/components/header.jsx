function Header() {
    return (
        <header className="w-full bg-white border-b border-gray-400">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                {/* Logo */}
                <a href="/" className="flex items-center gap-2">
                    <img src="/logo.png" alt="BlueVerse" className="h-14 w-auto" />
                </a>

                {/* Contact button */}
                <a
                    href="/contact"
                    className="inline-flex items-center rounded-[10px] bg-[#2162AF] px-8 py-3 text-md font-semibold text-white shadow-sm hover:bg-[#1A4D94] transition-colors"
                >
                    Contact us
                </a>
            </div>
        </header>
    );
}

export default Header;
