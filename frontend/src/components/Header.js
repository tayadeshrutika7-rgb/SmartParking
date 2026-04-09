// frontend/src/components/Header.js
import React from 'react';
import { ParkingCircle, LogOut, User } from 'lucide-react';

const Header = ({ user, onLogout }) => {
  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <ParkingCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Smart Parking</h1>
              <p className="text-sm text-gray-500">City Management System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
              <User className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;