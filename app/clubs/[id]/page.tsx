
// "use client"

// import { useState, useEffect, useCallback } from "react" // Added useEffect, useCallback
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Badge } from "@/components/ui/badge"
// import { BookOpen, CalendarDays, Plus, Settings, MessageSquare, Clock, Loader2, Check } from "lucide-react" // Added Loader2, Check
// import { Progress } from "@/components/ui/progress"
// import { Separator } from "@/components/ui/separator"
// import { Textarea } from "@/components/ui/textarea"
// import { toast } from "sonner"; // Assuming sonner for toasts

// // --- Define Interfaces for better type safety ---
// interface Discussion {
//   user: {
//     name: string;
//     avatar: string | null;
//     initials: string;
//   };
//   text: string;
//   timestamp: string;
// }

// interface BookHistoryEntry {
//   title: string;
//   author: string;
//   date: string;
//   cover: string;
//   rating: number;
//   notes: string;
// }

// interface CurrentBookDetails {
//   title: string;
//   author: string;
//   cover: string;
//   progress: number;
//   meetingDate: string;
//   meetingTime: string;
//   description: string;
// }

// interface ClubMembershipRequest {
//   id: string; // This is the membershipId (UUID) needed for the approve API
//   userId: string; // Applicant's User ID (UUID)
//   userName: string;
//   userAvatar: string | null;
//   userInitials: string;
//   appliedAt: string; // ISO string
//   status: 'PENDING' | 'ACTIVE'; // Status of this specific request
// }

// // Full Club data structure for the detail page
// interface ClubData {
//   id: string; // Club ID (UUID)
//   name: string;
//   description: string;
//   memberCount: number; // Using memberCount from your schema suggestion
//   ownerId: string; // The ID of the club owner

//   // Current user's specific relationship to *this* club (these would come from backend)
//   currentUserMembershipStatus: 'ACTIVE' | 'PENDING' | 'REJECTED' | 'LEFT' | null;
//   currentUserIsAdmin: boolean; // True if current user is owner_id or an ADMIN role for this club

//   currentBook: CurrentBookDetails;
//   history: BookHistoryEntry[];
//   discussions: Discussion[];
//   pendingMemberships?: ClubMembershipRequest[]; // Populated only if currentUserIsAdmin is true
// }

// export default function ClubDetailPage({ params }: { params: { id: string } }) {
//   const [comment, setComment] = useState("");
//   const [club, setClub] = useState<ClubData | null>(null); // Club data, initially null
//   const [loadingClub, setLoadingClub] = useState(true); // Loading state for initial club data fetch
//   const [loadingAction, setLoadingAction] = useState(false); // Loading state for join/approve actions

//   // Function to simulate fetching full club details for the page.
//   // In a real app, this would be an API call to, e.g., `/api/clubs/${params.id}`
//   // which would return comprehensive club details + current user's membership status/role for that club.
//   const fetchClubDetails = useCallback(async () => {
//     setLoadingClub(true);
//     try {
//       // --- Simulate fetching data from a dedicated /api/clubs/[id] endpoint ---
//       // This part would ideally be a real API call to a new endpoint like:
//       // GET /api/clubs/[id]
//       // which would return a JSON object like this:
//       // {
//       //   id: "club-id-uuid",
//       //   name: "Fiction Lovers",
//       //   description: "...",
//       //   memberCount: 12,
//       //   ownerId: "owner-user-id",
//       //   currentUserMembershipStatus: "ACTIVE", // or "PENDING", "LEFT", "REJECTED", null
//       //   currentUserIsAdmin: true, // true if user is owner or admin of this club
//       //   currentBook: { ... },
//       //   history: [ ... ],
//       //   discussions: [ ... ]
//       // }
//       // And then, if `currentUserIsAdmin` is true, a *secondary* fetch to `/api/clubs/[id]/pending-memberships`
//       // would populate the `pendingMemberships` array.

