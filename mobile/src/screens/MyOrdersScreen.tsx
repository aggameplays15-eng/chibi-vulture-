import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { apiService } from '../services/api';

interface Order {
  id: number;
  total: number;
  status: string;
  created_at: string;
  shipping_address: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  'En attente': '#F59E0B',
  'En préparation': '#3B82F6',
  'Expédiée': '#8B5CF6',
  'Livrée': '#10B981',
  'Annulée': '#EF4444',
};

export default function MyOrdersScreen({ navigation }: { navigation: any }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const data = await apiService.getOrders();
      if (Array.isArray(data)) setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#EC4899" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mes commandes</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🛍️</Text>
          <Text style={styles.emptyText}>Aucune commande pour le moment.</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Shop')}>
            <Text style={styles.shopBtnText}>Aller à la boutique</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.orderId}>Commande #{item.id}</Text>
                <View style={[styles.badge, { backgroundColor: `${STATUS_COLORS[item.status] || '#9CA3AF'}20` }]}>
                  <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] || '#9CA3AF' }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.date}>
                {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
              <Text style={styles.total}>{Number(item.total).toLocaleString()} GNF</Text>
              {item.shipping_address && (
                <Text style={styles.address} numberOfLines={1}>📍 {item.shipping_address}</Text>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  back: { color: '#EC4899', fontWeight: '600', fontSize: 16, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '900', color: '#1a1a2e' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#9CA3AF', fontWeight: '600', fontSize: 16, marginBottom: 16 },
  shopBtn: { backgroundColor: '#EC4899', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  shopBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderId: { fontWeight: '900', fontSize: 15, color: '#1a1a2e' },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  date: { color: '#9CA3AF', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  total: { color: '#EC4899', fontWeight: '900', fontSize: 15, marginBottom: 4 },
  address: { color: '#6B7280', fontSize: 12, marginTop: 2 },
});
