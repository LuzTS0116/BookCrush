import { prisma } from '@/lib/prisma';

export interface CustomGoalData {
  id: string;
  name: string;
  description?: string;
  target_books: number;
  time_period: string;
  status: string;
  current_progress: number;
  start_date: string;
  end_date: string;
  completed_at?: string;
  created_at: string;
  progress: {
    current_value: number;
    target_value: number;
    progress_percentage: number;
  };
  is_completed: boolean;
}

export class CustomGoalsService {
  // Map time periods to readable labels
  private static timeLabels = {
    'ONE_MONTH': '1 month',
    'THREE_MONTHS': '3 months', 
    'SIX_MONTHS': '6 months',
    'ONE_YEAR': '1 year'
  };

  // Map time periods to days
  private static periodDays = {
    'ONE_MONTH': 30,
    'THREE_MONTHS': 90,
    'SIX_MONTHS': 180,
    'ONE_YEAR': 365
  };

  /**
   * Get all custom goals for a user
   */
  static async getUserCustomGoals(userId: string): Promise<CustomGoalData[]> {
    const goals = await prisma.customGoal.findMany({
      where: {
        user_id: userId,
        status: {
          in: ['ACTIVE', 'COMPLETED']
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return goals.map(goal => this.transformGoalToData(goal));
  }

  /**
   * Create a new custom goal
   */
  static async createCustomGoal(
    userId: string, 
    targetBooks: number, 
    timePeriod: string
  ): Promise<CustomGoalData> {
    // Validate input
    if (targetBooks < 1 || targetBooks > 1000) {
      throw new Error('Target books must be between 1 and 1000');
    }

    const validPeriods = ['ONE_MONTH', 'THREE_MONTHS', 'SIX_MONTHS', 'ONE_YEAR'];
    if (!validPeriods.includes(timePeriod)) {
      throw new Error('Invalid time period');
    }

    // Check if user already has too many active goals (limit to 5)
    const activeGoalsCount = await prisma.customGoal.count({
      where: {
        user_id: userId,
        status: 'ACTIVE'
      }
    });

    if (activeGoalsCount >= 5) {
      throw new Error('Maximum of 5 active goals allowed');
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    const days = this.periodDays[timePeriod as keyof typeof this.periodDays];
    endDate.setDate(startDate.getDate() + days);

    // Generate goal name and description
    const timeLabel = this.timeLabels[timePeriod as keyof typeof this.timeLabels];
    const bookWord = targetBooks === 1 ? "book" : "books";
    const goalName = `Read ${targetBooks} ${bookWord} in ${timeLabel}`;
    const goalDescription = `Read ${targetBooks} ${bookWord} within ${timeLabel}`;

    const goal = await prisma.customGoal.create({
      data: {
        user_id: userId,
        name: goalName,
        description: goalDescription,
        target_books: targetBooks,
        time_period: timePeriod as any,
        start_date: startDate,
        end_date: endDate,
        current_progress: 0,
        status: 'ACTIVE'
      }
    });

    return this.transformGoalToData(goal);
  }

  /**
   * Update a custom goal
   */
  static async updateCustomGoal(
    goalId: string,
    userId: string,
    targetBooks: number,
    timePeriod: string
  ): Promise<CustomGoalData> {
    // First verify the goal belongs to the user
    const existingGoal = await prisma.customGoal.findFirst({
      where: {
        id: goalId,
        user_id: userId
      }
    });

    if (!existingGoal) {
      throw new Error('Goal not found or access denied');
    }

    if (existingGoal.status === 'COMPLETED') {
      throw new Error('Cannot update completed goals');
    }

    // Validate input
    if (targetBooks < 1 || targetBooks > 1000) {
      throw new Error('Target books must be between 1 and 1000');
    }

    const validPeriods = ['ONE_MONTH', 'THREE_MONTHS', 'SIX_MONTHS', 'ONE_YEAR'];
    if (!validPeriods.includes(timePeriod)) {
      throw new Error('Invalid time period');
    }

    // Recalculate end date based on original start date
    const endDate = new Date(existingGoal.start_date);
    const days = this.periodDays[timePeriod as keyof typeof this.periodDays];
    endDate.setDate(endDate.getDate() + days);

    // Update goal name and description
    const timeLabel = this.timeLabels[timePeriod as keyof typeof this.timeLabels];
    const bookWord = targetBooks === 1 ? "book" : "books";
    const goalName = `Read ${targetBooks} ${bookWord} in ${timeLabel}`;
    const goalDescription = `Read ${targetBooks} ${bookWord} within ${timeLabel}`;

    const updatedGoal = await prisma.customGoal.update({
      where: { id: goalId },
      data: {
        name: goalName,
        description: goalDescription,
        target_books: targetBooks,
        time_period: timePeriod as any,
        end_date: endDate
      }
    });

    return this.transformGoalToData(updatedGoal);
  }

  /**
   * Delete a custom goal
   */
  static async deleteCustomGoal(goalId: string, userId: string): Promise<void> {
    const goal = await prisma.customGoal.findFirst({
      where: {
        id: goalId,
        user_id: userId
      }
    });

    if (!goal) {
      throw new Error('Goal not found or access denied');
    }

    await prisma.customGoal.delete({
      where: { id: goalId }
    });
  }

  /**
   * Update progress for all active custom goals when a user finishes a book
   */
  static async updateCustomGoalProgress(userId: string, incrementBy: number = 1): Promise<void> {
    const activeGoals = await prisma.customGoal.findMany({
      where: {
        user_id: userId,
        status: 'ACTIVE',
        end_date: {
          gte: new Date() // Goals that haven't expired
        }
      }
    });

    for (const goal of activeGoals) {
      const newProgress = goal.current_progress + incrementBy;
      const isCompleted = newProgress >= goal.target_books;

      await prisma.customGoal.update({
        where: { id: goal.id },
        data: {
          current_progress: Math.min(newProgress, goal.target_books),
          status: isCompleted ? 'COMPLETED' : 'ACTIVE',
          completed_at: isCompleted ? new Date() : null
        }
      });
    }

    // Mark expired goals
    await this.markExpiredGoals(userId);
  }

  /**
   * Mark expired goals as EXPIRED
   */
  static async markExpiredGoals(userId: string): Promise<void> {
    await prisma.customGoal.updateMany({
      where: {
        user_id: userId,
        status: 'ACTIVE',
        end_date: {
          lt: new Date()
        }
      },
      data: {
        status: 'EXPIRED'
      }
    });
  }

  /**
   * Transform database goal to API format
   */
  private static transformGoalToData(goal: any): CustomGoalData {
    const progressPercentage = goal.target_books > 0 
      ? Math.round((goal.current_progress / goal.target_books) * 100) 
      : 0;

    return {
      id: goal.id,
      name: goal.name,
      description: goal.description,
      target_books: goal.target_books,
      time_period: goal.time_period,
      status: goal.status,
      current_progress: goal.current_progress,
      start_date: goal.start_date.toISOString(),
      end_date: goal.end_date.toISOString(),
      completed_at: goal.completed_at?.toISOString(),
      created_at: goal.created_at.toISOString(),
      progress: {
        current_value: goal.current_progress,
        target_value: goal.target_books,
        progress_percentage: progressPercentage
      },
      is_completed: goal.status === 'COMPLETED'
    };
  }
} 