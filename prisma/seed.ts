const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Achievement criteria interface
interface AchievementCriteria {
  type: 'books_read' | 'genre_diversity' | 'social_activity' | 'club_participation' | 'reviews_written' | 'recommendations_sent' | 'special_event';
  threshold?: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time';
  conditions?: {
    genre_count?: number;
    activity_types?: string[];
    club_actions?: string[];
    review_rating?: 'positive' | 'any';
    book_pages_min?: number;
    event_type?: string;
  };
}

// Predefined achievements data
const PREDEFINED_ACHIEVEMENTS = [
  // READING MILESTONE ACHIEVEMENTS (5 achievements)
  {
    name: "First Steps",
    description: "Read your first book",
    icon: "📚",
    category: "READING_MILESTONE",
    difficulty: "BRONZE",
    points: 10,
    criteria: {
      type: "books_read",
      threshold: 1,
      timeframe: "all_time"
    } as AchievementCriteria
  },
  {
    name: "Book Lover",
    description: "Read 10 books",
    icon: "📖",
    category: "READING_MILESTONE",
    difficulty: "BRONZE",
    points: 50,
    criteria: {
      type: "books_read",
      threshold: 10,
      timeframe: "all_time"
    } as AchievementCriteria
  },
  {
    name: "Bookworm",
    description: "Read 50 books",
    icon: "🐛",
    category: "READING_MILESTONE",
    difficulty: "SILVER",
    points: 200,
    criteria: {
      type: "books_read",
      threshold: 50,
      timeframe: "all_time"
    } as AchievementCriteria
  },
  {
    name: "Literary Master",
    description: "Read 100 books",
    icon: "🏆",
    category: "READING_MILESTONE",
    difficulty: "GOLD",
    points: 500,
    criteria: {
      type: "books_read",
      threshold: 100,
      timeframe: "all_time"
    } as AchievementCriteria
  },
  {
    name: "Reading Legend",
    description: "Read 500 books",
    icon: "👑",
    category: "READING_MILESTONE",
    difficulty: "DIAMOND",
    points: 2000,
    criteria: {
      type: "books_read",
      threshold: 500,
      timeframe: "all_time"
    } as AchievementCriteria
  },

  // RECOMMENDATION ACHIEVEMENTS (3 achievements)
  {
    name: "Sharing is Caring",
    description: "Send your first book recommendation",
    icon: "💌",
    category: "RECOMMENDER",
    difficulty: "BRONZE",
    points: 15,
    criteria: {
      type: "recommendations_sent",
      threshold: 1,
      timeframe: "all_time"
    } as AchievementCriteria
  },
  {
    name: "Book Recommender",
    description: "Send 5 book recommendations",
    icon: "🎯",
    category: "RECOMMENDER",
    difficulty: "BRONZE",
    points: 30,
    criteria: {
      type: "recommendations_sent",
      threshold: 5,
      timeframe: "all_time"
    } as AchievementCriteria
  },
  {
    name: "Recommendation Expert",
    description: "Send 25 book recommendations",
    icon: "🏅",
    category: "RECOMMENDER",
    difficulty: "SILVER",
    points: 100,
    criteria: {
      type: "recommendations_sent",
      threshold: 25,
      timeframe: "all_time"
    } as AchievementCriteria
  },

  // FUTURE IMPLEMENTATIONS - COMMENTED OUT FOR LATER
  
  // GENRE EXPLORATION ACHIEVEMENTS (Future Implementation)
  /*
  {
    name: "Genre Explorer",
    description: "Read books from 5 different genres",
    icon: "🗺️",
    category: "GENRE_EXPLORER",
    difficulty: "BRONZE",
    points: 25,
    criteria: {
      type: "genre_diversity",
      threshold: 5,
      timeframe: "all_time"
    } as AchievementCriteria
  },
  {
    name: "Literary Wanderer",
    description: "Read books from 10 different genres",
    icon: "🧭",
    category: "GENRE_EXPLORER",
    difficulty: "SILVER",
    points: 75,
    criteria: {
      type: "genre_diversity",
      threshold: 10,
      timeframe: "all_time"
    } as AchievementCriteria
  },
  {
    name: "Genre Master",
    description: "Read books from 20 different genres",
    icon: "🎭",
    category: "GENRE_EXPLORER",
    difficulty: "GOLD",
    points: 150,
    criteria: {
      type: "genre_diversity",
      threshold: 20,
      timeframe: "all_time"
    } as AchievementCriteria
  },
  */

  // CLUB PARTICIPATION ACHIEVEMENTS (Future Implementation)
  /*
  {
    name: "Club Newbie",
    description: "Join your first book club",
    icon: "👥",
    category: "CLUB_MEMBER",
    difficulty: "BRONZE",
    points: 20,
    criteria: {
      type: "club_participation",
      threshold: 1,
      timeframe: "all_time",
      conditions: {
        club_actions: ["join"]
      }
    } as AchievementCriteria
  },
  {
    name: "Discussion Leader",
    description: "Start 5 club discussions",
    icon: "💬",
    category: "CLUB_MEMBER",
    difficulty: "SILVER",
    points: 60,
    criteria: {
      type: "club_participation",
      threshold: 5,
      timeframe: "all_time",
      conditions: {
        club_actions: ["start_discussion"]
      }
    } as AchievementCriteria
  },
  {
    name: "Club Veteran",
    description: "Be active in clubs for 6 months",
    icon: "🏛️",
    category: "CLUB_MEMBER",
    difficulty: "GOLD",
    points: 200,
    criteria: {
      type: "club_participation",
      threshold: 6,
      timeframe: "all_time",
      conditions: {
        club_actions: ["monthly_activity"]
      }
    } as AchievementCriteria
  },
  */

  // REVIEW ACHIEVEMENTS (Future Implementation)
  /*
  {
    name: "First Critic",
    description: "Write your first book review",
    icon: "✍️",
    category: "REVIEWER",
    difficulty: "BRONZE",
    points: 15,
    criteria: {
      type: "reviews_written",
      threshold: 1,
      timeframe: "all_time"
    } as AchievementCriteria
  },
  {
    name: "Review Writer",
    description: "Write 10 book reviews",
    icon: "📝",
    category: "REVIEWER",
    difficulty: "BRONZE",
    points: 40,
    criteria: {
      type: "reviews_written",
      threshold: 10,
      timeframe: "all_time"
    } as AchievementCriteria
  },
  {
    name: "Book Critic",
    description: "Write 50 book reviews",
    icon: "🎭",
    category: "REVIEWER",
    difficulty: "SILVER",
    points: 100,
    criteria: {
      type: "reviews_written",
      threshold: 50,
      timeframe: "all_time"
    } as AchievementCriteria
  },
  {
    name: "Master Reviewer",
    description: "Write 100 book reviews",
    icon: "🏆",
    category: "REVIEWER",
    difficulty: "GOLD",
    points: 250,
    criteria: {
      type: "reviews_written",
      threshold: 100,
      timeframe: "all_time"
    } as AchievementCriteria
  },
  */

  // ADDITIONAL SOCIAL ACTIVITIES (Future Implementation)
  /*
  {
    name: "Social Reader",
    description: "Complete 5 social activities (likes, comments, shares)",
    icon: "👍",
    category: "SOCIAL_BUTTERFLY",
    difficulty: "BRONZE",
    points: 25,
    criteria: {
      type: "social_activity",
      threshold: 5,
      timeframe: "all_time",
      conditions: {
        activity_types: ["like", "comment", "share"]
      }
    } as AchievementCriteria
  },
  {
    name: "Community Builder",
    description: "Complete 25 social activities",
    icon: "🤝",
    category: "SOCIAL_BUTTERFLY",
    difficulty: "SILVER",
    points: 75,
    criteria: {
      type: "social_activity",
      threshold: 25,
      timeframe: "all_time",
      conditions: {
        activity_types: ["like", "comment", "share", "follow"]
      }
    } as AchievementCriteria
  },
  {
    name: "Social Influencer",
    description: "Complete 100 social activities",
    icon: "🌟",
    category: "SOCIAL_BUTTERFLY",
    difficulty: "GOLD",
    points: 200,
    criteria: {
      type: "social_activity",
      threshold: 100,
      timeframe: "all_time",
      conditions: {
        activity_types: ["like", "comment", "share", "follow", "recommend"]
      }
    } as AchievementCriteria
  },
  */

  // SPECIAL EVENTS ACHIEVEMENTS (Future Implementation)
  /*
  {
    name: "Reading Challenge Participant",
    description: "Join a special reading challenge",
    icon: "🎯",
    category: "SPECIAL_EVENT",
    difficulty: "BRONZE",
    points: 30,
    criteria: {
      type: "special_event",
      threshold: 1,
      timeframe: "all_time",
      conditions: {
        event_type: "reading_challenge"
      }
    } as AchievementCriteria
  },
  {
    name: "Challenge Completionist",
    description: "Complete a special reading challenge",
    icon: "🏅",
    category: "SPECIAL_EVENT",
    difficulty: "SILVER",
    points: 100,
    criteria: {
      type: "special_event",
      threshold: 1,
      timeframe: "all_time",
      conditions: {
        event_type: "challenge_completion"
      }
    } as AchievementCriteria
  },
  {
    name: "Event Enthusiast",
    description: "Participate in 5 special events",
    icon: "🎪",
    category: "SPECIAL_EVENT",
    difficulty: "GOLD",
    points: 250,
    criteria: {
      type: "special_event",
      threshold: 5,
      timeframe: "all_time",
      conditions: {
        event_type: "any_event"
      }
    } as AchievementCriteria
  }
  */
];

// Seed achievements function
const seedAchievements = async (prisma: any) => {
  console.log('Seeding achievements...');
  
  for (const achievement of PREDEFINED_ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: {},
      create: {
        ...achievement,
        criteria: achievement.criteria
      }
    });
  }
  
  console.log(`Seeded ${PREDEFINED_ACHIEVEMENTS.length} achievements`);
};

// Main seeding function
async function main() {
  console.log('Starting database seed...');
  
  // Seed achievements
  await seedAchievements(prisma);
  
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 