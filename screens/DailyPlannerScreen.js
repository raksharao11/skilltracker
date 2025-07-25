import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet, Alert } from 'react-native';
import { auth, db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  setDoc,
} from 'firebase/firestore';
import { format, addDays } from 'date-fns';

export default function DailyPlannerScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateKey, setDateKey] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchTasks(dateKey);
  }, [dateKey]);

  const fetchTasks = async (dateString) => {
    if (!auth.currentUser) {
      Alert.alert('Login Required', 'You must be logged in to view your planner.');
      return;
    }

    setLoading(true);
    const userId = auth.currentUser.uid;
    const docRef = doc(db, 'dailyPlans', `${userId}_${dateString}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setTasks(docSnap.data().tasks);
    } else {
      setTasks([]);
    }

    setLoading(false);
  };

  const toggleTaskCompletion = async (index) => {
    const updatedTasks = [...tasks];
    updatedTasks[index].completed = !updatedTasks[index].completed;
    setTasks(updatedTasks);

    const userId = auth.currentUser.uid;
    const docRef = doc(db, 'dailyPlans', `${userId}_${dateKey}`);

    try {
      await updateDoc(docRef, { tasks: updatedTasks });
    } catch (err) {
      console.error('Error updating task:', err);
      Alert.alert('Error', 'Failed to update task status.');
    }
  };

  const handleDateChange = (daysToAdd) => {
    const newDate = addDays(new Date(dateKey), daysToAdd);
    const newDateStr = format(newDate, 'yyyy-MM-dd');
    setDateKey(newDateStr);
  };

  if (loading) return <Text style={styles.loading}>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Your Plan for {dateKey}</Text>

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
});
