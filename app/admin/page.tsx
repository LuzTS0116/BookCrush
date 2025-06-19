"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  BookOpen, 
  MessageSquare, 
  UserPlus, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Settings,
  BarChart3,
  Activity,
  Shield,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/hooks/useUserRole';

interface AdminStats {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  books: {
    total: number;
    addedThisMonth: number;
    mostPopular: string;
  };
  clubs: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  activity: {
    totalActivities: number;
    todayActivities: number;
    discussionsToday: number;
  };
  feedback: {
    pending: number;
    resolved: number;
    total: number;
  };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const { role, isLoading: roleLoading, isSuperAdmin } = useUserRole();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication status
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // Wait for role to load
    if (roleLoading) {
      return;
    }

    // Check if user has super admin role
    if (status === 'authenticated' && !roleLoading) {
      if (!isSuperAdmin) {
        setError('Super Admin access required. You do not have permission to access this page.');
        setIsLoading(false);
        return;
      }
      
      // User is authenticated and has super admin role, fetch stats
      fetchAdminStats();
    }
  }, [status, roleLoading, isSuperAdmin, router]);

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        credentials: 'include'
      });

      if (response.status === 403) {
        setError('Super Admin access required. You do not have permission to access this page.');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch admin statistics');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking authentication and role
  if (status === 'loading' || roleLoading || (status === 'authenticated' && isLoading && !error)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied for non-super-admin users
  if (error || (!roleLoading && !isSuperAdmin)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-6 w-6 text-red-600" />
              <div>
                <h2 className="text-lg font-semibold text-red-800">Access Denied</h2>
                <p className="text-red-700">
                  {error || 'Super Admin access required. You do not have permission to access this page.'}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button asChild>
                <Link href="/dashboard">
                  Go to Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="h-8 w-8 text-red-600" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
              <Badge variant="destructive" className="mt-1">
                SUPER ADMIN ACCESS
              </Badge>
            </div>
          </div>
          <p className="text-muted-foreground">
            Manage your book club platform • Welcome, {session?.user?.name || 'Super Admin'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.users.newThisMonth || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.books.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.books.addedThisMonth || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clubs</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.clubs.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.clubs.total || 0} total clubs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.feedback.pending || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.feedback.total || 0} total feedback
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Admin Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="books">Books</TabsTrigger>
          <TabsTrigger value="clubs">Clubs</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Activities Today</span>
                    <Badge variant="secondary">{stats?.activity.todayActivities || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Discussions Today</span>
                    <Badge variant="secondary">{stats?.activity.discussionsToday || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Activities</span>
                    <Badge variant="outline" className='text-secondary'>{stats?.activity.totalActivities || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-bookWhite" asChild>
                  <Link href="/admin/users">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start text-bookWhite" asChild>
                  <Link href="/admin/books">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Manage Books
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start text-bookWhite" asChild>
                  <Link href="/admin/feedback">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Review Feedback
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">User management interface will be loaded here</p>
                <Button asChild>
                  <Link href="/admin/users">Go to User Management</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="books">
          <Card>
            <CardHeader>
              <CardTitle>Book Management</CardTitle>
              <CardDescription>
                Manage books, reviews, and library content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Book management interface will be loaded here</p>
                <Button asChild>
                  <Link href="/admin/books">Go to Book Management</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clubs">
          <Card>
            <CardHeader>
              <CardTitle>Club Management</CardTitle>
              <CardDescription>
                Manage book clubs, memberships, and meetings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Club management interface will be loaded here</p>
                <Button asChild>
                  <Link href="/admin/clubs">Go to Club Management</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>Feedback Management</CardTitle>
              <CardDescription>
                Review and respond to user feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Feedback management interface will be loaded here</p>
                <Button asChild>
                  <Link href="/admin/feedback">Go to Feedback Management</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Monitoring</CardTitle>
              <CardDescription>
                Monitor platform activity and user engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Activity monitoring interface will be loaded here</p>
                <Button asChild>
                  <Link href="/admin/activity">Go to Activity Monitor</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 