import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet, Alert, ActivityIndicator} from 'react-native';
import { auth, db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  setDoc,
} from 'firebase/firestore';
import { format, addDays,  isToday, isYesterday, isTomorrow  } from 'date-fns';
import { updateUserProgressAndCheckAchievements } from '../utils/achievementUtils';

export default function DailyPlannerScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateKey, setDateKey] = useState(format(new Date(), 'yyyy-MM-dd'));
  const user = auth.currentUser;

  useEffect(() => {
    fetchTasks(dateKey);
  }, [dateKey]);

  const fetchTasks = async (dateString) => {
    if (!user) {
      Alert.alert('Login Required', 'You must be logged in to view your planner.');
      setLoading(false);
      return;
    }

    setLoading(true);
    const userId = user.uid;
    const docRef = doc(db, 'dailyPlans', `${userId}_${dateString}`);

    try {
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setTasks(docSnap.data().tasks);
      } else {
        setTasks([]);
      }
    } catch (error) { // Use error for catch block
        console.error('Error fetching tasks:', error);
        Alert.alert('Error', 'Failed to fetch daily tasks.');
    } finally {
        setLoading(false); // Ensure loading is always set to false
    }
  };

  const toggleTaskCompletion = async (index) => {
    if (!user) { // Check user login before action
      Alert.alert('Error', 'You must be logged in to mark tasks.');
      return;
    }
    const currentDisplayDate = new Date(dateKey);
    const today = new Date();

    const normalizedCurrentDisplayDate = new Date(currentDisplayDate.getFullYear(), currentDisplayDate.getMonth(), currentDisplayDate.getDate());
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (normalizedCurrentDisplayDate > normalizedToday) {
      Alert.alert('Future Task', 'You cannot mark tasks as done for future days.');
      return;
    }
    if (normalizedCurrentDisplayDate < normalizedToday) {
      Alert.alert('Past Task', 'You cannot mark tasks as done for Past days.');
      return;
    }

    const updatedTasks = [...tasks];
    const isMarkingDone = !updatedTasks[index].completed; // Check if the action is "marking as done"
    updatedTasks[index].completed = isMarkingDone;
    setTasks(updatedTasks);

    const userId = user.uid;
    const docRef = doc(db, 'dailyPlans', `${userId}_${dateKey}`);

    try {
      await updateDoc(docRef, { tasks: updatedTasks });
      if (isMarkingDone) {
        const allTasksCompletedForToday = updatedTasks.every(task => task.completed);
        const isCurrentlyToday = isToday(currentDisplayDate);

        const newlyUnlocked = await updateUserProgressAndCheckAchievements(
          userId,
          false, 
          allTasksCompletedForToday && isCurrentlyToday // `isPerfectDay`: Only if all tasks are done AND it's today
        );
        if (newlyUnlocked.length > 0) {
          const achievementNames = newlyUnlocked.map(ach => ach.name).join(', ');
          Alert.alert('Achievement Unlocked!', `Congratulations! You've unlocked: ${achievementNames}`);
        }
      }
    } catch (err) {
      console.error('Error updating task:', err);
      Alert.alert('Error', 'Failed to update task status.');
      setTasks(tasks);
    }
  };

  const handleDateChange = (daysToAdd) => {
     // Add days to the current dateKey string (which is a date string)
    // First, convert dateKey back to a Date object, then add days, then format back.
    const newDate = addDays(new Date(dateKey + 'T00:00:00'), daysToAdd); // Add T00:00:00 to avoid timezone issues for simple date strings
    const newDateStr = format(newDate, 'yyyy-MM-dd');
    setDateKey(newDateStr);
  };

  const getDisplayDate = () => {
    const displayDate = new Date(dateKey + 'T00:00:00'); // Ensure correct date object
    if (isToday(displayDate)) return 'Today';
    if (isYesterday(displayDate)) return 'Yesterday';
    if (isTomorrow(displayDate)) return 'Tomorrow';
    return format(displayDate, 'MMM dd, yyyy'); // Fallback for other dates
  };

  if (loading) return <Text style={styles.loading}>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Your Plan for {getDisplayDate()}</Text>

      <View style={styles.buttonRow}>
        <Button title="⬅️ Yesterday" onPress={() => handleDateChange(-1)} />
        <Button title="Today" onPress={() => setDateKey(format(new Date(), 'yyyy-MM-dd'))} />
        <Button title="Tomorrow ➡️" onPress={() => handleDateChange(1)} />
      </View>

      {tasks.length === 0 ? (
        <Text style={styles.noTasks}>No tasks found for this day.</Text>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.task}>
              <Text
                style={{
                  ...styles.taskText,
                  textDecorationLine: item.completed ? 'line-through' : 'none',
                  color: item.completed ? 'gray' : 'black',
                }}
              >
                {item.title}
              </Text>
              <Button
                title={item.completed ? 'Undo' : 'Done'}
                onPress={() => toggleTaskCompletion(index)}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#f0f4f8', // Consistent background
  },
  heading: {
    fontSize: 24, // Slightly larger heading
    fontWeight: 'bold',
    marginBottom: 20, // More space
    textAlign: 'center', // Centered
    color: '#333',
  },
  task: {
    padding: 15, // More padding
    marginVertical: 8,
    backgroundColor: '#fff', // White background for tasks
    borderRadius: 10, // More rounded corners
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000', // Add subtle shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3, // For Android shadow
  },
  taskText: {
    fontSize: 16,
    flexShrink: 1,
    color: '#333', // Darker text
  },
  loading: {
    marginTop: 50, // Center better
  },
  noTasks: {
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center', // Centered
    color: '#777',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 10,
  },
});
//tests for commit

/*const styles = StyleSheet.create({
  container: { padding: 20, flex: 1 },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  task: {
    padding: 10,
    marginVertical: 8,
    backgroundColor: '#eee',
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskText: { fontSize: 16, flexShrink: 1 },
  loading: { marginTop: 20, fontSize: 18 },
  noTasks: { fontSize: 16, marginTop: 20 },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 10,
  },
});*/
