/**
 * MainLayout v2.0 - Premium Edition
 * Expert Panel Redesign with new Sidebar component
 */

import React, { useState, useEffect } from 'react';
import { Bell, Menu, X, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleService } from '../services/GoogleService';
import Sidebar from '../components/layout/Sidebar';

// Notification Panel Component
const NotificationPanel = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="absolute right-4 top-20 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-slide-up">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">通知</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="p-4 text-center text-gray-500 text-sm">
        目前沒有新通知
      </div>
    </div>
  );
};

export const MainLayoutV2 = ({ activeTab, setActiveTab, children, addToast }) => {
  const { user, role, signOut } = useAuth();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [hasUpcomingEvents, setHasUpcomingEvents] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check upcoming events
  useEffect(() => {
    const checkUpcomingEvents = async () => {
      try {
        const events = await GoogleService.fetchCalendarEvents();
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const upcoming = events.some(event => {
          const eventDate = new Date(event.start?.dateTime || event.start?.date);
          return eventDate >= now && eventDate <= in24Hours;
        });

        setHasUpcomingEvents(upcoming);
      } catch (error) {
        console.log('Calendar check skipped');
      }
    };

    checkUpcomingEvents();
  }, []);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative z-50 h-full
        transform transition-transform duration-300 ease-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar 
          activeTab={activeTab} 
          onNavigate={(id) => {
            setActiveTab(id);
            setIsMobileMenuOpen(false);
          }}
        />
      </div>

      {/* Main Content */}
      <main className={`
        flex-1 flex flex-col h-screen overflow-hidden
        transition-all duration-300
        ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'}
        ml-0
      `}>
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 lg:px-8 bg-white/70 backdrop-blur-sm border-b border-gray-100/50">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2.5 text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-all"
          >
            <Menu size={22} />
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            {/* Notification Button */}
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative p-2.5 text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              <Bell size={18} strokeWidth={1.8} />
              {hasUpcomingEvents && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-50 transition-all"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-9 h-9 rounded-full border-2 border-white shadow-sm object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    <span className="font-semibold text-indigo-600 text-sm">
                      {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                    </span>
                  </div>
                )}
                <ChevronDown 
                  size={14} 
                  className={`text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} 
                />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-slide-up">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-800">{user?.displayName || user?.email}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      <span className={`
                        inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full
                        ${role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                          role === 'admin' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }
                      `}>
                        {role === 'super_admin' ? '最高管理員' : 
                         role === 'admin' ? '管理員' : 
                         role === 'owner' ? '老闆' : '一般使用者'}
                      </span>
                    </div>
                    <button
                      onClick={() => { setIsUserMenuOpen(false); signOut(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} />
                      登出
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Notification Panel */}
        <NotificationPanel
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

// Export both versions for gradual migration
export { MainLayoutV2 };
export default MainLayoutV2;