//       // For demonstration, we'll use a mocked base club and layer dynamic data on it.
//       const baseMockClubData: Omit<ClubData, 'currentUserMembershipStatus' | 'currentUserIsAdmin' | 'pendingMemberships'> = {
//         id: params.id,
//         name: "Fiction Lovers", // Replace with data from your actual club details API
//         description: "A group dedicated to contemporary fiction and literary novels.",
//         memberCount: 12, // Replace with data from your actual club details API
//         ownerId: "mock-owner-id-123", // Replace with actual owner_id from fetched club data
//         currentBook: {
//           title: "The Midnight Library",
//           author: "Matt Haig",
//           cover: "/placeholder.svg?height=200&width=150",
//           progress: 65,
//           meetingDate: "May 9, 2025",
//           meetingTime: "7:00 PM",
//           description:
//             "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived. To see how things would be if you had made other choices... Would you have done anything different, if you had the chance to undo your regrets?",
//         },
//         history: [
//           {
//             title: "The Song of Achilles",
//             author: "Madeline Miller",
//             date: "April 2025",
//             cover: "/placeholder.svg?height=200&width=150",
//             rating: 4.5,
//             notes: "The group enjoyed the retelling...",
//           },
//           {
//             title: "Circe",
//             author: "Madeline Miller",
//             date: "March 2025",
//             cover: "/placeholder.svg?height=200&width=150",
//             rating: 4.2,
//             notes: "Members appreciated the feminist perspective...",
//           },
//           {
//             title: "The Vanishing Half",
//             author: "Brit Bennett",
//             date: "February 2025",
//             cover: "/placeholder.svg?height=200&width=150",
//             rating: 4.7,
//             notes: "Powerful discussions about identity...",
//           },
//         ],
//         discussions: [
//           { user: { name: "Alex Lee", avatar: "/placeholder.svg?height=40&width=40", initials: "AL", }, text: "I'm about halfway through...", timestamp: "2 days ago", },
//           { user: { name: "Sarah Johnson", avatar: "/placeholder.svg?height=40&width=40", initials: "SJ", }, text: "The way Matt Haig explores...", timestamp: "Yesterday", },
//           { user: { name: "Jane Doe", avatar: "/placeholder.svg?height=40&width=40", initials: "JD", }, text: "Just finished chapter 15...", timestamp: "5 hours ago", },
//         ],
//       };

//       // Simulate getting the current user's relation to this club
//       // In a real scenario, this would be part of your `/api/clubs/[id]` response
//       // For testing, change these values to see different UI states:
//       let dynamicMembershipStatus: ClubData['currentUserMembershipStatus'] = null; // null | 'PENDING' | 'ACTIVE'
//       let dynamicIsAdmin = false; // true if current user is owner or an admin role

//       // Example: Simulate user being an admin of 'Fiction Lovers' (params.id '1') and has pending members
//       if (params.id === "1") { // Assuming "1" is the ID of "Fiction Lovers" club (adjust if IDs are UUIDs)
//           dynamicIsAdmin = true;
//           dynamicMembershipStatus = 'ACTIVE'; // Assume current user is active member and admin
//       } else if (params.id === "2") { // Simulate user has pending application for club "2"
//           dynamicMembershipStatus = 'PENDING';
//       } else if (params.id === "3") { // Simulate user is active member for club "3"
//           dynamicMembershipStatus = 'ACTIVE';
//       }


//       const fullClubData: ClubData = {
//         ...baseMockClubData,
//         currentUserMembershipStatus: dynamicMembershipStatus,
//         currentUserIsAdmin: dynamicIsAdmin,
//         pendingMemberships: [], // Initialize empty, then fetch if admin
//       };

//       // If the current user is an admin, fetch pending memberships for this specific club
//       if (fullClubData.currentUserIsAdmin) {
//         try {
//           const pendingRes = await fetch(`/api/clubs/${params.id}/pending-memberships`);
//           if (!pendingRes.ok) {
//             console.error(`Failed to fetch pending memberships for club ${params.id}: ${pendingRes.statusText}`);
//             // If fetching pending fails, set it to empty array but don't block main club data
//           } else {
//             const pendingData: ClubMembershipRequest[] = await pendingRes.json();
//             fullClubData.pendingMemberships = pendingData;
//           }
//         } catch (err) {
//           console.error(`Error fetching pending for ${params.id}:`, err);
//           // Fallback to empty array on network/parsing error
//           fullClubData.pendingMemberships = [];
//         }
//       }

//       setClub(fullClubData);
//     } catch (err: any) {
//       toast.error(`Error fetching club details: ${err.message}`);
//       console.error("Error fetching club details:", err);
//       setClub(null); // Set to null on error
//     } finally {
//       setLoadingClub(false);
//     }
//   }, [params.id]); // Re-run if club ID changes

//   useEffect(() => {
//     fetchClubDetails();
//   }, [fetchClubDetails]); // Depend on memoized fetch function

