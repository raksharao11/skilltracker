// utils/achievementUtils.js
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, runTransaction, collection, arrayUnion } from 'firebase/firestore';
import { ALL_ACHIEVEMENTS } from '../constants/achievements';
import { isToday, isYesterday, format } from 'date-fns'; // Make sure date-fns is installed: npm install date-fns

/**
 * Ensures a user's progress document exists and initializes it if not.
 * @param {string} userId - The ID of the current user.
 */
export const initializeUserProgress = async (userId) => {
  const userProgressRef = doc(db, 'users', userId, 'progress', 'userProgress'); // Changed to a subcollection document to simplify path
  const userAchievementsCollectionRef = collection(db, 'users', userId, 'achievements');

  try {
    const docSnap = await getDoc(userProgressRef);

    if (!docSnap.exists()) {
      // Initialize new user progress
      await setDoc(userProgressRef, {
        userId: userId,
        lastTaskCompletionDate: null,
        currentStreak: 0,
        longestStreak: 0,
        totalTasksCompleted: 0,
        perfectDaysCount: 0,
        quizzesPassedCount: 0,
        totalRoadmapsCompleted: 0,
        lastUpdated: serverTimestamp(),
      });
      console.log('User progress initialized.');

      // Also ensure that all achievement documents are pre-created (unlockedAt: null)
      // This makes it easier to query all possible achievements for display later
      const batchPromises = ALL_ACHIEVEMENTS.map(async (achievement) => {
        const achievementDocRef = doc(userAchievementsCollectionRef, achievement.id);
        await setDoc(achievementDocRef, {
          unlockedAt: null, // Not yet unlocked
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category,
          criteriaType: achievement.criteriaType,
          criteriaValue: achievement.criteriaValue,
          isVerified: achievement.isVerified,
          currentProgress: 0, // Initialize progress for each achievement
        });
      });
      await Promise.all(batchPromises);
      console.log('All achievement documents pre-created for new user.');

    }
  } catch (error) {
    console.error('Error initializing user progress and achievements:', error);
  }
};


/**
 * Checks if a streak should be maintained, incremented, or reset.
 * @param {Date | null} lastCompletionDate - The date of the last task completion.
 * @param {number} currentStreak - The user's current streak.
 * @returns {number} The new streak value.
 */
const calculateNewStreak = (lastCompletionDate, currentStreak) => {
  if (!lastCompletionDate) {
    return 1; // First task completion
  }

  const lastDate = lastCompletionDate.toDate(); // Convert Firestore Timestamp to Date object
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isToday(lastDate)) {
    // Already completed a task today, streak remains (or doesn't increment again today)
    return currentStreak;
  } else if (isYesterday(lastDate)) {
    // Completed yesterday, continue streak
    return currentStreak + 1;
  } else {
    // Break in streak
    return 1; // Start new streak
  }
};


/**
 * Updates user progress (e.g., total tasks, streak) and checks for unlocked achievements.
 * This function should be called after a user completes a task.
 * @param {string} userId - The ID of the current user.
 * @param {boolean} isVerifiedCompletion - True if the task completion was "verified" (e.g., by quiz).
 * @param {boolean} isPerfectDay - True if the entire day's tasks were completed.
 * @returns {Array<Object>} An array of newly unlocked achievement objects.
 */
