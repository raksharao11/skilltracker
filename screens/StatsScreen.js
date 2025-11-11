import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions, Alert } from 'react-native'; // Added ActivityIndicator, ScrollView, Dimensions, Alert
import { useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'; // Added doc, getDoc
import { isSameDay, subDays, parseISO, format } from 'date-fns';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
  const [loading, setLoading] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0); // Renamed from 'streak' for clarity
  const [longestStreak, setLongestStreak] = useState(0); // NEW: To display longest streak from userProgress
  const [totalTasks, setTotalTasks] = useState(0); // Total tasks in all fetched plans
  const [completedTasks, setCompletedTasks] = useState(0); // Total completed tasks in all fetched plans
  const [completionRate, setCompletionRate] = useState(0);

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{
      data: [],
      color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`, // optional
      strokeWidth: 2 // optional
    }],
    legend: ['Tasks Completed'] // optional
  });

  useFocusEffect(
    useCallback(() => {
      const fetchStatsAndGraphData = async () => {
        setLoading(true);
        const uid = auth.currentUser?.uid;
        if (!uid) {
          Alert.alert('Login Required', 'You must be logged in to view your stats.');
          setLoading(false);
          return;
        }

        try {
          // --- Fetch User Progress (for streaks and total tasks from achievementUtils) ---
          const userProgressRef = doc(db, 'users', uid, 'progress', 'userProgress');
          const progressSnap = await getDoc(userProgressRef);

          if (progressSnap.exists()) {
            const data = progressSnap.data();
            setCurrentStreak(data.currentStreak || 0);
            setLongestStreak(data.longestStreak || 0);
            setCompletedTasks(data.totalTasksCompleted || 0); // Use the pre-calculated totalTasksCompleted
            // Note: totalTasks (overall) is still tricky. We'll calculate it from daily plans below.
            // Completion rate will be based on fetched daily plans for the graph.
          } else {
            console.warn("User progress document not found. Ensure initializeUserProgress runs on login.");
            setCurrentStreak(0);
            setLongestStreak(0);
            setCompletedTasks(0);
          }

          const allDailyPlansSnapshot = await getDocs(collection(db, 'dailyPlans'));
          const userPlans = [];

          allDailyPlansSnapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data.userId === uid) {
              userPlans.push(data);
            }
          });

          userPlans.sort((a, b) => new Date(a.date) - new Date(b.date));

          let totalTasksInPlans = 0;
          let completedTasksInPlans = 0;

          /*let total = 0;
          let completed = 0;
          let currentStreak = 0;
          let prevDate = null;*/

          userPlans.forEach(plan => {
            const tasks = plan.tasks || [];
            totalTasksInPlans += tasks.length;
            completedTasksInPlans += tasks.filter(t => t.completed === true).length;
          });

          setTotalTasks(totalTasksInPlans);
          setCompletionRate(totalTasksInPlans > 0 ? ((completedTasksInPlans / totalTasksInPlans) * 100).toFixed(1) : 0);

          // --- Prepare Data for Weekly Graph ---
          const datesToDisplay = []; // Labels for the chart (e.g., Mon, Tue)
          const tasksCompletedPerDay = {}; // Map to store completed tasks for each of the last 7 days

          for (let i = 6; i >= 0; i--) { // From 6 days ago to today
            const date = subDays(new Date(), i);
            const formattedDate = format(date, 'yyyy-MM-dd');
            datesToDisplay.push(format(date, 'EEE')); // "Mon", "Tue", etc.
            tasksCompletedPerDay[formattedDate] = 0;
          }

          userPlans.forEach(plan => {
            const planDate = parseISO(plan.date); // Convert plan.date string to Date object
            const tasks = plan.tasks || [];
            const completedCount = tasks.filter(t => t.completed).length;

            // Check if this plan's date falls within the last 7 days we're interested in
            for (let i = 6; i >= 0; i--) {
              const targetDate = subDays(new Date(), i);
              if (isSameDay(planDate, targetDate)) {
                const formattedTargetDate = format(targetDate, 'yyyy-MM-dd');
                tasksCompletedPerDay[formattedTargetDate] = completedCount;
                break; // Found the day, move to next plan
              }
            }
          });

          const graphDataPoints = [];
          for (let i = 6; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const formattedDate = format(date, 'yyyy-MM-dd');
            graphDataPoints.push(tasksCompletedPerDay[formattedDate] || 0);
          }

          setChartData({
            labels: datesToDisplay,
            datasets: [{
              data: graphDataPoints,
              color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`, // Blue color
              strokeWidth: 2
            }],
            legend: ['Tasks Completed']
          });
        } catch (error){
          console.error('Error fetching stats and graph data:', error);
          Alert.alert('Error', 'Failed to load stats and graph data.');
        } finally {
          setLoading(false);
        }
      };

      fetchStatsAndGraphData();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading Stats...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>📊 Your Progress Overview</Text>

      {/* Basic Stats Display */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>🔥 Current Streak: {currentStreak} day(s)</Text>
      </View>
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>🏆 Longest Streak: {longestStreak} day(s)</Text>
      </View>
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>✅ Total Tasks Completed: {completedTasks}</Text>
      </View>
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>📌 Total Tasks in Plans: {totalTasks}</Text>
      </View>
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>📈 Overall Completion Rate: {completionRate}%</Text>
      </View>

      {/* Weekly Progress Graph */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Weekly Task Completion</Text>
        {chartData.labels.length > 0 && chartData.datasets[0].data.length > 0 ? (
          <LineChart
            data={chartData}
            width={screenWidth - 40} // From padding 20 on each side
            height={220}
            chartConfig={{
              backgroundColor: '#e2e2e2',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#f0f4f8',
              decimalPlaces: 0, // Show whole numbers for tasks
              color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`, // Line color
              labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`, // Label color
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#007bff',
              },
            }}
            bezier // Smooth curve
            style={styles.chartStyle}
          />
        ) : (
          <Text style={styles.noChartDataText}>No task data available for the last 7 days.</Text>
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    padding: 20,
  },
  loadingContainer: {
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
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  statsCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statsSubText: {
    fontSize: 14,
    color: '#777',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center', // Center the chart
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  chartStyle: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noChartDataText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    padding: 20,
  },
});

  /*return (
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
});*/
