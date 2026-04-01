'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Booking, SPECIALTIES } from '@/types';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  User,
  MapPin,
  Phone,
} from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function DashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated]);

  const fetchBookings = async () => {
    try {
      const data = await api.getMyBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, status: string) => {
    try {
      await api.updateBookingStatus(bookingId, status);
      fetchBookings();
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  const filtered =
    tab === 'all' ? bookings : bookings.filter((b) => b.status === tab);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {user?.role === 'caregiver'
              ? 'Gerencie seus atendimentos'
              : 'Acompanhe seus agendamentos'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Total',
              value: bookings.length,
              color: 'bg-gray-100 text-gray-700',
            },
            {
              label: 'Pendentes',
              value: bookings.filter((b) => b.status === 'pending').length,
              color: 'bg-yellow-100 text-yellow-700',
            },
            {
              label: 'Confirmados',
              value: bookings.filter((b) => b.status === 'confirmed').length,
              color: 'bg-blue-100 text-blue-700',
            },
            {
              label: 'Concluídos',
              value: bookings.filter((b) => b.status === 'completed').length,
              color: 'bg-green-100 text-green-700',
            },
          ].map((stat, i) => (
            <div key={i} className="card p-4">
              <div className={`text-2xl font-bold`}>{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'pending', label: 'Pendentes' },
            { key: 'confirmed', label: 'Confirmados' },
            { key: 'completed', label: 'Concluídos' },
            { key: 'cancelled', label: 'Cancelados' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                tab === t.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-600">
              Nenhum agendamento
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              {tab === 'all'
                ? 'Você ainda não tem agendamentos'
                : `Nenhum agendamento com status "${STATUS_MAP[tab]?.label}"`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking) => {
              const status = STATUS_MAP[booking.status] || STATUS_MAP.pending;
              const StatusIcon = status.icon;
              const isCaregiver = user?.role === 'caregiver';

              return (
                <div key={booking._id} className="card p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(booking.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 text-sm">
                        {isCaregiver ? (
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>
                              <strong>Cliente:</strong>{' '}
                              {booking.clientName ||
                                (booking.clientId as any)?.name ||
                                '—'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>
                              <strong>Cuidador:</strong>{' '}
                              {(booking.caregiverId as any)?.userId?.name || '—'}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>
                            {new Date(booking.startDate).toLocaleDateString('pt-BR')}{' '}
                            -{' '}
                            {new Date(booking.endDate).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        {booking.address && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{booking.address}</span>
                          </div>
                        )}

                        {(booking.clientPhone ||
                          (booking.clientId as any)?.phone) && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>
                              {booking.clientPhone ||
                                (booking.clientId as any)?.phone}
                            </span>
                          </div>
                        )}
                      </div>

                      {booking.notes && (
                        <p className="mt-3 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                          {booking.notes}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    {booking.status === 'pending' && (
                      <div className="flex sm:flex-col gap-2 flex-shrink-0">
                        {isCaregiver && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(booking._id, 'confirmed')
                            }
                            className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                          >
                            Aceitar
                          </button>
                        )}
                        <button
                          onClick={() =>
                            handleStatusUpdate(booking._id, 'cancelled')
                          }
                          className="bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                    {booking.status === 'confirmed' && isCaregiver && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(booking._id, 'completed')
                        }
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex-shrink-0"
                      >
                        Concluir
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}