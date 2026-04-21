import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { apiService } from '../services/api';

export default function ForgotPasswordScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) { Alert.alert('Erreur', 'Entrez votre email'); return; }
    setIsLoading(true);
    try {
      await apiService.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      Alert.alert('Erreur', 'Une erreur est survenue. Réessaie.');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emoji}>✅</Text>
          <Text style={styles.title}>Email envoyé !</Text>
          <Text style={styles.subtitle}>
            Si cet email est associé à un compte, tu recevras un lien de réinitialisation.
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.buttonText}>Retour à la connexion</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mot de passe oublié</Text>
        <Text style={styles.subtitle}>Entre ton email pour recevoir un lien de réinitialisation.</Text>
        <TextInput
          style={styles.input}
          placeholder="votre@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
        />
        <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleSubmit} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Envoyer le lien</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F7' },
  scrollContent: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  back: { marginBottom: 20 },
  backText: { color: '#EC4899', fontWeight: '600', fontSize: 16 },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24, textAlign: 'center', lineHeight: 20 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  button: { backgroundColor: '#EC4899', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