//   // --- Integration for JOIN API (`/app/api/clubs/join`) ---
//   const handleJoinClub = async () => {
//     setLoadingAction(true);
//     try {
//       const response = await fetch('/api/clubs/join', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ clubId: club?.id }), // Use club?.id safely
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || "Failed to join club.");
//       }

//       const result = await response.json();
//       console.log("Join successful:", result);
//       toast.success("Successfully applied to join the club! Your request is pending approval.");

//       // After action, refetch club details to update UI state
//       await fetchClubDetails();

//     } catch (err: any) {
//       toast.error(`Error joining club: ${err.message}`);
//       console.error("Error joining club:", err);
//     } finally {
//       setLoadingAction(false);
//     }
//   };

//   // --- Integration for APPROVE API (`/app/api/clubs/approve`) ---
//   const handleApproveMembership = async (membershipId: string, applicantName: string) => {
//     setLoadingAction(true);
//     try {
//       const response = await fetch('/api/clubs/approve', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ membershipId: membershipId }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || "Failed to approve membership.");
//       }

//       const result = await response.json();
//       console.log("Approval successful:", result);
//       toast.success(`Successfully approved ${applicantName}'s membership!`);

//       // After action, refetch club details to update UI state (remove from pending, update member count)
//       await fetchClubDetails();

//     } catch (err: any) {
//       toast.error(`Error approving membership: ${err.message}`);
//       console.error("Error approving membership:", err);
//     } finally {
//       setLoadingAction(false);
//     }
//   };

//   // --- Loading State and Error Handling for UI ---
//   if (loadingClub) {
//     return (
//       <div className="flex items-center justify-center min-h-[50vh] text-lg text-muted-foreground">
//         <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading club details...
//       </div>
//     );
//   }

//   if (!club) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-[50vh] text-lg text-red-500">
//         <p>Club not found or an error occurred.</p>
//         <Button onClick={fetchClubDetails} className="mt-4">Retry Load</Button>
//       </div>
//     );
//   }

//   // --- Main Render Section ---
//   return (
//     <div className="space-y-8">
//       {/* Header Section */}
//       <div className="flex flex-col md:flex-row justify-between gap-4">
//         <div>
//           <div className="flex items-center gap-2">
//             <h1 className="text-3xl font-bold tracking-tight">{club.name}</h1>
//             {/* Display Admin badge if current user is an admin */}
//             {club.currentUserIsAdmin && (
//               <Badge variant="outline" className="ml-2">
//                 Admin
//               </Badge>
//             )}
//             {/* Conditional Badges for Membership Status */}
//             {club.currentUserMembershipStatus === 'ACTIVE' && (
//               <Badge className="bg-green-500 hover:bg-green-600 text-white ml-2">
//                 Member
//               </Badge>
//             )}
//             {club.currentUserMembershipStatus === 'PENDING' && (
//               <Badge variant="secondary" className="ml-2">
//                 Pending
//               </Badge>
//             )}
//           </div>
//           <p className="text-muted-foreground">{club.description}</p>
//         </div>
//         <div className="flex items-center gap-2">
//           {club.currentUserIsAdmin && (
//             <Button variant="outline" size="icon">
//               <Settings className="h-4 w-4" />
//             </Button>
//           )}

//           {/* Join/Apply Button (Conditional Rendering) */}
//           {/* Show only if current user is NOT an admin AND NOT an active member AND NOT currently pending */}
//           {!club.currentUserIsAdmin && club.currentUserMembershipStatus !== 'ACTIVE' && club.currentUserMembershipStatus !== 'PENDING' && (
//             <Button
//               onClick={handleJoinClub}
//               disabled={loadingAction}
//               className="bg-primary hover:bg-primary-light text-primary-foreground"
//             >
//               {loadingAction ? (
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//               ) : (
//                 <Plus className="mr-2 h-4 w-4" />
//               )}
//               Join Club
//             </Button>
//           )}
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <div className="md:col-span-2">
//           <Card>
//             <CardHeader>
//               <CardTitle>Current Book</CardTitle>
//               <CardDescription>What we're currently reading</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               <div className="flex flex-col md:flex-row gap-6">
//                 <div className="w-32 h-48 bg-muted/30 rounded-md flex items-center justify-center overflow-hidden mx-auto md:mx-0">
//                   <img
//                     src={club.currentBook.cover || "/placeholder.svg"}
//                     alt={`${club.currentBook.title} cover`}
//                     className="max-h-full"
//                   />
//                 </div>
//                 <div className="flex-1">
//                   <h3 className="text-xl font-bold">{club.currentBook.title}</h3>
//                   <p className="text-muted-foreground">{club.currentBook.author}</p>

