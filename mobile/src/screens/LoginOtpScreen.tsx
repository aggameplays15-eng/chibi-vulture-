import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

interface LoginOtpScreenProps {
  navigation: any;
  route: { params: { email: string } };
}

export default function LoginOtpScreen({ navigation, route }: LoginOtpScreenProps) {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { verifyLoginOtp } = useAuth();
  const inputRef = useRef<TextInput>(null);

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('Erreur', 'Le code doit contenir 6 chiffres');
      return;
    }

    setIsLoading(true);
    try {
      await verifyLoginOtp(email, code);
      // Navigation automatique via AuthContext (isAuthenticated devient true)
    } catch (error: any) {
      Alert.alert('Code invalide', error.message || 'Code invalide ou expiré');
      setCode('');
      inputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      // Re-appel login avec les mêmes credentials n'est pas possible ici
      // On navigue en arrière pour que l'utilisateur re-soumette
      Alert.alert(
        'Renvoyer le code',
        'Retourne à l\'écran de connexion et reconnecte-toi pour recevoir un nouveau code.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>Chibi Vulture</Text>
          <Text style={styles.tagline}>Vérification en deux étapes</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.icon}>🔐</Text>
          <Text style={styles.title}>Code de vérification</Text>
          <Text style={styles.subtitle}>
            Un code à 6 chiffres a été envoyé à{'\n'}
            <Text style={styles.email}>{email}</Text>
          </Text>

          <TextInput
            ref={inputRef}
            style={styles.codeInput}
            placeholder="000000"
            placeholderTextColor="#ccc"
            value={code}
            onChangeText={v => setCode(v.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            editable={!isLoading}
            textAlign="center"
          />

          <TouchableOpacity
            style={[styles.button, (isLoading || code.length !== 6) && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={isLoading || code.length !== 6}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Vérifier</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={handleResend}
            disabled={isResending}
          >
            <Text style={styles.linkText}>Renvoyer le code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F7',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#EC4899',
  },
  tagline: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3E8EE',
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  email: {
    color: '#EC4899',
    fontWeight: '600',
  },
  codeInput: {
    width: '100%',
    backgroundColor: '#f9f9fb',
    borderRadius: 12,
    padding: 18,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 20,
    color: '#1a1a2e',
  },
  button: {
    width: '100%',
    backgroundColor: '#EC4899',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    padding: 8,
  },
  linkText: {
    color: '#EC4899',
    fontSize: 14,
  },
  backButton: {
    marginTop: 8,
    padding: 8,
  },
  backText: {
    color: '#999',
    fontSize: 14,
  },
});
