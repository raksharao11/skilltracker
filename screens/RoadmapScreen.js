import React, { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { auth, db } from '../firebase';
import { addDoc, collection, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { format } from 'date-fns'; // install this via: npm install date-fns

export default function RoadmapScreen() {
  const [goal, setGoal] = useState('');
  const [roadmap, setRoadmap] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Generate roadmap using OpenRouter API
  const generateRoadmap = async () => {
    setLoading(true);
    try {
      console.log('API Key being sent:', process.env.EXPO_PUBLIC_OPENAI_API_KEY);
      const res = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'openai/gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: `Give me a detailed skill learning roadmap for: ${goal}`,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const text = res.data.choices[0].message.content;
      setRoadmap(text);
    } catch (err) {
      console.error('Error generating roadmap:', err);
      Alert.alert('Error', 'Failed to generate roadmap.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Helper to split roadmap into daily chunks
  const splitIntoChunks = (text, chunkSize = 3) => {
    const lines = text.split(/\n+/).filter(line => line.trim().match(/^[-•\d]/));
    const chunks = [];
    for (let i = 0; i < lines.length; i += chunkSize) {
      chunks.push(lines.slice(i, i + chunkSize));
    }
    return chunks;
  };

  // 3. Save daily plans into Firestore
  const generateAndSaveDailyPlans = async (chunks) => {
    const startDate = new Date();
    const uid = auth.currentUser.uid;

    for (let i = 0; i < chunks.length; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const formattedDate = format(date, 'yyyy-MM-dd');

      const taskList = chunks[i].map(line => ({
        title: line.replace(/^[-•\d.]+\s*/, ''), // clean bullet/numbering
        completed: false,
      }));

      await setDoc(doc(db, 'dailyPlans', `${uid}_${formattedDate}`), {
        userId: uid,
        date: formattedDate,
        tasks: taskList,
      });
    }
  };

  // 4. Save roadmap + daily plans
  const saveRoadmap = async () => {
    if (!auth.currentUser) {
      Alert.alert('Login Required', 'You must be logged in to save roadmaps.');
      return;
    }

    try {
      await addDoc(collection(db, 'roadmaps'), {
        uid: auth.currentUser.uid,
        goal,
        roadmap,
        createdAt: serverTimestamp(),
      });

      const chunks = splitIntoChunks(roadmap);
      await generateAndSaveDailyPlans(chunks);

      Alert.alert('Saved', 'Roadmap and daily plans saved!');
    } catch (err) {
      console.error('Error saving roadmap:', err);
      Alert.alert('Error', 'Failed to save roadmap.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>AI Roadmap Generator</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your learning goal (e.g. Web Development)"
        value={goal}
        onChangeText={setGoal}
      />
      <Button title={loading ? 'Generating...' : 'Generate Roadmap'} onPress={generateRoadmap} disabled={loading} />
      {roadmap ? (
        <>
          <Text style={styles.roadmap}>{roadmap}</Text>
          <Button
            title="Save Roadmap and Generate Daily Plan"
            onPress={saveRoadmap}
          />
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  roadmap: {
    marginVertical: 15,
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 5,
  },
});
//Roadmap_updated