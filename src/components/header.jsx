function Header() {
    return (
        <header className="w-full bg-white border-b">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                {/* Logo */}
                <a href="/" className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white font-semibold">
                        BV
                    </div>
                    <span className="text-xl font-semibold tracking-tight text-gray-900">
                        <span className="text-blue-700">Blue</span>Verse
                    </span>
                </a>

                {/* Contact button */}
                <a
                    href="/contact"
                    className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                >
                    Contact us
                </a>
            </div>
        </header>
    );
}

export default Header;
