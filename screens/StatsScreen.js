import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { isSameDay, subDays, parseISO } from 'date-fns';

export default function StatsScreen() {
  const [streak, setStreak] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const fetchStats = async () => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const plansSnapshot = await getDocs(collection(db, 'dailyPlans'));
        const plans = [];

        plansSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.userId === uid) {
            plans.push(data);
          }
        });

        plans.sort((a, b) => new Date(a.date) - new Date(b.date));

        let total = 0;
        let completed = 0;
        let currentStreak = 0;
        let prevDate = null;

        // Count totals and completed
        plans.forEach(plan => {
          const tasks = plan.tasks || [];
          total += tasks.length;
          completed += tasks.filter(t => t.completed === true).length;
        });

        // Calculate streak from most recent
        for (let i = plans.length - 1; i >= 0; i--) {
          const plan = plans[i];
          const tasks = plan.tasks || [];

          const allDone = tasks.length > 0 && tasks.every(t => t.completed === true);
          const date = parseISO(plan.date);

          if (i === plans.length - 1 && allDone) {
            currentStreak = 1;
          } else if (prevDate && isSameDay(subDays(prevDate, 1), date) && allDone) {
            currentStreak++;
          } else if (allDone) {
            currentStreak = 1;
          } else {
            break;
          }

          prevDate = date;
        }

        setTotalTasks(total);
        setCompletedTasks(completed);
        setCompletionRate(total > 0 ? ((completed / total) * 100).toFixed(1) : 0);
        setStreak(currentStreak);
      };

      fetchStats();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Progress & Streaks</Text>
      <Text style={styles.stat}>✅ Completed Tasks: {completedTasks}</Text>
      <Text style={styles.stat}>📌 Total Tasks: {totalTasks}</Text>
      <Text style={styles.stat}>🔥 Current Streak: {streak} day(s)</Text>
      <Text style={styles.stat}>📈 Completion Rate: {completionRate}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  stat: { fontSize: 18, marginVertical: 5 },
});
