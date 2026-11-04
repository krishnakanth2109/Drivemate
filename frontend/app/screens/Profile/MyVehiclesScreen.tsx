import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeftIcon,
  PlusIcon,
  CarIcon,
  CheckCircleIcon,
  CloseIcon,
  TrashIcon,
} from "../../components/Icons";
import { vehiclesAPI } from "../../services/api";

interface Vehicle {
  id: string;
  name: string;
  year: string;
  type: "EV" | "Gas" | "Hybrid";
  plate: string;
  vin: string;
  odometer: string;
  batteryOrFuel: string;
  isPrimary: boolean;
  serviceDue: string;
}

const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: "v1",
    name: "Tesla Model 3 Long Range",
    year: "2024",
    type: "EV",
    plate: "9DM-774",
    vin: "5YJ3E1EB7PF881290",
    odometer: "14,250 mi",
    batteryOrFuel: "82% Battery (272 mi)",
    isPrimary: true,
    serviceDue: "Tire rotation in 3,500 mi",
  },
  {
    id: "v2",
    name: "Porsche 911 GT3 Touring",
    year: "2022",
    type: "Gas",
    plate: "GT3-CALI",
    vin: "WP0AC2A98NS219044",
    odometer: "6,800 mi",
    batteryOrFuel: "Full Tank (93 Oct)",
    isPrimary: false,
    serviceDue: "Annual fluid check in 4,200 mi",
  },
];

const MyVehiclesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add form fields
  const [newMake, setNewMake] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newYear, setNewYear] = useState("2024");
  const [newPlate, setNewPlate] = useState("");
  const [newVin, setNewVin] = useState("");
  const [newType, setNewType] = useState<"EV" | "Gas" | "Hybrid">("EV");

  useEffect(() => {
    async function fetchGarage() {
      try {
        const res = await vehiclesAPI.getVehicles();
        if (res.success && Array.isArray(res.vehicles) && res.vehicles.length > 0) {
          setVehicles(res.vehicles);
        }
      } catch {}
    }
    fetchGarage();
  }, []);

  const handleSetPrimary = (id: string) => {
    setVehicles((prev) =>
      prev.map((v) => ({ ...v, isPrimary: v.id === id }))
    );
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Remove Vehicle", `Are you sure you want to remove ${name} from your garage?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setVehicles((prev) => prev.filter((v) => v.id !== id));
          try {
            await vehiclesAPI.removeVehicle(id);
          } catch {}
        },
      },
    ]);
  };

  const handleAddVehicle = async () => {
    if (!newMake.trim() || !newModel.trim() || !newPlate.trim()) {
      Alert.alert("Missing Details", "Please provide Make, Model, and License Plate.");
      return;
    }

    const vehicleName = `${newMake.trim()} ${newModel.trim()}`;
    const created: Vehicle = {
      id: `v_${Date.now()}`,
      name: vehicleName,
      year: newYear.trim() || "2024",
      type: newType,
      plate: newPlate.trim().toUpperCase(),
      vin: newVin.trim() ? newVin.trim().toUpperCase() : "VIN: PENDING",
      odometer: "0 mi",
      batteryOrFuel: newType === "EV" ? "100% Battery" : "Full Tank",
      isPrimary: vehicles.length === 0,
      serviceDue: "Initial inspection due in 5,000 mi",
    };

    setVehicles([created, ...vehicles]);
    setIsAddModalOpen(false);

    try {
      await vehiclesAPI.addVehicle({
        name: vehicleName,
        year: created.year,
        type: created.type,
        plate: created.plate,
        vin: created.vin,
      });
    } catch {}

    // Reset
    setNewMake("");
    setNewModel("");
    setNewPlate("");
    setNewVin("");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeftIcon size={20} color="#09090b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Garage</Text>
        <TouchableOpacity
          style={styles.addHeaderBtn}
          onPress={() => setIsAddModalOpen(true)}
          activeOpacity={0.7}
        >
          <PlusIcon size={16} color="#09090b" />
          <Text style={styles.addHeaderText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Garage Status Banner */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <CarIcon size={22} color="#ffffff" />
          </View>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryTitle}>Garage Synced & Connected</Text>
            <Text style={styles.summarySub}>
              {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} linked with Drivemate telematics
            </Text>
          </View>
        </View>

        {/* Vehicles List */}
        <Text style={styles.sectionTitle}>Registered Vehicles</Text>

        {vehicles.map((v) => (
          <View key={v.id} style={styles.vehicleCard}>
            <View style={styles.cardTopRow}>
              <View style={styles.titleArea}>
                <View style={styles.nameRow}>
                  <Text style={styles.vehicleYear}>{v.year}</Text>
                  <Text style={styles.vehicleName}>{v.name}</Text>
                </View>
                <Text style={styles.plateText}>Plate: {v.plate}</Text>
              </View>

              {v.isPrimary ? (
                <View style={styles.primaryBadge}>
                  <CheckCircleIcon size={12} color="#09090b" />
                  <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.setPrimaryBtn}
                  onPress={() => handleSetPrimary(v.id)}
                >
                  <Text style={styles.setPrimaryText}>Set Primary</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Vehicle Specs Grid */}
            <View style={styles.specsGrid}>
              <View style={styles.specBox}>
                <Text style={styles.specLabel}>Status</Text>
                <Text style={styles.specValue}>{v.batteryOrFuel}</Text>
              </View>
              <View style={styles.specBox}>
                <Text style={styles.specLabel}>Odometer</Text>
                <Text style={styles.specValue}>{v.odometer}</Text>
              </View>
              <View style={styles.specBox}>
                <Text style={styles.specLabel}>Powertrain</Text>
                <Text style={styles.specValue}>{v.type}</Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.cardFooter}>
              <View style={styles.vinInfo}>
                <Text style={styles.vinText}>VIN: {v.vin}</Text>
                <Text style={styles.serviceText}>• {v.serviceDue}</Text>
              </View>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(v.id, v.name)}
                activeOpacity={0.7}
              >
                <TrashIcon size={16} color="#a1a1aa" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Add Vehicle Button */}
        <TouchableOpacity
          style={styles.bigAddBtn}
          onPress={() => setIsAddModalOpen(true)}
          activeOpacity={0.8}
        >
          <PlusIcon size={18} color="#09090b" />
          <Text style={styles.bigAddBtnText}>Add Another Vehicle</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Vehicle Modal */}
      <Modal
        visible={isAddModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Vehicle</Text>
              <TouchableOpacity
                onPress={() => setIsAddModalOpen(false)}
                style={styles.closeBtn}
              >
                <CloseIcon size={18} color="#71717a" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Make</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. BMW, Tesla, Audi, Porsche"
                  placeholderTextColor="#a1a1aa"
                  value={newMake}
                  onChangeText={setNewMake}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Model</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. M3, Model Y, RS6"
                  placeholderTextColor="#a1a1aa"
                  value={newModel}
                  onChangeText={setNewModel}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Year</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="2024"
                    placeholderTextColor="#a1a1aa"
                    value={newYear}
                    onChangeText={setNewYear}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>License Plate</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 7DM-491"
                    placeholderTextColor="#a1a1aa"
                    value={newPlate}
                    onChangeText={setNewPlate}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>VIN (Optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="17-character VIN"
                  placeholderTextColor="#a1a1aa"
                  value={newVin}
                  onChangeText={setNewVin}
                  autoCapitalize="characters"
                />
              </View>

              <Text style={styles.inputLabel}>Powertrain</Text>
              <View style={styles.typeRow}>
                {(["EV", "Gas", "Hybrid"] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeChip,
                      newType === type && styles.typeChipSelected,
                    ]}
                    onPress={() => setNewType(type)}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        newType === type && styles.typeChipTextSelected,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.submitVehicleBtn}
                onPress={handleAddVehicle}
                activeOpacity={0.85}
              >
                <Text style={styles.submitVehicleText}>Register to Garage</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MyVehiclesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#09090b",
    letterSpacing: -0.3,
  },
  addHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addHeaderText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 36,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#09090b",
    borderRadius: 18,
    padding: 16,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  summarySub: {
    fontSize: 12,
    color: "#a1a1aa",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#09090b",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  vehicleCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    marginBottom: 14,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  titleArea: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  vehicleYear: {
    fontSize: 15,
    fontWeight: "600",
    color: "#71717a",
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#09090b",
  },
  plateText: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 2,
  },
  primaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f4f4f5",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#18181b",
    letterSpacing: 0.5,
  },
  setPrimaryBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  setPrimaryText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#71717a",
  },
  specsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  specBox: {
    flex: 1,
  },
  specLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#71717a",
    textTransform: "uppercase",
  },
  specValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#09090b",
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    paddingTop: 10,
  },
  vinInfo: {
    flex: 1,
  },
  vinText: {
    fontSize: 11,
    color: "#71717a",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  serviceText: {
    fontSize: 11,
    color: "#09090b",
    marginTop: 2,
    fontWeight: "500",
  },
  deleteBtn: {
    padding: 6,
  },
  bigAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 6,
  },
  bigAddBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#09090b",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    alignItems: "center",
    justifyContent: "center",
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: "row",
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#71717a",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#09090b",
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  typeChipSelected: {
    backgroundColor: "#09090b",
    borderColor: "#09090b",
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#52525b",
  },
  typeChipTextSelected: {
    color: "#ffffff",
    fontWeight: "700",
  },
  submitVehicleBtn: {
    backgroundColor: "#09090b",
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 10,
  },
  submitVehicleText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
