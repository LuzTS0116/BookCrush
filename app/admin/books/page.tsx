"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BookOpen, 
  Search, 
  Edit, 
  Trash2, 
  Plus, 
  ArrowLeft,
  Star,
  Users,
  Calendar,
  MoreHorizontal,
  Eye,
  Download,
  Upload
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface AdminBook {
  id: string;
  title: string;
  author?: string;
  cover_url?: string;
  description?: string;
  reading_time?: string;
  pages?: number;
  genres: string[];
  published_date?: string;
  rating?: number;
  created_at: string;
  _count: {
    UserBook: number;
    reviews: number;
    club_meetings: number;
  };
  creator?: {
    display_name: string;
  };
}

const GENRES = [
  "Biography", "Children's", "Classics", "Dark Romance", "Fantasy", "Fiction",
  "Historical Fiction", "Horror", "Literary Fiction", "Manga", "Mystery",
  "Non-Fiction", "Poetry", "Romance", "Romantasy", "Science Fiction",
  "Self-Help", "Thriller", "Young Adult"
];

export default function AdminBooksPage() {
  const { data: session } = useSession();
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState<AdminBook | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    author: '',
    description: '',
    reading_time: '',
    pages: '',
    genres: [] as string[],
    published_date: '',
    rating: '',
    cover_url: ''
  });

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/admin/books', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }

      const data = await response.json();
      setBooks(data);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast.error('Failed to load books');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditBook = (book: AdminBook) => {
    setSelectedBook(book);
    setEditForm({
      title: book.title || '',
      author: book.author || '',
      description: book.description || '',
      reading_time: book.reading_time || '',
      pages: book.pages?.toString() || '',
      genres: book.genres || [],
      published_date: book.published_date || '',
      rating: book.rating?.toString() || '',
      cover_url: book.cover_url || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleCreateBook = () => {
    setSelectedBook(null);
    setEditForm({
      title: '',
      author: '',
      description: '',
      reading_time: '',
      pages: '',
      genres: [],
      published_date: '',
      rating: '',
      cover_url: ''
    });
    setIsCreateDialogOpen(true);
  };

  const handleSaveBook = async () => {
    try {
      const bookData = {
        ...editForm,
        pages: editForm.pages ? parseInt(editForm.pages) : null,
        rating: editForm.rating ? parseFloat(editForm.rating) : null,
      };

      const url = selectedBook 
        ? `/api/admin/books/${selectedBook.id}` 
        : '/api/admin/books';
      
      const method = selectedBook ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(bookData)
      });

      if (!response.ok) {
        throw new Error(`Failed to ${selectedBook ? 'update' : 'create'} book`);
      }

      toast.success(`Book ${selectedBook ? 'updated' : 'created'} successfully`);
      setIsEditDialogOpen(false);
      setIsCreateDialogOpen(false);
      fetchBooks();
    } catch (error) {
      console.error(`Error ${selectedBook ? 'updating' : 'creating'} book:`, error);
      toast.error(`Failed to ${selectedBook ? 'update' : 'create'} book`);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/books/${bookId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete book');
      }

      toast.success('Book deleted successfully');
      fetchBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      toast.error('Failed to delete book');
    }
  };

  const addGenre = (genre: string) => {
    if (genre && !editForm.genres.includes(genre)) {
      setEditForm({ ...editForm, genres: [...editForm.genres, genre] });
    }
  };

  const removeGenre = (genre: string) => {
    setEditForm({ 
      ...editForm, 
      genres: editForm.genres.filter(g => g !== genre) 
    });
  };

  const filteredBooks = books.filter(book =>
    book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.genres?.some(genre => genre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading books...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Book Management</h1>
            <p className="text-muted-foreground">
              Manage your book library and content
            </p>
          </div>
        </div>
        <Button onClick={handleCreateBook}>
          <Plus className="h-4 w-4 mr-2" />
          Add Book
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{books.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Popular Books</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {books.filter(b => b._count.UserBook > 5).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Reviews</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {books.filter(b => b._count.reviews > 0).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Club Selections</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {books.filter(b => b._count.club_meetings > 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Books Library</CardTitle>
          <CardDescription>
            Search and manage your book collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search books by title, author, or genre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Books Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Genres</TableHead>
                  <TableHead>Readers</TableHead>
                  <TableHead>Reviews</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBooks.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <img
                          src={book.cover_url || "/placeholder.svg"}
                          alt={book.title}
                          className="w-10 h-14 object-cover rounded"
                        />
                        <div>
                          <div className="font-medium">{book.title}</div>
                          {book.pages && (
                            <div className="text-sm text-muted-foreground">
                              {book.pages} pages
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{book.author || 'Unknown'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {book.genres?.slice(0, 2).map((genre) => (
                          <Badge key={genre} variant="secondary" className="text-xs">
                            {genre}
                          </Badge>
                        ))}
                        {book.genres?.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{book.genres.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {book._count.UserBook}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3" />
                        <Badge variant="secondary">
                          {book._count.reviews}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(book.created_at).toLocaleDateString()}
                      </div>
                      {book.creator && (
                        <div className="text-xs text-muted-foreground">
                          by {book.creator.display_name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/books/${book.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Book
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditBook(book)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Book
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteBook(book.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Book
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredBooks.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No books found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Book Dialog */}
      <Dialog open={isEditDialogOpen || isCreateDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        setIsCreateDialogOpen(open);
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedBook ? 'Edit Book' : 'Add New Book'}
            </DialogTitle>
            <DialogDescription>
              {selectedBook ? 'Update book information' : 'Add a new book to the library'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title *
              </Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="author" className="text-right">
                Author
              </Label>
              <Input
                id="author"
                value={editForm.author}
                onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cover_url" className="text-right">
                Cover URL
              </Label>
              <Input
                id="cover_url"
                value={editForm.cover_url}
                onChange={(e) => setEditForm({ ...editForm, cover_url: e.target.value })}
                className="col-span-3"
                placeholder="https://example.com/cover.jpg"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pages" className="text-right">
                Pages
              </Label>
              <Input
                id="pages"
                type="number"
                value={editForm.pages}
                onChange={(e) => setEditForm({ ...editForm, pages: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reading_time" className="text-right">
                Reading Time
              </Label>
              <Input
                id="reading_time"
                value={editForm.reading_time}
                onChange={(e) => setEditForm({ ...editForm, reading_time: e.target.value })}
                className="col-span-3"
                placeholder="e.g., 4 hours"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="published_date" className="text-right">
                Published Date
              </Label>
              <Input
                id="published_date"
                value={editForm.published_date}
                onChange={(e) => setEditForm({ ...editForm, published_date: e.target.value })}
                className="col-span-3"
                placeholder="e.g., 2023"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rating" className="text-right">
                Rating
              </Label>
              <Input
                id="rating"
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={editForm.rating}
                onChange={(e) => setEditForm({ ...editForm, rating: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right">Genres</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {editForm.genres.map((genre) => (
                    <Badge key={genre} variant="secondary" className="cursor-pointer">
                      {genre}
                      <button
                        type="button"
                        onClick={() => removeGenre(genre)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={addGenre}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add a genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRES.filter(genre => !editForm.genres.includes(genre)).map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setIsCreateDialogOpen(false);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveBook}>
              {selectedBook ? 'Save Changes' : 'Create Book'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 