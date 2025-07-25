import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then(() => navigation.replace('Home'))
      .catch((err) => setError(err.message));
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={require('../assets/logo.png')} // Replace with your logo path
        style={styles.logo}
      />

      <Text style={styles.title}>Create Account</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholderTextColor="#888"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        placeholderTextColor="#888"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <Text onPress={() => navigation.navigate('Login')} style={styles.link}>
        Already have an account? <Text style={styles.linkHighlight}>Login</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 30,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#333',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#5A67D8',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    elevation: 2,
    marginTop: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    marginTop: 18,
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  linkHighlight: {
    color: '#5A67D8',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginBottom: 10,
    fontSize: 13,
  },
});
