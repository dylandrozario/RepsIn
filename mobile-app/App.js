import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏋️ RepsIn MVP</Text>
      <Text style={styles.subtitle}>Equipment Occupancy Forecasting</Text>
      <StatusBar style="auto" />
      
      {/* TODO: Add navigation and screens */}
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          ⚠️ Synthetic ML Demo Data Only
        </Text>
        <Text style={styles.info}>
          Core screens to implement:
        </Text>
        <Text style={styles.listItem}>✓ Onboarding flow</Text>
        <Text style={styles.listItem}>✓ Home dashboard</Text>
        <Text style={styles.listItem}>✓ Equipment forecast viewer</Text>
        <Text style={styles.listItem}>✓ Workout time recommendations</Text>
        <Text style={styles.listItem}>✓ Workout generator</Text>
        <Text style={styles.listItem}>✓ Schedule & progress tracker</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  placeholder: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
    width: '100%',
  },
  placeholderText: {
    fontSize: 14,
    color: '#ff6b00',
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  info: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  listItem: {
    fontSize: 13,
    color: '#444',
    marginLeft: 8,
    marginBottom: 6,
  },
});
