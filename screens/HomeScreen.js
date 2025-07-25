// screens/HomeScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { auth } from '../firebase';

export default function HomeScreen({ navigation }) {
  const handleLogout = () => {
    auth.signOut().then(() => navigation.replace('Login'));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to SkillTrackr!</Text>
      <Button title="Log Out" onPress={handleLogout} />
        <Button title="Generate Roadmap" onPress={() => navigation.navigate('Roadmap')} />
        <Button title="Go to Daily Planner" onPress={() => navigation.navigate('DailyPlanner')} />
        <Button
  title="📅 Open Calendar View"
  onPress={() => navigation.navigate('Calendar')}
/>
<Button title="📈 View My Stats" onPress={() => navigation.navigate('Stats')} />


      
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, marginBottom: 20 },
});
