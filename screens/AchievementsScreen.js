// screens/AchievementsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { auth, db } from '../firebase';
import { collection, doc, getDocs } from 'firebase/firestore';
import { ALL_ACHIEVEMENTS } from '../constants/achievements';
import { format } from 'date-fns'; // For displaying unlock date

export default function AchievementsScreen() {
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchAchievements = async () => {
      if (!user) {
        Alert.alert('Login Required', 'Please log in to view your achievements.');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const userId = user.uid;
        const achievementsCollectionRef = collection(db, 'users', userId, 'achievements');
        const querySnapshot = await getDocs(achievementsCollectionRef);

        const fetchedAchievementsMap = {};
        querySnapshot.forEach(doc => {
          fetchedAchievementsMap[doc.id] = doc.data();
        });

        // Combine ALL_ACHIEVEMENTS with user-specific data
        const combinedAchievements = ALL_ACHIEVEMENTS.map(staticAch => {
          const userAchData = fetchedAchievementsMap[staticAch.id];
          return {
            ...staticAch,
            unlockedAt: userAchData?.unlockedAt ? userAchData.unlockedAt.toDate() : null, // Convert Firestore Timestamp to Date
            currentProgress: userAchData?.currentProgress || 0,
            isUnlocked: !!userAchData?.unlockedAt, // True if unlockedAt exists
          };
        });

        // Sort achievements: unlocked first, then by category, then by criteriaValue
        combinedAchievements.sort((a, b) => {
          // Unlocked achievements first
          if (a.isUnlocked && !b.isUnlocked) return -1;
          if (!a.isUnlocked && b.isUnlocked) return 1;

          // Then by category
          if (a.category < b.category) return -1;
          if (a.category > b.category) return 1;

          // Then by criteriaValue (e.g., lower streak first)
          return a.criteriaValue - b.criteriaValue;
        });

        setUserAchievements(combinedAchievements);

      } catch (error) {
        console.error('Error fetching achievements:', error);
        Alert.alert('Error', 'Failed to load achievements.');
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [user]); // Re-fetch if user changes (e.g., logout/login)

  const renderAchievementItem = ({ item }) => {
    const isUnlocked = item.isUnlocked;
    const unlockDate = item.unlockedAt ? format(item.unlockedAt, 'MMM dd, yyyy') : null;
    const progressText = item.criteriaValue > 0 && !isUnlocked
      ? `Progress: ${item.currentProgress}/${item.criteriaValue}`
      : '';

    return (
      <View style={[styles.achievementCard, isUnlocked ? styles.unlockedCard : styles.lockedCard]}>
        <Text style={styles.achievementIcon}>{item.icon}</Text>
        <View style={styles.achievementContent}>
          <Text style={styles.achievementName}>{item.name}</Text>
          <Text style={styles.achievementDescription}>{item.description}</Text>
          {isUnlocked ? (
            <Text style={styles.unlockedDate}>Unlocked: {unlockDate}</Text>
          ) : (
            <Text style={styles.progressText}>{progressText}</Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading Achievements...</Text>
      </View>
    );
  }

  if (userAchievements.length === 0 && !loading) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.noAchievementsText}>No achievements found yet. Start tracking your progress!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Achievements</Text>
      <FlatList
        data={userAchievements}
        keyExtractor={(item) => item.id}
        renderItem={renderAchievementItem}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    paddingTop: 20,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  noAchievementsText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#777',
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 25,
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  unlockedCard: {
    borderColor: '#28a745', // Green border for unlocked
    borderWidth: 2,
  },
  lockedCard: {
    borderColor: '#ced4da', // Grey border for locked
    borderWidth: 1,
    opacity: 0.7, // Slightly faded for locked
  },
  achievementIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  achievementContent: {
    flex: 1,
  },
  achievementName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  unlockedDate: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#28a745', // Green color for unlocked date
    fontWeight: '500',
  },
  progressText: {
    fontSize: 12,
    color: '#007bff', // Blue color for progress
    fontWeight: '500',
  },
});