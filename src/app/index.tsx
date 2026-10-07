import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  TextInput, Modal, Switch, SafeAreaView, StatusBar 
} from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function App() {
  const [vehicles, setVehicles] = useState([
    { id: 'VTR-001', model: 'Fiat Argo', plate: 'ABC-1234', currentKm: 45050, nextRevision: 55000, status: 'disponivel' },
    { id: 'VTR-002', model: 'Renault Duster', plate: 'XYZ-9876', currentKm: 59600, nextRevision: 60000, status: 'disponivel' }
  ]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [tripHistory, setTripHistory] = useState([]);
  
  const [currentView, setCurrentView] = useState('dashboard');
  
  const [newVehicle, setNewVehicle] = useState({ id: '', model: '', plate: '', currentKm: '', nextRevision: '' });
  const [checkoutModal, setCheckoutModal] = useState({ isOpen: false, trip: null });
  const [checkoutData, setCheckoutData] = useState({ endKm: '', refueled: false, revised: false });

  const handleRegister = () => {
    if(!newVehicle.id || !newVehicle.model) {
      alert('Preencha os dados obrigatórios!');
      return;
    }
    setVehicles([...vehicles, { ...newVehicle, currentKm: Number(newVehicle.currentKm), nextRevision: Number(newVehicle.nextRevision), status: 'disponivel' }]);
    setNewVehicle({ id: '', model: '', plate: '', currentKm: '', nextRevision: '' });
    alert('Veículo Cadastrado!');
  };

  const startTripDemo = (vehicle) => {
    setActiveTrips([...activeTrips, { id: Date.now(), vehicleId: vehicle.id, model: vehicle.model, driver: 'Murilo', startKm: vehicle.currentKm, status: 'Em Rota' }]);
    setVehicles(vehicles.map(v => v.id === vehicle.id ? { ...v, status: 'em_uso' } : v));
    alert('Veículo saiu para rota!');
  };

  const confirmCheckout = () => {
    if (!checkoutModal || !checkoutModal.trip) {
      setCheckoutModal({ isOpen: false, trip: null });
      return;
    }

    const tripToClose = checkoutModal.trip;
    const finalKm = Number(checkoutData.endKm);
    
    if (isNaN(finalKm) || finalKm < tripToClose.startKm) {
      alert('Odômetro final inválido!');
      return;
    }

    setActiveTrips(prev => prev.filter(t => t.id !== tripToClose.id));
    
    setVehicles(prevVehicles => prevVehicles.map(v => {
      if (v.id === tripToClose.vehicleId) {
        let newNextRevision = checkoutData.revised ? finalKm + 10000 : v.nextRevision;
        return { ...v, currentKm: finalKm, nextRevision: newNextRevision, status: 'disponivel' };
      }
      return v;
    }));

    setTripHistory(prevHistory => [{
      id: tripToClose.id, 
      vehicleId: tripToClose.vehicleId, 
      model: tripToClose.model,
      startKm: tripToClose.startKm, 
      endKm: finalKm, 
      distance: finalKm - tripToClose.startKm,
      date: new Date().toLocaleDateString('pt-BR'), 
      refueled: checkoutData.refueled, 
      revised: checkoutData.revised
    }, ...prevHistory]);
    
    setCheckoutModal({ isOpen: false, trip: null });
  };

  const renderDashboard = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.headerTitle}>Visão Geral</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiContainer}>
        <View style={[styles.kpiCard, { borderLeftColor: '#3b82f6', borderLeftWidth: 4 }]}>
          <Feather name="truck" size={24} color="#3b82f6" />
          <Text style={styles.kpiValue}>{vehicles.length}</Text>
          <Text style={styles.kpiLabel}>Total Frota</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: '#10b981', borderLeftWidth: 4 }]}>
          <Feather name="navigation" size={24} color="#10b981" />
          <Text style={styles.kpiValue}>{activeTrips.length}</Text>
          <Text style={styles.kpiLabel}>Em Rota</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: '#f59e0b', borderLeftWidth: 4 }]}>
          <Feather name="alert-triangle" size={24} color="#f59e0b" />
          <Text style={styles.kpiValue}>{vehicles.filter(v => (v.nextRevision - v.currentKm) <= 1000).length}</Text>
          <Text style={styles.kpiLabel}>Alertas</Text>
        </View>
      </ScrollView>

      <Text style={styles.sectionTitle}>Saídas em Andamento</Text>
      {activeTrips.length === 0 ? (
        <Text style={styles.emptyState}>Nenhum veículo em rota no momento.</Text>
      ) : (
        activeTrips.map(trip => (
          <View key={trip.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{trip.vehicleId}</Text>
              <View style={styles.badge}><Text style={styles.badgeText}>Rodando</Text></View>
            </View>
            <Text style={styles.cardSub}>{trip.model} • Saída: {trip.startKm} km</Text>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => {
              setCheckoutData({ endKm: trip.startKm.toString(), refueled: false, revised: false });
              setCheckoutModal({ isOpen: true, trip });
            }}>
              <Feather name="check-circle" size={18} color="#fff" />
              <Text style={styles.btnPrimaryText}>Registrar Retorno</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderFrota = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.headerTitle}>Gestão de Frota</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Adicionar Veículo</Text>
        <TextInput style={styles.input} placeholder="Prefixo (Ex: VTR-003)" value={newVehicle.id} onChangeText={t => setNewVehicle({...newVehicle, id: t})} />
        <TextInput style={styles.input} placeholder="Modelo (Ex: Gol)" value={newVehicle.model} onChangeText={t => setNewVehicle({...newVehicle, model: t})} />
        <TextInput style={styles.input} placeholder="Placa" value={newVehicle.plate} onChangeText={t => setNewVehicle({...newVehicle, plate: t})} />
        <TextInput style={styles.input} placeholder="Km Atual" keyboardType="numeric" value={newVehicle.currentKm} onChangeText={t => setNewVehicle({...newVehicle, currentKm: t})} />
        <TextInput style={styles.input} placeholder="Próxima Revisão (Km)" keyboardType="numeric" value={newVehicle.nextRevision} onChangeText={t => setNewVehicle({...newVehicle, nextRevision: t})} />
        <TouchableOpacity style={styles.btnPrimary} onPress={handleRegister}>
          <Text style={styles.btnPrimaryText}>Cadastrar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Veículos</Text>
      {vehicles.map(v => (
        <View key={v.id} style={styles.card}>
          <Text style={styles.cardTitle}>{v.id} - {v.model}</Text>
          <Text style={styles.cardSub}>Status: {v.status === 'disponivel' ? 'Disponível' : 'Em Uso'} • {v.currentKm} km</Text>
          {v.status === 'disponivel' && (
            <TouchableOpacity style={styles.btnOutline} onPress={() => startTripDemo(v)}>
              <Feather name="navigation" size={16} color="#3b82f6" />
              <Text style={styles.btnOutlineText}>Simular Saída</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );

  const renderManutencao = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.headerTitle}>Oficina e Alertas</Text>
      {vehicles.map(car => {
        const kmAteRevisao = car.nextRevision - car.currentKm;
        const progress = Math.min((car.currentKm / car.nextRevision) * 100, 100);
        let color = '#10b981'; 
        if(kmAteRevisao <= 1000) color = '#f59e0b'; 
        if(kmAteRevisao <= 0) color = '#ef4444';

        return (
          <View key={car.id} style={styles.card}>
            <Text style={styles.cardTitle}>{car.id}</Text>
            <Text style={styles.cardSub}>Atual: {car.currentKm} km | Revisão: {car.nextRevision} km</Text>
            
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: color }]} />
            </View>
            
            <Text style={[styles.cardSub, { color, marginTop: 5, fontWeight: 'bold' }]}>
              {kmAteRevisao > 0 ? `Faltam ${kmAteRevisao} km` : 'Manutenção Atrasada!'}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );

  const renderRelatorios = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.headerTitle}>Histórico Operacional</Text>
      {tripHistory.length === 0 ? (
        <Text style={styles.emptyState}>Nenhum histórico disponível.</Text>
      ) : (
        tripHistory.map((trip, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{trip.vehicleId}</Text>
              <Text style={styles.cardSub}>{trip.date}</Text>
            </View>
            <Text style={styles.cardSub}>Distância: {trip.startKm} → {trip.endKm} ({trip.distance} km)</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              {trip.refueled && <View style={[styles.badge, {backgroundColor: '#dbeafe'}]}><Text style={{color: '#2563eb', fontSize: 12}}>Abasteceu</Text></View>}
              {trip.revised && <View style={[styles.badge, {backgroundColor: '#dcfce7'}]}><Text style={{color: '#166534', fontSize: 12}}>Revisou</Text></View>}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      <View style={styles.topbar}>
        <Feather name="map" size={24} color="#60a5fa" />
        <Text style={styles.topbarTitle}>FrotaMovimento</Text>
      </View>

      <View style={{ flex: 1 }}>
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'frota' && renderFrota()}
        {currentView === 'manutencao' && renderManutencao()}
        {currentView === 'relatorios' && renderRelatorios()}
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentView('dashboard')}>
          <Feather name="grid" size={24} color={currentView === 'dashboard' ? '#3b82f6' : '#64748b'} />
          <Text style={[styles.navText, currentView === 'dashboard' && { color: '#3b82f6' }]}>Painel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentView('frota')}>
          <Feather name="truck" size={24} color={currentView === 'frota' ? '#3b82f6' : '#64748b'} />
          <Text style={[styles.navText, currentView === 'frota' && { color: '#3b82f6' }]}>Frota</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentView('manutencao')}>
          <Feather name="tool" size={24} color={currentView === 'manutencao' ? '#3b82f6' : '#64748b'} />
          <Text style={[styles.navText, currentView === 'manutencao' && { color: '#3b82f6' }]}>Oficina</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentView('relatorios')}>
          <Feather name="file-text" size={24} color={currentView === 'relatorios' ? '#3b82f6' : '#64748b'} />
          <Text style={[styles.navText, currentView === 'relatorios' && { color: '#3b82f6' }]}>Relatórios</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={checkoutModal.isOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.cardTitle}>Retorno: {checkoutModal.trip?.vehicleId}</Text>
            
            <Text style={styles.label}>Odômetro Final (Km)</Text>
            <TextInput 
              style={[styles.input, { fontSize: 20, textAlign: 'center' }]} 
              keyboardType="numeric" 
              value={checkoutData.endKm} 
              onChangeText={t => setCheckoutData({...checkoutData, endKm: t})} 
            />

            <View style={styles.switchRow}>
              <Text>Veículo Abastecido?</Text>
              <Switch value={checkoutData.refueled} onValueChange={v => setCheckoutData({...checkoutData, refueled: v})} />
            </View>

            <View style={styles.switchRow}>
              <Text>Passou por Revisão?</Text>
              <Switch value={checkoutData.revised} onValueChange={v => setCheckoutData({...checkoutData, revised: v})} />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity style={[styles.btnOutline, {flex: 1}]} onPress={() => setCheckoutModal({isOpen: false, trip: null})}>
                <Text>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnPrimary, {flex: 1}]} onPress={confirmCheckout}>
                <Text style={styles.btnPrimaryText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  topbar: { backgroundColor: '#0f172a', padding: 20, paddingTop: 40, flexDirection: 'row', alignItems: 'center', gap: 10 },
  topbarTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginVertical: 15 },
  
  kpiContainer: { flexDirection: 'row', marginBottom: 20 },
  kpiCard: { backgroundColor: 'white', padding: 15, borderRadius: 10, width: 140, marginRight: 15, elevation: 2 },
  kpiValue: { fontSize: 24, fontWeight: 'bold', marginTop: 10, color: '#1e293b' },
  kpiLabel: { color: '#64748b', fontSize: 12 },
  
  card: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 5 },
  cardSub: { color: '#64748b', fontSize: 14, marginBottom: 15 },
  
  progressBarBg: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  badge: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#166534', fontSize: 12, fontWeight: 'bold' },
  emptyState: { textAlign: 'center', color: '#94a3b8', marginVertical: 20 },

  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, marginBottom: 15, backgroundColor: '#f8fafc' },
  label: { fontSize: 14, color: '#64748b', marginBottom: 5 },
  btnPrimary: { backgroundColor: '#3b82f6', padding: 15, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  btnPrimaryText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  btnOutline: { borderWidth: 1, borderColor: '#cbd5e1', padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  btnOutlineText: { color: '#3b82f6', fontWeight: 'bold' },

  bottomNav: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderTopWidth: 1, borderColor: '#e2e8f0', justifyContent: 'space-around' },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 12, marginTop: 4, color: '#64748b' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', padding: 25, borderRadius: 15 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 }
});