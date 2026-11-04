import { dataStore } from '../utils/database.js';

export const getVehicles = async (req, res) => {
  try {
    const user = await dataStore.getUserById(req.user.uid);
    const vehicles = (user && Array.isArray(user.vehicles)) ? user.vehicles : [];
    return res.status(200).json({
      success: true,
      vehicles,
    });
  } catch (error) {
    console.error('[VehicleController.getVehicles] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve garage vehicles.',
    });
  }
};

export const addVehicle = async (req, res) => {
  try {
    const { name, year, type, plate, vin, odometer, batteryOrFuel, isPrimary, serviceDue } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle make & model name is required.',
      });
    }

    const user = await dataStore.getUserById(req.user.uid);
    let vehicles = (user && Array.isArray(user.vehicles)) ? [...user.vehicles] : [];

    const newVehicle = {
      id: `v_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      year: year || '2024',
      type: type || 'EV',
      plate: plate || 'DM-' + Math.floor(100 + Math.random() * 900),
      vin: vin || '1DM' + Math.random().toString(36).substring(2, 12).toUpperCase(),
      odometer: odometer || '0 mi',
      batteryOrFuel: batteryOrFuel || (type === 'EV' ? '100% Battery' : '100% Fuel'),
      isPrimary: !!isPrimary || vehicles.length === 0,
      serviceDue: serviceDue || 'Inspection in 10,000 mi',
    };

    if (newVehicle.isPrimary) {
      vehicles = vehicles.map(v => ({ ...v, isPrimary: false }));
    }

    vehicles.unshift(newVehicle);

    const updatedUser = await dataStore.updateUser(req.user.uid, { vehicles });

    return res.status(201).json({
      success: true,
      message: 'Vehicle added to garage.',
      vehicle: newVehicle,
      vehicles: updatedUser.vehicles,
    });
  } catch (error) {
    console.error('[VehicleController.addVehicle] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add vehicle.',
    });
  }
};

export const removeVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const user = await dataStore.getUserById(req.user.uid);
    let vehicles = (user && Array.isArray(user.vehicles)) ? [...user.vehicles] : [];

    vehicles = vehicles.filter(v => v.id !== vehicleId);

    const updatedUser = await dataStore.updateUser(req.user.uid, { vehicles });

    return res.status(200).json({
      success: true,
      message: 'Vehicle removed from garage.',
      vehicles: updatedUser.vehicles,
    });
  } catch (error) {
    console.error('[VehicleController.removeVehicle] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to remove vehicle.',
    });
  }
};

