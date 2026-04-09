// frontend/src/components/Vehicles.js
import React, { useState, useEffect } from 'react';
import { Car, Plus, X, Trash2 } from 'lucide-react';
import { vehiclesAPI } from '../services/api';

const Vehicles = ({ userId }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    plate_no: '',
    vehicle_type: 'car'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVehicles();
  }, [userId]);

  const fetchVehicles = async () => {
    try {
      const response = await vehiclesAPI.getByOwner(userId);
      setVehicles(response.data.data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.plate_no.trim()) {
      setError('Please enter a plate number');
      return;
    }

    if (formData.plate_no.length < 3 || formData.plate_no.length > 10) {
      setError('Plate number must be between 3 and 10 characters');
      return;
    }

    try {
      await vehiclesAPI.create({
        plate_no: formData.plate_no.toUpperCase(),
        owner_id: userId,
        vehicle_type: formData.vehicle_type
      });

      alert('Vehicle added successfully!');
      setShowAddModal(false);
      setFormData({ plate_no: '', vehicle_type: 'car' });
      fetchVehicles(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add vehicle');
    }
  };

  const handleDeleteVehicle = async (plateNo) => {
    if (!window.confirm(`Are you sure you want to delete vehicle ${plateNo}?`)) {
      return;
    }

    try {
      await vehiclesAPI.delete(plateNo);
      alert('Vehicle deleted successfully!');
      fetchVehicles(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete vehicle. It may have active reservations.');
    }
  };

  const getVehicleIcon = (type) => {
    switch(type) {
      case 'motorcycle':
        return '🏍️';
      case 'truck':
        return '🚛';
      default:
        return '🚗';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading vehicles...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Vehicles</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Vehicle
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-12">
          <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No vehicles registered</p>
          <p className="text-gray-400 text-sm">Add your first vehicle to start making reservations</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Add Your First Vehicle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vehicles.map(vehicle => (
            <div 
              key={vehicle.plate_no} 
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative group"
            >
              {/* Delete Button */}
              <button
                onClick={() => handleDeleteVehicle(vehicle.plate_no)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                title="Delete vehicle"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 p-3 rounded-lg text-3xl">
                  {getVehicleIcon(vehicle.vehicle_type)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{vehicle.plate_no}</h3>
                  <p className="text-sm text-gray-500 capitalize">{vehicle.vehicle_type}</p>
                </div>
              </div>
              <div className="border-t pt-3 mt-3">
                <p className="text-sm text-gray-600">
                  Owner: <span className="font-medium text-gray-800">{vehicle.owner_name || 'You'}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800">Add New Vehicle</h3>
              <button onClick={() => {
                setShowAddModal(false);
                setError('');
                setFormData({ plate_no: '', vehicle_type: 'car' });
              }}>
                <X className="w-6 h-6 text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plate Number *
                </label>
                <input
                  type="text"
                  value={formData.plate_no}
                  onChange={(e) => setFormData({...formData, plate_no: e.target.value})}
                  placeholder="e.g., ABC123 or 12345AB"
                  required
                  maxLength={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter 3-10 characters (letters and numbers)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Type *
                </label>
                <select
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({...formData, vehicle_type: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="car">🚗 Car</option>
                  <option value="motorcycle">🏍️ Motorcycle</option>
                  <option value="truck">🚛 Truck</option>
                </select>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Note:</strong> Make sure the plate number is correct. 
                  You'll use this to make parking reservations.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setError('');
                    setFormData({ plate_no: '', vehicle_type: 'car' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;