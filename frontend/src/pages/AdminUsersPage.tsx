import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosInstance';
import { Button } from '../components/ui/Button';
import { useUIStore } from '../store/uiStore';
import { User } from '../types/auth.types';
import { formatDate } from '../utils/dateHelpers';

export function AdminUsersPage() {
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(['users'], () => api.get<{ data: User[] }>('/users'));
  const users = data?.data?.data || [];

  const toggleRole = async (user: User) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await api.patch(`/users/${user.id}`, { role: newRole });
      addToast(`Role changed to ${newRole}`);
      queryClient.invalidateQueries(['users']);
    } catch {
      addToast('Role update failed', 'error');
    }
  };

  const toggleActive = async (user: User) => {
    try {
      await api.patch(`/users/${user.id}`, { is_active: !user.is_active });
      addToast(`User ${user.is_active ? 'deactivated' : 'activated'}`);
      queryClient.invalidateQueries(['users']);
    } catch {
      addToast('Update failed', 'error');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">User Management</h2>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {users.map((u) => (
                <div key={u.id} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-medium text-gray-800 text-sm">{u.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{u.email}</div>
                      <div className="text-xs text-gray-400 mt-0.5">Joined: {formatDate(u.created_at)}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                        {u.role}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => toggleRole(u)}>
                      {u.role === 'admin' ? 'Make User' : 'Make Admin'}
                    </Button>
                    <Button size="sm" variant={u.is_active ? 'danger' : 'ghost'} onClick={() => toggleActive(u)}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-peach-100 text-gray-600 border-b border-peach-200">
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-left px-4 py-3">Role</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Joined</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-gray-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => toggleRole(u)}>
                            {u.role === 'admin' ? 'Make User' : 'Make Admin'}
                          </Button>
                          <Button size="sm" variant={u.is_active ? 'danger' : 'ghost'} onClick={() => toggleActive(u)}>
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