//                   <div className="mt-4 space-y-2">
//                     <div className="flex justify-between text-sm">
//                       <span>Club Progress</span>
//                       <span className="font-medium">{club.currentBook.progress}%</span>
//                     </div>
//                     <Progress value={club.currentBook.progress} className="h-2 bg-muted" />
//                   </div>

//                   <div className="mt-4 grid grid-cols-2 gap-4">
//                     <div className="flex items-center gap-2">
//                       <CalendarDays className="h-5 w-5 text-muted-foreground" />
//                       <div>
//                         <p className="text-sm font-medium">Meeting Date</p>
//                         <p className="text-sm text-muted-foreground">{club.currentBook.meetingDate}</p>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <Clock className="h-5 w-5 text-muted-foreground" />
//                       <div>
//                         <p className="text-sm font-medium">Meeting Time</p>
//                         <p className="text-sm text-muted-foreground">{club.currentBook.meetingTime}</p>
//                       </div>
//                     </div>
//                   </div>

//                   <p className="mt-4 text-sm">{club.currentBook.description}</p>
//                 </div>
//               </div>
//             </CardContent>
//             <CardFooter className="flex justify-between">
//               <Button variant="outline">
//                 <BookOpen className="mr-2 h-4 w-4" /> Update Progress
//               </Button>
//               {club.currentUserIsAdmin && (
//                 <Button className="bg-primary hover:bg-primary-light text-primary-foreground">
//                   <CalendarDays className="mr-2 h-4 w-4" /> Manage Meeting
//                 </Button>
//               )}
//             </CardFooter>
//           </Card>

//           <div className="mt-6">
//             <Tabs defaultValue="discussions" className="space-y-4">
//               <TabsList className="bg-muted text-muted-foreground">
//                 <TabsTrigger
//                   value="discussions"
//                   className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
//                 >
//                   Discussions
//                 </TabsTrigger>
//                 <TabsTrigger
//                   value="history"
//                   className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
//                 >
//                   Book History
//                 </TabsTrigger>
//               </TabsList>

//               <TabsContent value="discussions">
//                 <Card>
//                   <CardHeader>
//                     <CardTitle>Book Discussions</CardTitle>
//                     <CardDescription>Share your thoughts on the current book</CardDescription>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="space-y-6">
//                       {club.discussions.map((discussion, i) => (
//                         <div key={i} className="flex gap-4">
//                           <Avatar className="h-10 w-10">
//                             <AvatarImage
//                               src={discussion.user.avatar || "/placeholder.svg"}
//                               alt={discussion.user.name}
//                             />
//                             <AvatarFallback className="bg-primary text-primary-foreground">
//                               {discussion.user.initials}
//                             </AvatarFallback>
//                           </Avatar>
//                           <div className="flex-1">
//                             <div className="flex items-center justify-between">
//                               <p className="font-medium">{discussion.user.name}</p>
//                               <p className="text-xs text-muted-foreground">{discussion.timestamp}</p>
//                             </div>
//                             <p className="text-sm mt-1">{discussion.text}</p>
//                           </div>
//                         </div>
//                       ))}
//                     </div>

//                     <Separator className="my-6" />

//                     <div className="flex gap-4">
//                       <Avatar className="h-10 w-10">
//                         <AvatarImage src="/placeholder.svg?height=40&width=40" alt="You" />
//                         <AvatarFallback className="bg-primary text-primary-foreground">JD</AvatarFallback>
//                       </Avatar>
//                       <div className="flex-1 space-y-2">
//                         <Textarea
//                           placeholder="Share your thoughts on the book..."
//                           value={comment}
//                           onChange={(e) => setComment(e.target.value)}
//                           className="min-h-[100px]"
//                         />
//                         <Button className="bg-primary hover:bg-primary-light text-primary-foreground">
//                           <MessageSquare className="mr-2 h-4 w-4" /> Post Comment
//                         </Button>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </TabsContent>

