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
  MessageSquare, 
  Search, 
  ArrowLeft,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  Bug,
  Lightbulb,
  MessageCircle,
  Frown,
  Smile,
  MoreHorizontal,
  Eye,
  Edit
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface AdminFeedback {
  id: string;
  type: 'BUG_REPORT' | 'FEATURE_REQUEST' | 'GENERAL_FEEDBACK' | 'COMPLAINT' | 'COMPLIMENT';
  content: string;
  status: 'PENDING' | 'REVIEWED' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  user: {
    display_name: string;
    email?: string;
  };
}

const FEEDBACK_TYPES = {
  BUG_REPORT: { label: 'Bug Report', icon: Bug, color: 'bg-red-100 text-red-800' },
  FEATURE_REQUEST: { label: 'Feature Request', icon: Lightbulb, color: 'bg-blue-100 text-blue-800' },
  GENERAL_FEEDBACK: { label: 'General Feedback', icon: MessageCircle, color: 'bg-gray-100 text-gray-800' },
  COMPLAINT: { label: 'Complaint', icon: Frown, color: 'bg-orange-100 text-orange-800' },
  COMPLIMENT: { label: 'Compliment', icon: Smile, color: 'bg-green-100 text-green-800' },
};

const FEEDBACK_STATUSES = {
  PENDING: { label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  REVIEWED: { label: 'Reviewed', icon: Eye, color: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS: { label: 'In Progress', icon: AlertCircle, color: 'bg-purple-100 text-purple-800' },
  RESOLVED: { label: 'Resolved', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  DISMISSED: { label: 'Dismissed', icon: MessageSquare, color: 'bg-gray-100 text-gray-800' },
};

export default function AdminFeedbackPage() {
  const { data: session } = useSession();
  const [feedback, setFeedback] = useState<AdminFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<AdminFeedback | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const response = await fetch('/api/admin/feedback', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }

      const data = await response.json();
      setFeedback(data);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewFeedback = (feedbackItem: AdminFeedback) => {
    setSelectedFeedback(feedbackItem);
    setAdminNotes(feedbackItem.admin_notes || '');
    setNewStatus(feedbackItem.status);
    setIsDetailDialogOpen(true);
  };

  const handleUpdateFeedback = async () => {
    if (!selectedFeedback) return;

    try {
      const response = await fetch(`/api/admin/feedback/${selectedFeedback.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
          admin_notes: adminNotes.trim() || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update feedback');
      }

      toast.success('Feedback updated successfully');
      setIsDetailDialogOpen(false);
      fetchFeedback();
    } catch (error) {
      console.error('Error updating feedback:', error);
      toast.error('Failed to update feedback');
    }
  };

  const filteredFeedback = feedback.filter(item => {
    const matchesSearch = 
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getTypeInfo = (type: AdminFeedback['type']) => FEEDBACK_TYPES[type];
  const getStatusInfo = (status: AdminFeedback['status']) => FEEDBACK_STATUSES[status];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading feedback...</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Feedback Management</h1>
            <p className="text-muted-foreground">
              Review and respond to user feedback
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedback.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedback.filter(f => f.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedback.filter(f => f.status === 'IN_PROGRESS').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedback.filter(f => f.status === 'RESOLVED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bug Reports</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedback.filter(f => f.type === 'BUG_REPORT').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>User Feedback</CardTitle>
          <CardDescription>
            Review and manage user feedback and support requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search feedback by content or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(FEEDBACK_STATUSES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(FEEDBACK_TYPES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Feedback Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeedback.map((item) => {
                  const typeInfo = getTypeInfo(item.type);
                  const statusInfo = getStatusInfo(item.status);
                  const TypeIcon = typeInfo.icon;
                  const StatusIcon = statusInfo.icon;

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <TypeIcon className="h-4 w-4" />
                          <Badge className={typeInfo.color}>
                            {typeInfo.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="text-sm line-clamp-2">
                            {item.content.length > 100 
                              ? `${item.content.substring(0, 100)}...` 
                              : item.content
                            }
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <div>
                            <div className="font-medium text-sm">{item.user.display_name}</div>
                            {item.user.email && (
                              <div className="text-xs text-muted-foreground">{item.user.email}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <StatusIcon className="h-4 w-4" />
                          <Badge className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewFeedback(item)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredFeedback.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No feedback found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedFeedback && (
                <>
                  {React.createElement(getTypeInfo(selectedFeedback.type).icon, { className: "h-5 w-5" })}
                  <span>{getTypeInfo(selectedFeedback.type).label}</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Review and update feedback status
            </DialogDescription>
          </DialogHeader>
          
          {selectedFeedback && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">User</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded">
                  <p className="font-medium">{selectedFeedback.user.display_name}</p>
                  {selectedFeedback.user.email && (
                    <p className="text-sm text-muted-foreground">{selectedFeedback.user.email}</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Feedback Content</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded">
                  <p className="text-sm whitespace-pre-wrap">{selectedFeedback.content}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(selectedFeedback.created_at).toLocaleString()}
                </p>
              </div>

              <div>
                <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FEEDBACK_STATUSES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="admin_notes" className="text-sm font-medium">Admin Notes</Label>
                <Textarea
                  id="admin_notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this feedback..."
                  className="mt-1"
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateFeedback}>
              Update Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 