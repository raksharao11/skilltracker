// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(() => navigation.replace('Home'))
      .catch((err) => setError(err.message));
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />

      <Text style={styles.title}>Welcome Back</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.link}>Don’t have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 24,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 20,
    color: '#111827',
  },
  input: {
    width: '100%',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
    marginBottom: 16,
    fontSize: 16,
    color: '#111',
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  link: {
    color: '#4F46E5',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});
