// frontend/src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { MapPin, ParkingCircle, Users, TrendingUp, Trash2, AlertCircle, Car, Clock, X } from 'lucide-react';
import { parkingLotsAPI, reservationsAPI, vehiclesAPI } from '../services/api';

const Dashboard = ({ userId }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      // Decode token to check role
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        setIsAdmin(payload.role === 'admin');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading dashboard...</div>;
  }

  return isAdmin ? <AdminDashboard /> : <UserDashboard userId={userId} />;
};

// USER DASHBOARD
const UserDashboard = ({ userId }) => {
  const [parkingLots, setParkingLots] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  
  const [reservationForm, setReservationForm] = useState({
    plate_no: '',
    start_time: '',
    end_time: '',
  });

  const [vehicleForm, setVehicleForm] = useState({
    plate_no: '',
    vehicle_type: 'car',
  });

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      const [lotsRes, vehiclesRes, reservationsRes] = await Promise.all([
        parkingLotsAPI.getAll(),
        vehiclesAPI.getByOwner(userId),
        reservationsAPI.getAll()
      ]);
      
      setParkingLots(lotsRes.data.data);
      setVehicles(vehiclesRes.data.data);
      setReservations(reservationsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReserveClick = (lot) => {
    if (vehicles.length === 0) {
      alert('Please add a vehicle first!');
      setShowAddVehicleModal(true);
      return;
    }
    setSelectedLot(lot);
    setShowReservationModal(true);
    
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
    
    setReservationForm({
      plate_no: vehicles[0]?.plate_no || '',
      start_time: startTime.toISOString().slice(0, 16),
      end_time: endTime.toISOString().slice(0, 16),
    });
  };

  const calculatePrice = () => {
    if (!reservationForm.start_time || !reservationForm.end_time || !selectedLot) {
      return 0;
    }
    
    const start = new Date(reservationForm.start_time);
    const end = new Date(reservationForm.end_time);
    const hours = (end - start) / (1000 * 60 * 60);
    const price = hours * selectedLot.hourly_rate;
    
    return price.toFixed(2);
  };

  const handleSubmitReservation = async (e) => {
    e.preventDefault();
    
    try {
      const price = calculatePrice();
      
      await reservationsAPI.create({
        plate_no: reservationForm.plate_no,
        lot_id: selectedLot.lot_id,
        start_time: reservationForm.start_time,
        end_time: reservationForm.end_time,
        price: parseFloat(price)
      });
      
      alert('Reservation created successfully!');
      setShowReservationModal(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create reservation');
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    
    try {
      await vehiclesAPI.create({
        plate_no: vehicleForm.plate_no,
        owner_id: userId,
        vehicle_type: vehicleForm.vehicle_type
      });
      
      alert('Vehicle added successfully!');
      setShowAddVehicleModal(false);
      setVehicleForm({ plate_no: '', vehicle_type: 'car' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add vehicle');
    }
  };

  const getAvailabilityColor = (available, total) => {
    const percentage = (available / total) * 100;
    if (percentage > 30) return 'text-green-600';
    if (percentage > 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Parking Lots</p>
              <h3 className="text-3xl font-bold mt-1">{parkingLots.length}</h3>
            </div>
            <MapPin className="w-12 h-12 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Available Spots</p>
              <h3 className="text-3xl font-bold mt-1">
                {parkingLots.reduce((sum, lot) => sum + lot.available_spots, 0)}
              </h3>
            </div>
            <ParkingCircle className="w-12 h-12 text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">My Reservations</p>
              <h3 className="text-3xl font-bold mt-1">
                {reservations.filter(r => r.status === 'active').length}
              </h3>
            </div>
            <Clock className="w-12 h-12 text-purple-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">My Vehicles</p>
              <h3 className="text-3xl font-bold mt-1">{vehicles.length}</h3>
            </div>
            <Car className="w-12 h-12 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Parking Lots Availability */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Parking Lot Availability</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parkingLots.map(lot => (
            <div key={lot.lot_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{lot.location}</h3>
                  <p className="text-sm text-gray-500">{lot.hourly_rate} MAD/hour</p>
                </div>
                <MapPin className="w-6 h-6 text-blue-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Available</span>
                  <span className={`font-bold text-lg ${getAvailabilityColor(lot.available_spots, lot.total_spots)}`}>
                    {lot.available_spots}/{lot.total_spots}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${(lot.available_spots / lot.total_spots) * 100}%` }}
                  ></div>
                </div>
              </div>
              <button 
                onClick={() => handleReserveClick(lot)}
                disabled={lot.available_spots === 0}
                className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {lot.available_spots === 0 ? 'Full' : 'Reserve Spot'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* My Vehicles Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">My Vehicles</h2>
          <button
            onClick={() => setShowAddVehicleModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            + Add Vehicle
          </button>
        </div>
        
        {vehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicles.map(vehicle => (
              <div key={vehicle.plate_no} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Car className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="font-semibold text-gray-800">{vehicle.plate_no}</p>
                    <p className="text-sm text-gray-500 capitalize">{vehicle.vehicle_type}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No vehicles added yet</p>
            <button
              onClick={() => setShowAddVehicleModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Add Your First Vehicle
            </button>
          </div>
        )}
      </div>

      {/* Reservation Modal */}
      {showReservationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800">New Reservation</h3>
              <button onClick={() => setShowReservationModal(false)}>
                <X className="w-6 h-6 text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            <form onSubmit={handleSubmitReservation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parking Lot
                </label>
                <input
                  type="text"
                  value={selectedLot?.location}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle
                </label>
                <select
                  value={reservationForm.plate_no}
                  onChange={(e) => setReservationForm({...reservationForm, plate_no: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle.plate_no} value={vehicle.plate_no}>
                      {vehicle.plate_no} - {vehicle.vehicle_type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={reservationForm.start_time}
                  onChange={(e) => setReservationForm({...reservationForm, start_time: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={reservationForm.end_time}
                  onChange={(e) => setReservationForm({...reservationForm, end_time: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Estimated Price:</span>
                  <span className="text-2xl font-bold text-blue-600">{calculatePrice()} MAD</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReservationModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800">Add Vehicle</h3>
              <button onClick={() => setShowAddVehicleModal(false)}>
                <X className="w-6 h-6 text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Plate
                </label>
                <input
                  type="text"
                  value={vehicleForm.plate_no}
                  onChange={(e) => setVehicleForm({...vehicleForm, plate_no: e.target.value.toUpperCase()})}
                  placeholder="e.g., A123BC"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Type
                </label>
                <select
                  value={vehicleForm.vehicle_type}
                  onChange={(e) => setVehicleForm({...vehicleForm, vehicle_type: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="car">Car</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="truck">Truck</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
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

// ADMIN DASHBOARD
const AdminDashboard = () => {
  const [parkingLots, setParkingLots] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [userSummary, setUserSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh every 5 seconds if enabled
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchData, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchData = async () => {
    try {
      const [lotsRes, reservationsRes, userSummaryRes] = await Promise.all([
        parkingLotsAPI.getAll(),
        reservationsAPI.getAdminDetails(),
        reservationsAPI.getUserSummary()
      ]);
      
      setParkingLots(lotsRes.data.data || []);
      setReservations(reservationsRes.data.data || []);
      setUserSummary(userSummaryRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReservation = async (resId) => {
    setDeleting(true);
    try {
      await reservationsAPI.delete(resId);
      alert('Reservation cancelled successfully!');
      setDeleteConfirm(null);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete reservation');
    } finally {
      setDeleting(false);
    }
  };

  const getTotalSpots = () => {
    return parkingLots.reduce((sum, lot) => sum + lot.total_spots, 0);
  };

  const getTotalAvailableSpots = () => {
    return parkingLots.reduce((sum, lot) => sum + lot.available_spots, 0);
  };

  const getTotalUsedSpots = () => {
    return getTotalSpots() - getTotalAvailableSpots();
  };

  const getOccupancyPercentage = () => {
    const total = getTotalSpots();
    const available = getTotalAvailableSpots();
    return total > 0 ? Math.round((available / total) * 100) : 0;
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium';
      case 'completed':
        return 'px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium';
      case 'cancelled':
        return 'px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium';
      default:
        return 'px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium';
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Auto-refresh toggle and refresh button */}
      <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">Auto-refresh every 5 seconds</span>
        </label>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Refresh Now
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Parking Lots</p>
              <p className="text-3xl font-bold mt-2">{parkingLots.length}</p>
            </div>
            <MapPin className="w-12 h-12 text-blue-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Available Spots</p>
              <p className="text-3xl font-bold mt-2">{getTotalAvailableSpots()}</p>
              <p className="text-green-200 text-xs mt-1">of {getTotalSpots()} total</p>
            </div>
            <ParkingCircle className="w-12 h-12 text-green-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Used Spots</p>
              <p className="text-3xl font-bold mt-2">{getTotalUsedSpots()}</p>
              <p className="text-orange-200 text-xs mt-1">{100 - getOccupancyPercentage()}% occupied</p>
            </div>
            <TrendingUp className="w-12 h-12 text-orange-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Reservations</p>
              <p className="text-3xl font-bold mt-2">{reservations.length}</p>
              <p className="text-purple-200 text-xs mt-1">
                {reservations.filter(r => r.status === 'active').length} active
              </p>
            </div>
            <Users className="w-12 h-12 text-purple-200 opacity-80" />
          </div>
        </div>
      </div>

      {/* Parking Lots Details */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Parking Lots Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-700">Location</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-700">Total Spots</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-700">Available</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-700">Used</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-700">Occupancy %</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {parkingLots.length > 0 ? (
                parkingLots.map((lot) => {
                  const used = lot.total_spots - lot.available_spots;
                  const occupancy = Math.round((used / lot.total_spots) * 100);
                  const occupancyColor = occupancy > 80 ? 'text-red-600' : occupancy > 50 ? 'text-yellow-600' : 'text-green-600';
                  
                  return (
                    <tr key={lot.lot_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-800">{lot.location}</td>
                      <td className="px-6 py-4 text-center text-gray-700 font-semibold">{lot.total_spots}</td>
                      <td className="px-6 py-4 text-center text-green-600 font-semibold">{lot.available_spots}</td>
                      <td className="px-6 py-4 text-center text-orange-600 font-semibold">{used}</td>
                      <td className={`px-6 py-4 text-center font-semibold ${occupancyColor}`}>{occupancy}%</td>
                      <td className="px-6 py-4 text-center">
                        {lot.available_spots > 0 ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Open
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            Full
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No parking lots found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Reservations Table */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">All Reservations</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-700">User Name</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-700">Vehicle Plate</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-700">Parking Location</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-700">Start Time</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-700">End Time</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-700">Price (MAD)</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-700">Status</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reservations.length > 0 ? (
                reservations.map((res) => (
                  <tr key={res.res_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">{res.user_name || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-700 font-mono">{res.plate_no}</td>
                    <td className="px-6 py-4 text-gray-700">{res.location || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-700 text-xs">{formatDateTime(res.start_time)}</td>
                    <td className="px-6 py-4 text-gray-700 text-xs">{formatDateTime(res.end_time)}</td>
                    <td className="px-6 py-4 text-center font-semibold text-gray-800">{(parseFloat(res.price) || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={getStatusColor(res.status)}>{res.status}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setDeleteConfirm(res)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors"
                        title="Cancel reservation"
                      >
                        <Trash2 className="w-4 h-4" />
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No reservations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User-wise Summary */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">User-wise Reservation Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-700">User Name</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-700">Total Reservations</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-700">Active Reservations</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-700">Completed Reservations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {userSummary.length > 0 ? (
                userSummary.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">{user.name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        {user.total_reservations || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                        {user.active_reservations || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                        {user.completed_reservations || 0}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No user data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-xl font-bold text-gray-800">Cancel Reservation</h3>
            </div>
            
            <div className="mb-6 space-y-2">
              <p className="text-gray-700">Are you sure you want to cancel this reservation?</p>
              <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                <p className="text-sm text-gray-600">
                  <strong>User:</strong> {deleteConfirm.user_name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Vehicle:</strong> {deleteConfirm.plate_no}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Location:</strong> {deleteConfirm.location}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>From:</strong> {formatDateTime(deleteConfirm.start_time)}
                </p>
              </div>
              <p className="text-sm text-red-600 font-medium">
                This action will free up the parking spot and cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                Keep Reservation
              </button>
              <button
                onClick={() => handleDeleteReservation(deleteConfirm.res_id)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? 'Cancelling...' : 'Cancel Reservation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;