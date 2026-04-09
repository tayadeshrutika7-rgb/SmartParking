// frontend/src/components/Reservations.js
import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Calendar } from 'lucide-react';
import { reservationsAPI, vehiclesAPI } from '../services/api';

const Reservations = ({ userId }) => {
  const [reservations, setReservations] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchReservations = useCallback(async () => {
    try {
      console.log('fetchReservations called with userId:', userId);
      if (!userId) {
        console.log('userId is not available');
        setLoading(false);
        return;
      }
      // Get all user's vehicles
      const vehiclesResponse = await vehiclesAPI.getByOwner(userId);
      const userVehicles = vehiclesResponse.data.data;
      
      // Get all reservations
      const reservationsResponse = await reservationsAPI.getAll();
      const allReservations = reservationsResponse.data.data;
      
      // Filter reservations for user's vehicles
      const userReservations = allReservations.filter(res => 
        userVehicles.some(vehicle => vehicle.plate_no === res.plate_no)
      );
      
      console.log('Fetched reservations:', userReservations);
      setReservations(userReservations);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchTotalSpent = useCallback(async () => {
    try {
      console.log('fetchTotalSpent called with userId:', userId);
      if (!userId) {
        console.log('userId is not available for totalSpent');
        return;
      }
      const response = await reservationsAPI.getUserTotalSpent(userId);
      console.log('Total spent API response:', response.data);
      const total = response.data.data?.total_spent || 0;
      console.log('Setting totalSpent to:', total);
      setTotalSpent(total);
    } catch (error) {
      console.error('Error fetching total spent:', error);
      console.error('Error details:', error.response?.data || error.message);
      setTotalSpent(0);
    }
  }, [userId]);

  useEffect(() => {
    console.log('useEffect triggered with userId:', userId);
    if (userId) {
      fetchReservations();
      fetchTotalSpent();
    }
  }, [userId, fetchReservations, fetchTotalSpent]);

  const handleCancelReservation = async (resId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    try {
      await reservationsAPI.delete(resId);
      alert('Reservation cancelled successfully!');
      fetchReservations(); // Refresh the list
      fetchTotalSpent(); // Refresh total spent
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel reservation');
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-gray-100 text-gray-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading reservations...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Reservations</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-5 h-5" />
          <span>{reservations.length} Total Reservations</span>
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No reservations yet</p>
          <p className="text-gray-400 text-sm">Go to Dashboard to make your first reservation</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 text-gray-600 font-semibold">ID</th>
                <th className="text-left py-3 px-4 text-gray-600 font-semibold">Vehicle</th>
                <th className="text-left py-3 px-4 text-gray-600 font-semibold">Location</th>
                <th className="text-left py-3 px-4 text-gray-600 font-semibold">Start Time</th>
                <th className="text-left py-3 px-4 text-gray-600 font-semibold">End Time</th>
                <th className="text-left py-3 px-4 text-gray-600 font-semibold">Price</th>
                <th className="text-left py-3 px-4 text-gray-600 font-semibold">Status</th>
                <th className="text-left py-3 px-4 text-gray-600 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map(res => (
                <tr key={res.res_id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-700">#{res.res_id}</td>
                  <td className="py-3 px-4">
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
                      {res.plate_no}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{res.location || 'Unknown'}</td>
                  <td className="py-3 px-4 text-gray-600 text-sm">
                    {formatDateTime(res.start_time)}
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-sm">
                    {formatDateTime(res.end_time)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-800">
                    {parseFloat(res.price).toFixed(2)} MAD
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(res.status)}`}>
                      {res.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {res.status === 'active' && (
                      <button
                        onClick={() => handleCancelReservation(res.res_id)}
                        className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                        title="Cancel reservation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Stats */}
      {reservations.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Active Reservations</p>
            <p className="text-2xl font-bold text-green-700">
              {reservations.filter(r => r.status === 'active').length}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-gray-700">
              {reservations.filter(r => r.status === 'completed').length}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Amount Spent</p>
            <p className="text-2xl font-bold text-blue-700">
              {totalSpent.toFixed(2)} MAD
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservations;