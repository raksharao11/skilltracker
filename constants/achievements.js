export const ALL_ACHIEVEMENTS = [
    // --- Streak-Based Badges ---
    {
      id: 'habit_spark',
      name: 'Habit Spark',
      description: 'Complete tasks for 3 days straight.',
      icon: '🔥',
      category: 'streak',
      criteriaType: 'streak_days',
      criteriaValue: 3,
      isVerified: false, // Default to false, will be true when quiz/time-on-task is implemented
      progressFieldName: 'currentStreak', // Field in user's daily progress to check against
    },
    {
      id: 'rhythm_seeker',
      name: 'Rhythm Seeker',
      description: 'Achieve a 7-day verified streak.',
      icon: '🎶',
      category: 'streak',
      criteriaType: 'streak_days',
      criteriaValue: 7,
      isVerified: true, // This will require verification later
      progressFieldName: 'currentStreak',
    },
    {
      id: 'flow_state',
      name: 'Flow State',
      description: 'Achieve a 14-day verified streak.',
      icon: '💧',
      category: 'streak',
      criteriaType: 'streak_days',
      criteriaValue: 14,
      isVerified: true,
      progressFieldName: 'currentStreak',
    },
    {
      id: 'unbroken_chain',
      name: 'Unbroken Chain',
      description: 'Achieve a 30-day streak.',
      icon: '⛓️',
      category: 'streak',
      criteriaType: 'streak_days',
      criteriaValue: 30,
      isVerified: false, // Can be true later
      progressFieldName: 'currentStreak',
    },
    // 'Master of Discipline' (90-day streak with 80% quiz pass rate) will be added later, as it requires quiz logic
    // For now, let's keep it simpler for initial implementation
  
    // --- Task Completion Milestones ---
    {
      id: 'task_initiate',
      name: 'Task Initiate',
      description: 'Complete your first verified task.',
      icon: '🪄',
      category: 'task_completion',
      criteriaType: 'total_tasks',
      criteriaValue: 1,
      isVerified: true, // This will imply that task needs to be verified
      progressFieldName: 'totalTasksCompleted', // Field in user's general stats
    },
    {
      id: 'daily_dynamo',
      name: 'Daily Dynamo',
      description: 'Achieve 5 days of 100% daily task completion.',
      icon: '🔄',
      category: 'task_completion',
      criteriaType: 'perfect_days',
      criteriaValue: 5,
      isVerified: true, // This implies perfect days also need verification
      progressFieldName: 'perfectDaysCount',
    },
    {
      id: 'momentum_rider',
      name: 'Momentum Rider',
      description: 'Complete 20 tasks with proof.',
      icon: '🧭',
      category: 'task_completion',
      criteriaType: 'total_tasks',
      criteriaValue: 20,
      isVerified: true,
      progressFieldName: 'totalTasksCompleted',
    },
    {
      id: 'relentless',
      name: 'Relentless',
      description: 'Complete 50 tasks.',
      icon: '🦾',
      category: 'task_completion',
      criteriaType: 'total_tasks',
      criteriaValue: 50,
      isVerified: false, // Can be true later
      progressFieldName: 'totalTasksCompleted',
    },
    {
      id: 'zero_inbox',
      name: 'Zero Inbox',
      description: 'Finish an entire roadmap on time.',
      icon: '📂',
      category: 'roadmap',
      criteriaType: 'roadmap_completed',
      criteriaValue: 1,
      isVerified: false, // For now, just completing a roadmap will trigger
      progressFieldName: 'totalRoadmapsCompleted',
    },
  
    // --- Topic Mastery Badges (Initial ones will be based on quizzes, so we'll add placeholders for now) ---
    // These will fully implemented once the quiz generation and validation is ready
    {
      id: 'first_spark_quiz',
      name: 'First Spark',
      description: 'Pass your first quiz on any roadmap topic.',
      icon: '✨',
      category: 'topic_mastery',
      criteriaType: 'quizzes_passed',
      criteriaValue: 1,
      isVerified: true, // By nature, this requires quiz completion
      progressFieldName: 'quizzesPassedCount',
    },
    // 'Concept Cracker', 'Core Mastery', 'The Synthesizer' will follow the same pattern
  ];