export const updateUserProgressAndCheckAchievements = async (
  userId,
  isVerifiedCompletion = false,
  isPerfectDay = false // This parameter might be determined within DailyPlanner or passed in
) => {
  const userProgressRef = doc(db, 'users', userId, 'progress', 'userProgress');
  const userAchievementsCollectionRef = collection(db, 'users', userId, 'achievements');
  const newlyUnlockedAchievements = [];

  try {
    await runTransaction(db, async (transaction) => {
      const progressDocSnap = await transaction.get(userProgressRef);
      // Fetch ALL achievement documents at once
      const achievementRefs = ALL_ACHIEVEMENTS.map(ach => doc(userAchievementsCollectionRef, ach.id));
      const achievementSnaps = await Promise.all(achievementRefs.map(ref => transaction.get(ref)));

      let currentProgress = progressDocSnap.data();

      if (!progressDocSnap.exists() || !currentProgress) {
        console.warn('User progress document does not exist, initializing...');
        await initializeUserProgress(userId); // Re-initialize if somehow missing
        currentProgress = { // Set default values to avoid errors immediately after initialization
          lastTaskCompletionDate: null,
          currentStreak: 0,
          longestStreak: 0,
          totalTasksCompleted: 0,
          perfectDaysCount: 0,
          quizzesPassedCount: 0,
          totalRoadmapsCompleted: 0,
        };
        transaction.set(userProgressRef, currentProgress);
      }

      // --- Update Progress Metrics ---
      const oldStreak = currentProgress.currentStreak || 0;
      const oldLongestStreak = currentProgress.longestStreak || 0;
      const oldTotalTasks = currentProgress.totalTasksCompleted || 0;
      const oldPerfectDays = currentProgress.perfectDaysCount || 0;

      const newTotalTasks = oldTotalTasks + 1;
      const newStreak = calculateNewStreak(currentProgress.lastTaskCompletionDate, oldStreak);
      const newLongestStreak = Math.max(oldLongestStreak, newStreak);
      const newPerfectDays = isPerfectDay ? oldPerfectDays + 1 : oldPerfectDays; // Only increment if passed as true

      const updatedProgress = {
        ...currentProgress,
        lastTaskCompletionDate: serverTimestamp(),
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        totalTasksCompleted: newTotalTasks,
        perfectDaysCount: newPerfectDays,
        lastUpdated: serverTimestamp(),
      };

      transaction.set(userProgressRef, updatedProgress); // Use set with merge to update

      // --- Check for and Unlock Achievements ---
      for (let i = 0; i < ALL_ACHIEVEMENTS.length; i++) {
        const achievement = ALL_ACHIEVEMENTS[i];
        const achievementDocRef = achievementRefs[i]; // Get ref from already read list
        const achievementDocSnap = achievementSnaps[i]; // Get snap from already read list
        const achievementData = achievementDocSnap.data();

        // Skip if already unlocked
        if (achievementData && achievementData.unlockedAt) {
          continue;
        }

        let progressValue = 0;
        let shouldUnlock = false;

        // Determine the relevant progress value based on criteriaType and progressFieldName
        switch (achievement.criteriaType) {
          case 'streak_days':
            progressValue = newStreak;
            break;
          case 'total_tasks':
            progressValue = newTotalTasks;
            break;
          case 'perfect_days':
            progressValue = newPerfectDays;
            break;
          // Add other cases as needed: 'quizzes_passed', 'roadmap_completed'
          case 'quizzes_passed':
            // This will be updated separately or passed in if triggered by quiz completion
            progressValue = Array.isArray(currentProgress.quizzesPassedCount)
                            ? currentProgress.quizzesPassedCount.length
                            : (currentProgress.quizzesPassedCount || 0);
            break;
          case 'roadmap_completed':
             // This will be updated separately or passed in when a roadmap is fully done
             progressValue = Array.isArray(currentProgress.totalRoadmapsCompleted)
                             ? currentProgress.totalRoadmapsCompleted.length
                             : (currentProgress.totalRoadmapsCompleted || 0);
             break;
          default:
            console.warn(`Unknown criteriaType: ${achievement.criteriaType} for achievement ${achievement.id}`);
            continue;
        }

        // Update currentProgress on the achievement document (for display purposes)
        if (achievementData) {
          transaction.update(achievementDocRef, {
            currentProgress: progressValue,
          });
        }


        // Check if criteria met and if verification is required and met
        shouldUnlock = progressValue >= achievement.criteriaValue &&
                       (!achievement.isVerified || isVerifiedCompletion); // If isVerified is true, isVerifiedCompletion must also be true.

        // Special handling for 'perfect_days' - assumes isPerfectDay is passed correctly
        if (achievement.criteriaType === 'perfect_days' && isPerfectDay) {
            shouldUnlock = shouldUnlock && isPerfectDay;
        }


        if (shouldUnlock) {
          // Unlock the achievement
          transaction.update(achievementDocRef, {
            unlockedAt: serverTimestamp(),
            currentProgress: achievement.criteriaValue, // Set to max for display
          });
          newlyUnlockedAchievements.push({ ...achievement, unlockedAt: new Date() }); // Add to return list
          console.log(`Achievement unlocked: ${achievement.name}`);
        }
      }
    });

    console.log('User progress updated and achievements checked successfully.');
    return newlyUnlockedAchievements; // Return unlocked achievements for UI notification

  } catch (error) {
    console.error('Error updating user progress or checking achievements:', error);
    if (error.code === 'aborted') {
      console.warn('Transaction aborted, retrying or handling conflict.');
    }
    return [];
  }
};


/**
 * Increments the quizzesPassedCount for a user.
 * Call this when a user successfully passes a quiz.
 * @param {string} userId - The ID of the current user.
 */
export const incrementQuizzesPassedCount = async (userId) => {
  const userProgressRef = doc(db, 'users', userId, 'progress', 'userProgress');
  try {
    await updateDoc(userProgressRef, {
      quizzesPassedCount: arrayUnion({ timestamp: serverTimestamp() }), // Store timestamps for potential future analysis
    });
    console.log('Quizzes passed count incremented.');
    // After incrementing, you should ideally call updateUserProgressAndCheckAchievements again
    // to check for quiz-based achievement unlocks.
    // For simplicity, we'll just return and let the main function decide.
  } catch (error) {
    console.error('Error incrementing quizzes passed count:', error);
  }
};

/**
 * Increments the totalRoadmapsCompleted for a user.
 * Call this when a user successfully completes a full roadmap.
 * @param {string} userId - The ID of the current user.
 */
export const incrementTotalRoadmapsCompleted = async (userId) => {
    const userProgressRef = doc(db, 'users', userId, 'progress', 'userProgress');
    try {
        await updateDoc(userProgressRef, {
            totalRoadmapsCompleted: arrayUnion({ timestamp: serverTimestamp() }),
        });
        console.log('Total roadmaps completed count incremented.');
    } catch (error) {
        console.error('Error incrementing total roadmaps completed:', error);
    }
};