//               <TabsContent value="history">
//                 <Card>
//                   <CardHeader>
//                     <CardTitle>Book History</CardTitle>
//                     <CardDescription>Books we've read in the past</CardDescription>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="space-y-8">
//                       {club.history.map((book, i) => (
//                         <div key={i} className="flex flex-col md:flex-row gap-4 p-4 bg-muted/20 rounded-lg">
//                           <div className="w-24 h-36 bg-muted/30 rounded-md flex items-center justify-center overflow-hidden mx-auto md:mx-0">
//                             <img
//                               src={book.cover || "/placeholder.svg"}
//                               alt={`${book.title} cover`}
//                               className="max-h-full"
//                             />
//                           </div>
//                           <div className="flex-1">
//                             <div className="flex flex-col md:flex-row justify-between">
//                               <div>
//                                 <h3 className="text-lg font-bold">{book.title}</h3>
//                                 <p className="text-sm text-muted-foreground">{book.author}</p>
//                               </div>
//                               <div className="flex items-center gap-1 mt-2 md:mt-0">
//                                 <span className="text-sm font-medium">Rating:</span>
//                                 <span className="text-sm text-accent">{book.rating}/5</span>
//                               </div>
//                             </div>
//                             <p className="text-sm mt-2 text-muted-foreground">Read in {book.date}</p>
//                             <p className="text-sm mt-2">{book.notes}</p>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </CardContent>
//                 </Card>
//               </TabsContent>
//             </Tabs>
//           </div>
//         </div>

//         <div>
//           <Card>
//             <CardHeader>
//               <CardTitle>Club Members</CardTitle>
//               <CardDescription>{club.memberCount} members</CardDescription> {/* Updated to memberCount */}
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 {/* Dynamically display members based on club.memberCount */}
//                 {[...Array(Math.min(6, club.memberCount ?? 0))].map((_, i) => (
//                   <div key={i} className="flex items-center gap-3">
//                     <Avatar className="h-8 w-8">
//                       <AvatarImage src={`/placeholder.svg?height=32&width=32&text=${i + 1}`} alt="Member" />
//                       <AvatarFallback
//                         className={
//                           i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
//                         }
//                       >
//                         {String.fromCharCode(65 + i)}
//                       </AvatarFallback>
//                     </Avatar>
//                     <div>
//                       <p className="text-sm font-medium">
//                         {/* These member names are hardcoded, for real members you'd fetch a `club.members` array of user objects */}
//                         {["Jane Doe", "Alex Lee", "Sarah Johnson", "Mike Peterson", "Emma Wilson", "David Kim"][i]}
//                       </p>
//                       <p className="text-xs text-muted-foreground">
//                         {/* Member progress is hardcoded, would need real data */}
//                         {i === 0
//                           ? "Admin"
//                           : ["65% progress", "42% progress", "100% progress", "30% progress", "78% progress"][i - 1]}
//                       </p>
//                     </div>
//                   </div>
//                 ))}

//                 {/* Show "View All Members" button if more than 6 members */}
//                 {club.memberCount > 6 && (
//                   <Button variant="outline" className="w-full text-sm">
//                     View All Members
//                   </Button>
//                 )}
//               </div>
//             </CardContent>
//             <CardFooter>
//               <Button className="w-full bg-primary hover:bg-primary-light text-primary-foreground">
//                 <Plus className="mr-2 h-4 w-4" /> Invite Members
//               </Button>
//             </CardFooter>
//           </Card>

//           {/* --- NEW: Admin section for Pending Applications --- */}
//           {club.currentUserIsAdmin && club.pendingMemberships && club.pendingMemberships.length > 0 && (
//             <Card className="mt-6">
//               <CardHeader>
//                 <CardTitle>Pending Applications</CardTitle>
//                 <CardDescription>Review new membership requests for this club.</CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 {club.pendingMemberships.map((applicant) => (
//                   <div key={applicant.id} className="flex items-center justify-between p-2 border rounded-md">
//                     <div className="flex items-center gap-3">
//                       <Avatar className="h-8 w-8">
//                         <AvatarImage src={applicant.userAvatar || "/placeholder.svg"} alt={applicant.userName} />
//                         <AvatarFallback className="bg-blue-500 text-white">
//                           {applicant.userInitials}
//                         </AvatarFallback>
//                       </Avatar>
//                       <div>
//                         <p className="text-sm font-medium">{applicant.userName}</p>
//                         <p className="text-xs text-muted-foreground">Applied {new Date(applicant.appliedAt).toLocaleDateString()}</p>
//                       </div>
//                     </div>
//                     <Button
//                       onClick={() => handleApproveMembership(club.id, applicant.id, applicant.userName)}
//                       disabled={loadingAction}
//                       size="sm"
//                       className="bg-green-500 hover:bg-green-600 text-white"
//                     >
//                       {loadingAction ? (
//                         <Loader2 className="h-4 w-4 animate-spin" />
//                       ) : (
//                         <Check className="mr-1 h-4 w-4" />
//                       )}
//                       Approve
//                     </Button>
//                   </div>
//                 ))}
//               </CardContent>
//             </Card>
//           )}
//           {/* --- END NEW SECTION --- */}

