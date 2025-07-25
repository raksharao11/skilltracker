// screens/CalendarScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState('');
  const [tasks, setTasks] = useState([]);

  const fetchTasksForDate = async (dateString) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const docRef = doc(db, 'dailyPlans', `${uid}_${dateString}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setTasks(docSnap.data().tasks);
    } else {
      setTasks([]);
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    fetchTasksForDate(today);
  }, []);

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
    fetchTasksForDate(day.dateString);
  };

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={onDayPress}
        markedDates={{
          [selectedDate]: { selected: true, marked: true, selectedColor: 'blue' },
        }}
      />
      <Text style={styles.heading}>Tasks for {selectedDate}:</Text>
      <FlatList
        data={tasks}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <Text style={styles.task}>• {item.title} {item.completed ? '✅' : ''}</Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  heading: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  task: { fontSize: 16, marginBottom: 5 },
});
