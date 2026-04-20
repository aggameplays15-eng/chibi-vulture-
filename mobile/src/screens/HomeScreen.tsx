import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen({ navigation }: { navigation: any }) {
  const { isAuthenticated, user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.logo}>🎨</Text>
        <Text style={styles.title}>Chibi Vulture</Text>
        <Text style={styles.tagline}>
          La communauté artistique premium
        </Text>
        
        {!isAuthenticated && (
          <View style={styles.authButtons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.primaryButtonText}>Se connecter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Signup')}
            >
              <Text style={styles.secondaryButtonText}>S'inscrire</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Welcome Message for logged users */}
      {isAuthenticated && user && (
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Bon retour, {user.name}! 👋
          </Text>
          <Text style={styles.welcomeSubtext}>
            Découvrez les dernières créations de la communauté
          </Text>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Explorer</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Feed')}
          >
            <Text style={styles.actionIcon}>📰</Text>
            <Text style={styles.actionTitle}>Fil d'actualité</Text>
            <Text style={styles.actionDesc}>Voir les derniers posts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Shop')}
          >
            <Text style={styles.actionIcon}>🛍️</Text>
            <Text style={styles.actionTitle}>Boutique</Text>
            <Text style={styles.actionDesc}>Acheter des créations</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Messages')}
          >
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionTitle}>Messages</Text>
            <Text style={styles.actionDesc}>Discuter avec la communauté</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionTitle}>Profil</Text>
            <Text style={styles.actionDesc}>Mon compte</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Features */}
      <View style={styles.features}>
        <Text style={styles.sectionTitle}>Fonctionnalités</Text>
        
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🎨</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Partagez votre art</Text>
            <Text style={styles.featureDesc}>
              Publiez vos créations et recevez des commentaires
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>💰</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Vendez vos oeuvres</Text>
            <Text style={styles.featureDesc}>
              Transformez votre passion en revenus
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🤝</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Connectez-vous</Text>
            <Text style={styles.featureDesc}>
              Rencontrez d'autres artistes passionnés
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F7',
  },
  hero: {
    backgroundColor: '#fff',
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logo: {
    fontSize: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#EC4899',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  authButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#EC4899',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#EC4899',
  },
  secondaryButtonText: {
    color: '#EC4899',
    fontSize: 16,
    fontWeight: '600',
  },
  welcomeSection: {
    backgroundColor: '#EC4899',
    padding: 20,
    margin: 16,
    borderRadius: 16,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  welcomeSubtext: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    marginTop: 4,
  },
  quickActions: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  features: {
    padding: 16,
    paddingBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: '#666',
  },
});