//           <Card className="mt-6">
//             <CardHeader>
//               <CardTitle>Upcoming Meetings</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 <div className="bg-muted/20 p-4 rounded-lg">
//                   <div className="flex items-center justify-between mb-2">
//                     <h3 className="font-medium">{club.currentBook.title}</h3>
//                     <Badge variant="outline">Next</Badge>
//                   </div>
//                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
//                     <CalendarDays className="h-4 w-4" />
//                     <span>{club.currentBook.meetingDate}</span>
//                   </div>
//                   <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
//                     <Clock className="h-4 w-4" />
//                     <span>{club.currentBook.meetingTime}</span>
//                   </div>
//                   <Button variant="outline" size="sm" className="w-full mt-3">
//                     View Details
//                   </Button>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   )
// }

"use client"

import { useState, useEffect, useCallback } from "react" // Added useEffect, useCallback
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BookOpen, CalendarDays, Plus, Settings, MessageSquare, Clock, Loader2, Check } from "lucide-react" // Added Loader2, Check
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"; // Assuming sonner for toasts

// --- Define Interfaces (copied from previous thought, ensure consistency) ---
interface Discussion {
  user: {
    name: string;
    avatar: string | null;
    initials: string;
  };
  text: string;
  timestamp: string;
}

interface BookHistoryEntry {
  title: string;
  author: string;
  date: string;
  cover: string;
  rating: number;
  notes: string;
}

interface CurrentBookDetails {
  title: string;
  author: string;
  cover: string;
  progress: number;
  meetingDate: string;
  meetingTime: string;
  description: string;
}

interface ClubMembershipRequest {
  id: string; // This is the membershipId (UUID) needed for the approve API
  userId: string; // Applicant's User ID (UUID)
  userName: string;
  userAvatar: string | null;
  userInitials: string;
  appliedAt: string; // ISO string
  status: 'PENDING' | 'ACTIVE'; // Status of this specific request
}

// Full Club data structure for the detail page - MUST MATCH API RESPONSE EXACTLY
interface ClubData {
  id: string; // Club ID (UUID)
  name: string;
  description: string;
  memberCount: number; // Using memberCount from your schema suggestion
  ownerId: string; // The ID of the club owner

  // Current user's specific relationship to *this* club (these come from backend)
  currentUserMembershipStatus: 'ACTIVE' | 'PENDING' | 'REJECTED' | 'LEFT' | null;
  currentUserIsAdmin: boolean; // True if current user is owner_id or an ADMIN role for this club

  currentBook: CurrentBookDetails;
  history: BookHistoryEntry[];
  discussions: Discussion[];
  pendingMemberships?: ClubMembershipRequest[]; // Populated only if currentUserIsAdmin is true
}


