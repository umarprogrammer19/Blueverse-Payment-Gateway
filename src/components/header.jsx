function Header() {
    return (
        <header className="w-full h-auto lg:h-[90px] bg-white border-b border-gray-400">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <a href="https://wheat-ferret-827560.hostingersite.com/" className="flex items-center gap-2">
                    <img src="/logo.png" alt="BlueVerse" className="h-9 md:h-14 w-auto" />
                </a>
                <a
                    href="https://wheat-ferret-827560.hostingersite.com/contact/"
                    className="inline-flex items-center rounded-[10px] bg-[#2162AF] px-5 md:px-8 py-3 text-sm md:text-md font-semibold text-white shadow-sm hover:bg-[#1A4D94] transition-colors"
                >
                    Contact us
                </a>
            </div>
        </header>
    );
}

export default Header;
