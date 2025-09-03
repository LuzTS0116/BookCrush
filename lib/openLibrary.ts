import { Book } from '@/types/book';

interface Editions { 
    numFound: number, 
    start: number, 
    numFoundExact: boolean, 
    docs: [{
                        key: string,
                        title: string
                    }] }

interface OpenLibraryDoc {
  title: string;
  key: string;
  author_name?: string[];
  subject?: string[];
  number_of_pages_median?: number;
  cover_i?: number;
  editions?: Editions;
}

interface WorksRes {
  description: string;
  
}

/**
 * Convenience: first try Search API (fast, no key required),
 * then map the first doc that has a cover.
 */
export async function fetchBookFromOL(
  title: string,
  author?: string
): Promise<Book | null> {
  const url = new URL('https://openlibrary.org/search.json');
  url.searchParams.append('title', title);
  if (author) url.searchParams.append('author', author);
  url.searchParams.append('lang', 'en');
  url.searchParams.append('fields', 'key,cover_i,title,author_name,subject,number_of_pages_median,editions,editions.key,editions.title,works.description');
  url.searchParams.append('limit', '1');
  

  const res = await fetch(url.href, { cache: 'no-store', headers: {
    "User-Agent": "BookCrush/0.1.8 (admin@bookcrush.club)"
  }, });
  if (!res.ok) {
    console.error('OpenLibrary error', res.statusText);
    return null;
  }

  const { docs = [] } = (await res.json()) as { docs: OpenLibraryDoc[] };
  if (!docs.length) return null;

  const works_res = await fetch(`https://openlibrary.org${docs[0].key}.json`, { cache: 'no-store', headers: {
    "User-Agent": "BookCrush/0.1.8 (admin@bookcrush.club)"
  }, });
  if (!works_res.ok) {
    console.error('OpenLibrary Works error', works_res.statusText);
    return null;
  }

//   const { works = [] } = (await works_res.json()) as { works: WorksRes[] };
  
  const works_var = await works_res.json();

  console.log(docs[0]);
  console.log(docs[0].editions.docs[0]);
  console.log(works_var.description);

  return mapDocToBook(docs[0], works_var.description);
}

/**
 * Map OpenLibrary’s doc format → ui-friendly Book interface
 */
function mapDocToBook(doc: OpenLibraryDoc, works_desc): Book {
  const pages = doc.number_of_pages_median ?? 0;

  return {
    title: doc.title,
    author: doc.author_name?.[0] ?? 'Unknown',
    genre: doc.subject?.[0] ?? 'Unknown',
    pages,
    description: works_desc,
    reading_speed: estimateReadingSpeed(pages),
    cover: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
      : '/placeholder.svg?height=200&width=150',

  };
}

/**
 * Very rough reading-time estimate.
 * 60 pages/hour (≈250 wpm * 250 words/page) with ±15 %.
 */
function estimateReadingSpeed(pages: number): string {
  if (!pages) return 'N/A';

  const hours = pages / 60;
  const lower = Math.max(hours * 0.85, 0.25);
  const upper = hours * 1.15;
  const fmt = (n: number) => n.toFixed(1).replace(/\.0$/, '');
  return `${fmt(lower)}-${fmt(upper)} hours`;
}