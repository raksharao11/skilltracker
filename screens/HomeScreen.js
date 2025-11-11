// screens/HomeScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { auth } from '../firebase';
import { AntDesign, Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Import icons for better visuals

export default function HomeScreen({ navigation }) {
  const handleLogout = () => {
    // Original logout logic remains unchanged
    auth.signOut().then(() => navigation.replace('Login'));
  };

  // Define the main navigation cards/buttons
  const features = [
    { 
      title: "Generate Roadmap", 
      icon: "road-sign", // Using an icon from MaterialCommunityIcons
      screen: "Roadmap", 
      color: "#4CAF50" // Green
    },
    { 
      title: "Daily Planner", 
      icon: "calendar-check-o", // Using an icon from AntDesign
      screen: "DailyPlanner", 
      color: "#2196F3" // Blue
    },
    { 
      title: "Calendar View", 
      icon: "calendar", // Using an icon from Feather
      screen: "Calendar", 
      color: "#FF9800" // Orange
    },
    { 
      title: "View My Stats", 
      icon: "stats-chart", // Using an icon from Ionicons
      screen: "Stats", 
      color: "#9C27B0" // Purple
    },
  ];

  const Card = ({ title, iconName, onPress, iconComponent: Icon, color }) => (
    <TouchableOpacity style={[styles.card, {borderColor: color}]} onPress={onPress}>
      <Icon name={iconName} size={40} color={color} style={styles.cardIcon} />
      <Text style={styles.cardTitle}>{title}</Text>
      <Feather name="arrow-right" size={20} color="#333" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.outerContainer} contentContainerStyle={styles.scrollContent}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back, **User!**</Text>
        <Text style={styles.title}>SkillTrackr</Text>
        <Text style={styles.subtitle}>Ready to track your progress?</Text>
      </View>
      
      {/* Feature Cards Section */}
      <View style={styles.featureContainer}>
        {features.map((feature) => {
          let IconComponent;
          switch (feature.icon) {
            case 'road-sign':
              IconComponent = MaterialCommunityIcons;
              break;
            case 'calendar-check-o':
              IconComponent = AntDesign;
              break;
            case 'calendar':
              IconComponent = Feather;
              break;
            case 'stats-chart':
              IconComponent = Ionicons;
              break;
            default:
              IconComponent = Feather; // Default to Feather
          }
          return (
            <Card
              key={feature.screen}
              title={feature.title}
              iconName={feature.icon}
              onPress={() => navigation.navigate(feature.screen)}
              iconComponent={IconComponent}
              color={feature.color}
            />
          );
        })}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
        <AntDesign name="logout" size={18} color="#fff" style={{marginLeft: 8}} />
      </TouchableOpacity>
      
      <Text style={styles.footerText}>Logged in as: {auth.currentUser?.email || 'N/A'}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Light background for the whole screen
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  // --- Header Styling ---
  header: {
    width: '100%',
    marginBottom: 30,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#999',
    marginTop: 5,
  },
  // --- Feature Card Styling ---
  featureContainer: {
    width: '100%',
    marginBottom: 30,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 5, // A colored accent border
  },
  cardIcon: {
    marginRight: 15,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  // --- Logout Button Styling ---
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#F44336', // Red color for danger/logout
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // --- Footer Styling ---
  footerText: {
    marginTop: 15,
    fontSize: 12,
    color: '#999',
  }
});