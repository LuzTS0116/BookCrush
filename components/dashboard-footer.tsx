"use client"

export function DashboardFooter() {
    return (
        <div className="bg-transparent pt-2 pb-14">
            <p className="bg-secondary-light/40 p-4 rounded-3xl text-sm font-serif mb-4 text-center md:container">
                Made possible with data from <a href="https://openlibrary.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">Open Library</a> and inspiring quotes from <a href="https://zenquotes.io" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">ZenQuotes API</a>.
            </p>
        </div>
    );
}