export default function ClubDetailPage({ params }: { params: { id: string } }) {
  const [comment, setComment] = useState("");
  const [club, setClub] = useState<ClubData | null>(null); // Club data, initially null
  const [loadingClub, setLoadingClub] = useState(true); // Loading state for initial club data fetch
  const [loadingAction, setLoadingAction] = useState(false); // Loading state for join/approve actions

  // Function to fetch full club details from the API
  const fetchClubDetails = useCallback(async () => {
    setLoadingClub(true);
    try {
      const response = await fetch(`/api/clubs/${params.id}`); // Call your new API endpoint
      if (!response.ok) {
        throw new Error(`Failed to fetch club data: ${response.statusText}`);
      }
      const data: ClubData = await response.json(); // Cast to ClubData interface
      setClub(data);
    } catch (err: any) {
      toast.error(`Error fetching club details: ${err.message}`);
      console.error("Error fetching club details:", err);
      setClub(null); // Set to null on error
    } finally {
      setLoadingClub(false);
    }
  }, [params.id]); // Re-run if club ID changes

  // Initial data load on component mount
  useEffect(() => {
    fetchClubDetails();
  }, [fetchClubDetails]); // Depend on memoized fetch function

  // --- Integration for JOIN API (`/app/api/clubs/join`) ---
  const handleJoinClub = async () => {
    setLoadingAction(true);
    try {
      if (!club) {
        toast.error("Club data not loaded yet.");
        return;
      }
      const response = await fetch('/api/clubs/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clubId: club.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to join club.");
      }

      const result = await response.json();
      console.log("Join successful:", result);
      toast.success("Successfully applied to join the club! Your request is pending approval.");

      // After action, refetch club details to update UI state
      await fetchClubDetails();

    } catch (err: any) {
      toast.error(`Error joining club: ${err.message}`);
      console.error("Error joining club:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  // --- Integration for APPROVE API (`/app/api/clubs/approve`) ---
  const handleApproveMembership = async (membershipId: string, applicantName: string) => {
    setLoadingAction(true);
    try {
      if (!club) {
        toast.error("Club data not loaded yet.");
        return;
      }
      const response = await fetch('/api/clubs/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ membershipId: membershipId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to approve membership.");
      }

      const result = await response.json();
      console.log("Approval successful:", result);
      toast.success(`Successfully approved ${applicantName}'s membership!`);

      // After action, refetch club details to update UI state (remove from pending, update member count)
      await fetchClubDetails();

    } catch (err: any) {
      toast.error(`Error approving membership: ${err.message}`);
      console.error("Error approving membership:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  // --- Loading State and Error Handling for UI ---
  if (loadingClub) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-lg text-muted-foreground">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading club details...
      </div>
    );
  }

  if (!club) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-lg text-red-500">
        <p>Club not found or an error occurred.</p>
        <Button onClick={fetchClubDetails} className="mt-4">Retry Load</Button>
      </div>
    );
  }

  // --- Main Render Section ---
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{club.name}</h1>
            {/* Display Admin badge if current user is an admin */}
            {club.currentUserIsAdmin && (
              <Badge variant="outline" className="ml-2">
                Admin
              </Badge>
            )}
            {/* Conditional Badges for Membership Status */}
            {club.currentUserMembershipStatus === 'ACTIVE' && (
              <Badge className="bg-green-500 hover:bg-green-600 text-white ml-2">
                Member
              </Badge>
            )}
            {club.currentUserMembershipStatus === 'PENDING' && (
              <Badge variant="secondary" className="ml-2">
                Pending
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{club.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {club.currentUserIsAdmin && (
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          )}

          {/* Join/Apply Button (Conditional Rendering) */}
          {/* Show only if current user is NOT an admin AND NOT an active member AND NOT currently pending */}
          {!club.currentUserIsAdmin && club.currentUserMembershipStatus !== 'ACTIVE' && club.currentUserMembershipStatus !== 'PENDING' && (
            <Button
              onClick={handleJoinClub}
              disabled={loadingAction}
              className="bg-primary hover:bg-primary-light text-primary-foreground"
            >
              {loadingAction ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Join Club
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Current Book</CardTitle>
              <CardDescription>What we're currently reading</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-32 h-48 bg-muted/30 rounded-md flex items-center justify-center overflow-hidden mx-auto md:mx-0">
                  <img
                    src={club.currentBook.cover || "/placeholder.svg"}
                    alt={`${club.currentBook.title} cover`}
                    className="max-h-full"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{club.currentBook.title}</h3>
                  <p className="text-muted-foreground">{club.currentBook.author}</p>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Club Progress</span>
                      <span className="font-medium">{club.currentBook.progress}%</span>
                    </div>
                    <Progress value={club.currentBook.progress} className="h-2 bg-muted" />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Meeting Date</p>
                        <p className="text-sm text-muted-foreground">{club.currentBook.meetingDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Meeting Time</p>
                        <p className="text-sm text-muted-foreground">{club.currentBook.meetingTime}</p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-sm">{club.currentBook.description}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">
                <BookOpen className="mr-2 h-4 w-4" /> Update Progress
              </Button>
              {club.currentUserIsAdmin && (
                <Button className="bg-primary hover:bg-primary-light text-primary-foreground">
                  <CalendarDays className="mr-2 h-4 w-4" /> Manage Meeting
                </Button>
              )}
            </CardFooter>
          </Card>

          <div className="mt-6">
            <Tabs defaultValue="discussions" className="space-y-4">
              <TabsList className="bg-muted text-muted-foreground">
                <TabsTrigger
                  value="discussions"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Discussions
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Book History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="discussions">
                <Card>
                  <CardHeader>
                    <CardTitle>Book Discussions</CardTitle>
                    <CardDescription>Share your thoughts on the current book</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {club.discussions.map((discussion, i) => (
                        <div key={i} className="flex gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={discussion.user.avatar || "/placeholder.svg"}
                              alt={discussion.user.name}
                            />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {discussion.user.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{discussion.user.name}</p>
                              <p className="text-xs text-muted-foreground">{discussion.timestamp}</p>
                            </div>
                            <p className="text-sm mt-1">{discussion.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-6" />

                    <div className="flex gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder.svg?height=40&width=40" alt="You" />
                        <AvatarFallback className="bg-primary text-primary-foreground">JD</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <Textarea
                          placeholder="Share your thoughts on the book..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="min-h-[100px]"
                        />
                        <Button className="bg-primary hover:bg-primary-light text-primary-foreground">
                          <MessageSquare className="mr-2 h-4 w-4" /> Post Comment
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Book History</CardTitle>
                    <CardDescription>Books we've read in the past</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {club.history.map((book, i) => (
                        <div key={i} className="flex flex-col md:flex-row gap-4 p-4 bg-muted/20 rounded-lg">
                          <div className="w-24 h-36 bg-muted/30 rounded-md flex items-center justify-center overflow-hidden mx-auto md:mx-0">
                            <img
                              src={book.cover || "/placeholder.svg"}
                              alt={`${book.title} cover`}
                              className="max-h-full"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-col md:flex-row justify-between">
                              <div>
                                <h3 className="text-lg font-bold">{book.title}</h3>
                                <p className="text-sm text-muted-foreground">{book.author}</p>
                              </div>
                              <div className="flex items-center gap-1 mt-2 md:mt-0">
                                <span className="text-sm font-medium">Rating:</span>
                                <span className="text-sm text-accent">{book.rating}/5</span>
                              </div>
                            </div>
                            <p className="text-sm mt-2 text-muted-foreground">Read in {book.date}</p>
                            <p className="text-sm mt-2">{book.notes}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Club Members</CardTitle>
              <CardDescription>{club.memberCount} members</CardDescription> {/* Updated to memberCount */}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Dynamically display members based on club.memberCount */}
                {[...Array(Math.min(6, club.memberCount ?? 0))].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {/* For real members, you'd iterate over an array of `club.members`
                          each with their own avatar/name properties, fetched from the backend. */}
                      <AvatarImage src={`/placeholder.svg?height=32&width=32&text=${String.fromCharCode(65 + i)}`} alt="Member" />
                      <AvatarFallback
                        className={
                          i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                        }
                      >
                        {String.fromCharCode(65 + i)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {/* These member names are hardcoded. */}
                        {["Jane Doe", "Alex Lee", "Sarah Johnson", "Mike Peterson", "Emma Wilson", "David Kim"][i]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {/* Member progress is hardcoded. */}
                        {i === 0
                          ? "Admin"
                          : ["65% progress", "42% progress", "100% progress", "30% progress", "78% progress"][i - 1]}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Show "View All Members" button if more than 6 members */}
                {club.memberCount > 6 && (
                  <Button variant="outline" className="w-full text-sm">
                    View All Members
                  </Button>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-primary hover:bg-primary-light text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> Invite Members
              </Button>
            </CardFooter>
          </Card>

          {/* --- NEW: Admin section for Pending Applications --- */}
          {club.currentUserIsAdmin && club.pendingMemberships && club.pendingMemberships.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Pending Applications</CardTitle>
                <CardDescription>Review new membership requests for this club.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {club.pendingMemberships.map((applicant) => (
                  <div key={applicant.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={applicant.userAvatar || "/placeholder.svg"} alt={applicant.userName} />
                        <AvatarFallback className="bg-blue-500 text-white">
                          {applicant.userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{applicant.userName}</p>
                        <p className="text-xs text-muted-foreground">Applied {new Date(applicant.appliedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleApproveMembership(applicant.id, applicant.userName)} // Pass only membershipId and name
                      disabled={loadingAction}
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      {loadingAction ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-1 h-4 w-4" />
                      )}
                      Approve
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {/* --- END NEW SECTION --- */}

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Upcoming Meetings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{club.currentBook.title}</h3>
                    <Badge variant="outline">Next</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span>{club.currentBook.meetingDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Clock className="h-4 w-4" />
                    <span>{club.currentBook.meetingTime}</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}