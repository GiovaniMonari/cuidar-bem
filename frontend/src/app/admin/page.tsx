'use client';

import { type ReactNode, startTransition, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Ban,
  BarChart3,
  BellRing,
  Eye,
  FileWarning,
  LayoutDashboard,
  Loader2,
  MessagesSquare,
  Shield,
  ShieldCheck,
  ShieldOff,
  Siren,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import {
  AdminDashboardResponse,
  AdminLog,
  AdminReportDetailResponse,
  AdminUserDetailResponse,
  AdminUserListItem,
  PlatformReport,
} from '@/types';

type AdminTab = 'overview' | 'users' | 'reports' | 'logs';

const TABS: Array<{ key: AdminTab; label: string; icon: any }> = [
  { key: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { key: 'users', label: 'Usuários', icon: Users },
  { key: 'reports', label: 'Reports', icon: FileWarning },
  { key: 'logs', label: 'Logs', icon: Shield },
];

const REPORT_REASON_LABELS: Record<string, string> = {
  inappropriate_behavior: 'Comportamento inadequado',
  delay_or_no_show: 'Atraso ou não comparecimento',
  offensive_language: 'Linguagem ofensiva',
  fraud_attempt: 'Tentativa de fraude',
  other: 'Outro',
};

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [reports, setReports] = useState<PlatformReport[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetailResponse | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedReportDetail, setSelectedReportDetail] = useState<AdminReportDetailResponse | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [reportStatusFilter, setReportStatusFilter] = useState('pending');
  const [reportSourceFilter, setReportSourceFilter] = useState('all');
  const [moderationReason, setModerationReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [notice, setNotice] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [busyAction, setBusyAction] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  const loadDashboard = async () => {
    const data = await api.getAdminDashboard();
    setDashboard(data);
  };

  const loadUsers = async () => {
    const params: Record<string, string> = {};
    if (userSearch.trim()) params.search = userSearch.trim();
    if (userRoleFilter !== 'all') params.role = userRoleFilter;
    if (userStatusFilter !== 'all') params.status = userStatusFilter;
    const data = await api.getAdminUsers(params);
    setUsers(data);
    if (data.length === 0) {
      setSelectedUserId(null);
      setSelectedUserDetail(null);
      return;
    }
    if (!selectedUserId || !data.some((entry) => (entry._id || entry.id) === selectedUserId)) {
      setSelectedUserId(data[0]._id || data[0].id);
    }
  };

  const loadReports = async () => {
    const params: Record<string, string> = {};
    if (reportStatusFilter !== 'all') params.status = reportStatusFilter;
    if (reportSourceFilter !== 'all') params.source = reportSourceFilter;
    const data = await api.getAdminReports(params);
    setReports(data);
    if (data.length === 0) {
      setSelectedReportId(null);
      setSelectedReportDetail(null);
      return;
    }
    if (!selectedReportId || !data.some((entry) => entry._id === selectedReportId)) {
      setSelectedReportId(data[0]._id);
    }
  };

  const loadLogs = async () => {
    const data = await api.getAdminLogs(50);
    setLogs(data);
  };

  useEffect(() => {
    if (user?.role !== 'admin') return;
    const loadInitial = async () => {
      setInitialLoading(true);
      try {
        await Promise.all([loadDashboard(), loadUsers(), loadReports(), loadLogs()]);
      } finally {
        setInitialLoading(false);
      }
    };
    loadInitial();
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    loadUsers().catch(() => undefined);
  }, [user?.role, userSearch, userRoleFilter, userStatusFilter]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    loadReports().catch(() => undefined);
  }, [user?.role, reportStatusFilter, reportSourceFilter]);

  useEffect(() => {
    if (!selectedUserId || user?.role !== 'admin') return;
    api.getAdminUserDetail(selectedUserId).then(setSelectedUserDetail).catch(() => undefined);
  }, [selectedUserId, user?.role]);

  useEffect(() => {
    if (!selectedReportId || user?.role !== 'admin') return;
    api.getAdminReportDetail(selectedReportId).then(setSelectedReportDetail).catch(() => undefined);
  }, [selectedReportId, user?.role]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    const refreshMs = (dashboard?.refreshWindowSeconds || 20) * 1000;
    const interval = window.setInterval(() => {
      loadDashboard().catch(() => undefined);
      loadLogs().catch(() => undefined);
      loadUsers().catch(() => undefined);
      loadReports().catch(() => undefined);
    }, refreshMs);
    return () => window.clearInterval(interval);
  }, [user?.role, dashboard?.refreshWindowSeconds, userSearch, userRoleFilter, userStatusFilter, reportStatusFilter, reportSourceFilter]);

  if (authLoading || initialLoading || !user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f4]">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
          Carregando central administrativa...
        </div>
      </div>
    );
  }

  const refreshEverything = async () => {
    await Promise.all([
      loadDashboard(),
      loadUsers(),
      loadReports(),
      loadLogs(),
      selectedUserId ? api.getAdminUserDetail(selectedUserId).then(setSelectedUserDetail) : Promise.resolve(),
      selectedReportId ? api.getAdminReportDetail(selectedReportId).then(setSelectedReportDetail) : Promise.resolve(),
    ]);
  };

  const handleUserAction = async (
    action: 'ban' | 'unban' | 'watchlist' | 'clear_watch',
  ) => {
    if (!selectedUserDetail) return;
    setBusyAction(true);
    setNotice('');
    try {
      await api.updateAdminUserModeration(
        selectedUserDetail.user._id || selectedUserDetail.user.id,
        { action, reason: moderationReason.trim() || undefined },
      );
      setNotice('Status do usuário atualizado com sucesso.');
      setModerationReason('');
      await refreshEverything();
    } catch (error: any) {
      setNotice(error.message || 'Não foi possível atualizar o usuário.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleReviewAction = async (
    action: 'watchlist' | 'ban' | 'dismiss' | 'unban' | 'none',
  ) => {
    if (!selectedReportDetail) return;
    setBusyAction(true);
    setNotice('');
    try {
      const response = await api.reviewAdminReport(selectedReportDetail.report._id, {
        action,
        notes: reviewNotes.trim() || undefined,
      });
      setSelectedReportDetail(response);
      setNotice('Denúncia revisada com sucesso.');
      setReviewNotes('');
      await refreshEverything();
    } catch (error: any) {
      setNotice(error.message || 'Não foi possível revisar a denúncia.');
    } finally {
      setBusyAction(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f4] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 overflow-hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(33,150,243,0.18),_transparent_38%),linear-gradient(135deg,#0f172a_0%,#16253f_45%,#1f6aa5_100%)] p-6 text-white shadow-xl shadow-slate-900/10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Gestão, segurança e monitoramento
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight">Painel Administrativo</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200">
                Monitore a plataforma em tempo quase real, revise denúncias, acompanhe contas sensíveis e mantenha a operação sob controle.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniKpi label="Online" value={dashboard?.metrics.onlineUsers || 0} tone="emerald" />
              <MiniKpi label="Reports pendentes" value={dashboard?.metrics.pendingReports || 0} tone="amber" />
              <MiniKpi label="Banidos" value={dashboard?.metrics.banned || 0} tone="rose" />
              <MiniKpi label="Observação" value={dashboard?.metrics.watchlist || 0} tone="blue" />
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => startTransition(() => setTab(key))}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all ${
                tab === key
                  ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/10'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {notice && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
            {notice}
          </div>
        )}

        {tab === 'overview' && dashboard && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <MetricCard title="Cuidadores" value={dashboard.metrics.caregivers} icon={Users} tone="blue" />
              <MetricCard title="Clientes" value={dashboard.metrics.clients} icon={Users} tone="emerald" />
              <MetricCard title="Admins" value={dashboard.metrics.admins} icon={Shield} tone="slate" />
              <MetricCard title="Serviços em andamento" value={dashboard.metrics.inProgressServices} icon={Activity} tone="amber" />
              <MetricCard title="Serviços concluídos" value={dashboard.metrics.completedServices} icon={ShieldCheck} tone="emerald" />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
              <PanelCard title="Crescimento da plataforma" subtitle="Usuários, serviços e denúncias dos últimos 7 dias.">
                <ChartBlock label="Usuários" data={dashboard.growth.users} color="#0f766e" />
                <ChartBlock label="Serviços" data={dashboard.growth.services} color="#2563eb" />
                <ChartBlock label="Denúncias" data={dashboard.growth.reports} color="#dc2626" />
              </PanelCard>

              <PanelCard title="Alertas e notificações" subtitle="Sinais operacionais que merecem atenção.">
                <div className="space-y-3">
                  {dashboard.notifications.length === 0 && <EmptyState text="Nenhum alerta ativo neste momento." />}
                  {dashboard.notifications.map((notification, index) => (
                    <div key={`${notification.title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <BellRing className="mt-0.5 h-4 w-4 text-amber-500" />
                        <div>
                          <p className="font-semibold text-slate-900">{notification.title}</p>
                          <p className="mt-1 text-sm text-slate-600">{notification.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </PanelCard>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <PanelCard title="Motivos mais reportados" subtitle="Últimos 7 dias">
                <div className="space-y-3">
                  {dashboard.topReasons.map((reason) => (
                    <div key={reason.key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <span className="text-sm font-medium text-slate-700">{reason.label}</span>
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">{reason.total}</span>
                    </div>
                  ))}
                </div>
              </PanelCard>

              <PanelCard title="Contas monitoradas" subtitle="Banidas e em observação">
                <div className="space-y-3">
                  {dashboard.flaggedUsers.map((flagged) => (
                    <button
                      key={flagged._id || flagged.id}
                      type="button"
                      onClick={() => {
                        startTransition(() => setTab('users'));
                        setSelectedUserId(flagged._id || flagged.id);
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-slate-300"
                    >
                      <p className="font-semibold text-slate-900">{flagged.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{flagged.email}</p>
                      <div className="mt-3">
                        <StatusBadge status={flagged.moderationStatus || 'active'} />
                      </div>
                    </button>
                  ))}
                </div>
              </PanelCard>

              <PanelCard title="Ações recentes" subtitle="Últimos eventos administrativos">
                <div className="space-y-3">
                  {dashboard.logs.map((log) => (
                    <div key={log._id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{log.description}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDateTime(log.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </PanelCard>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <PanelCard title="Gestão de usuários" subtitle="Busca, filtros, status e sinalização de risco.">
              <div className="mb-4 grid gap-3 md:grid-cols-3">
                <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Buscar por nome, email ou telefone" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 md:col-span-2" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm">
                    <option value="all">Todos papéis</option>
                    <option value="client">Clientes</option>
                    <option value="caregiver">Cuidadores</option>
                    <option value="admin">Admins</option>
                  </select>
                  <select value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm">
                    <option value="all">Todos status</option>
                    <option value="active">Ativo</option>
                    <option value="watchlist">Observação</option>
                    <option value="banned">Banido</option>
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                {users.map((entry) => (
                  <button key={entry._id || entry.id} type="button" onClick={() => setSelectedUserId(entry._id || entry.id)} className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${selectedUserId === (entry._id || entry.id) ? 'border-slate-900 bg-slate-950 text-white' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{entry.name}</p>
                        <p className={`mt-1 text-sm ${selectedUserId === (entry._id || entry.id) ? 'text-slate-300' : 'text-slate-500'}`}>{entry.email}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <StatusBadge status={entry.moderationStatus || 'active'} />
                          <InlinePill label={entry.role} />
                          <InlinePill label={`${entry.receivedReports} reports`} />
                          <InlinePill label={entry.isOnlineNow ? 'online' : 'offline'} />
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <p className={selectedUserId === (entry._id || entry.id) ? 'text-slate-200' : 'text-slate-500'}>{entry.activeServices} ativos</p>
                        <p className={selectedUserId === (entry._id || entry.id) ? 'text-slate-300' : 'text-slate-400'}>{entry.completedServices} concluídos</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </PanelCard>

            <PanelCard title="Detalhe do usuário" subtitle="Ações rápidas, histórico e denúncias recebidas.">
              {!selectedUserDetail && <EmptyState text="Selecione um usuário para visualizar detalhes." />}
              {selectedUserDetail && (
                <div className="space-y-5">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xl font-semibold text-slate-900">{selectedUserDetail.user.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{selectedUserDetail.user.email}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge status={selectedUserDetail.user.moderationStatus || 'active'} />
                      <InlinePill label={selectedUserDetail.user.role} />
                      {selectedUserDetail.user.lastSeenAt && <InlinePill label={`Último acesso ${formatDateTime(selectedUserDetail.user.lastSeenAt)}`} />}
                    </div>
                    {(selectedUserDetail.user.banReason || selectedUserDetail.user.moderationReason) && (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        {selectedUserDetail.user.banReason || selectedUserDetail.user.moderationReason}
                      </div>
                    )}
                  </div>

                  <textarea value={moderationReason} onChange={(e) => setModerationReason(e.target.value)} placeholder="Motivo da ação administrativa" className="min-h-[100px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100" />
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <ActionButton onClick={() => handleUserAction('watchlist')} busy={busyAction} label="Colocar em observação" tone="amber" icon={Eye} />
                    <ActionButton onClick={() => handleUserAction('ban')} busy={busyAction} label="Banir conta" tone="rose" icon={Ban} />
                    <ActionButton onClick={() => handleUserAction('unban')} busy={busyAction} label="Reverter banimento" tone="emerald" icon={ShieldOff} />
                    <ActionButton onClick={() => handleUserAction('clear_watch')} busy={busyAction} label="Remover observação" tone="slate" icon={ShieldCheck} />
                  </div>

                  <div className="grid gap-5 xl:grid-cols-2">
                    <div>
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Histórico de atividades</h3>
                      <div className="space-y-3">
                        {selectedUserDetail.activity.map((item) => (
                          <div key={`${item.kind}-${item.id}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                            <p className="font-semibold text-slate-900">{item.title}</p>
                            <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                            <p className="mt-2 text-xs text-slate-400">{formatDateTime(item.timestamp)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Histórico de denúncias</h3>
                      <div className="space-y-3">
                        {selectedUserDetail.reportsReceived.map((report) => (
                          <button
                            key={report._id}
                            type="button"
                            onClick={() => {
                              startTransition(() => setTab('reports'));
                              setSelectedReportId(report._id);
                            }}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-slate-300"
                          >
                            <p className="font-semibold text-slate-900">{REPORT_REASON_LABELS[report.reason] || report.reason}</p>
                            <p className="mt-1 text-sm text-slate-600">{report.source === 'chat' ? 'Originado no chat' : 'Originado no pós-serviço'}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <StatusBadge status={report.status} />
                              <InlinePill label={`auto: ${report.autoAction}`} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </PanelCard>
          </div>
        )}

        {tab === 'reports' && (
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <PanelCard title="Fila de denúncias" subtitle="Reports do chat e do fluxo pós-serviço.">
              <div className="mb-4 grid grid-cols-2 gap-3">
                <select value={reportStatusFilter} onChange={(e) => setReportStatusFilter(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm">
                  <option value="all">Todos status</option>
                  <option value="pending">Pendentes</option>
                  <option value="under_review">Em revisão</option>
                  <option value="resolved">Resolvidos</option>
                  <option value="dismissed">Descartados</option>
                </select>
                <select value={reportSourceFilter} onChange={(e) => setReportSourceFilter(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm">
                  <option value="all">Todas origens</option>
                  <option value="chat">Chat</option>
                  <option value="service">Pós-serviço</option>
                </select>
              </div>
              <div className="space-y-3">
                {reports.map((report) => (
                  <button key={report._id} type="button" onClick={() => setSelectedReportId(report._id)} className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${selectedReportId === report._id ? 'border-slate-900 bg-slate-950 text-white' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{REPORT_REASON_LABELS[report.reason] || report.reason}</p>
                        <p className={`mt-1 text-sm ${selectedReportId === report._id ? 'text-slate-300' : 'text-slate-500'}`}>{(report.reporterId as any)?.name} denunciou {(report.reportedUserId as any)?.name}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <StatusBadge status={report.status} />
                          <InlinePill label={report.source === 'chat' ? 'chat' : 'pós-serviço'} />
                        </div>
                      </div>
                      <Siren className={`h-5 w-5 ${selectedReportId === report._id ? 'text-rose-300' : 'text-rose-500'}`} />
                    </div>
                  </button>
                ))}
              </div>
            </PanelCard>

            <PanelCard title="Revisão manual" subtitle="Evidências, histórico e decisão administrativa.">
              {!selectedReportDetail && <EmptyState text="Selecione uma denúncia para revisar." />}
              {selectedReportDetail && (
                <div className="space-y-5">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xl font-semibold text-slate-900">{REPORT_REASON_LABELS[selectedReportDetail.report.reason] || selectedReportDetail.report.reason}</p>
                    <p className="mt-1 text-sm text-slate-500">{(selectedReportDetail.report.reporterId as any)?.name} denunciou {(selectedReportDetail.report.reportedUserId as any)?.name}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge status={selectedReportDetail.report.status} />
                      <InlinePill label={`auto: ${selectedReportDetail.report.autoAction}`} />
                      <InlinePill label={`score ${selectedReportDetail.report.severityScore?.toFixed?.(1) || selectedReportDetail.report.severityScore || 0}`} />
                    </div>
                    {selectedReportDetail.report.description && (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                        {selectedReportDetail.report.description}
                      </div>
                    )}
                  </div>
                  <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="Notas da revisão manual" className="min-h-[100px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100" />
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <ActionButton onClick={() => handleReviewAction('watchlist')} busy={busyAction} label="Colocar em observação" tone="amber" icon={Eye} />
                    <ActionButton onClick={() => handleReviewAction('ban')} busy={busyAction} label="Banir conta" tone="rose" icon={Ban} />
                    <ActionButton onClick={() => handleReviewAction('unban')} busy={busyAction} label="Reverter banimento" tone="emerald" icon={ShieldOff} />
                    <ActionButton onClick={() => handleReviewAction('dismiss')} busy={busyAction} label="Descartar report" tone="slate" icon={ShieldCheck} />
                  </div>

                  <div className="grid gap-5 xl:grid-cols-2">
                    <div>
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Evidências do chat</h3>
                      <div className="space-y-3">
                        {selectedReportDetail.evidence.messages.length === 0 && <EmptyState text="Sem mensagens anexadas para esta denúncia." />}
                        {selectedReportDetail.evidence.messages.map((message) => (
                          <div key={message._id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                            <p className="font-semibold text-slate-900">{message.senderId?.name || 'Usuário'}</p>
                            <p className="mt-1 text-sm text-slate-600">{message.content}</p>
                            <p className="mt-2 text-xs text-slate-400">{formatDateTime(message.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Histórico relacionado</h3>
                      <div className="space-y-3">
                        {selectedReportDetail.evidence.feedbacks.map((feedback) => (
                          <div key={feedback._id} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                            <p className="font-semibold text-emerald-900">Relatório assistencial vinculado</p>
                            <p className="mt-1 text-sm text-emerald-800">{feedback.content}</p>
                            <p className="mt-2 text-xs text-emerald-700">{formatDateTime(feedback.createdAt)}</p>
                          </div>
                        ))}
                        {selectedReportDetail.previousReports.map((report) => (
                          <div key={report._id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                            <p className="font-semibold text-slate-900">{REPORT_REASON_LABELS[report.reason] || report.reason}</p>
                            <p className="mt-1 text-sm text-slate-600">{formatDateTime(report.createdAt)}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <StatusBadge status={report.status} />
                              <InlinePill label={report.source} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </PanelCard>
          </div>
        )}

        {tab === 'logs' && (
          <PanelCard title="Logs administrativos" subtitle="Rastro de auditoria das ações do sistema e dos admins.">
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log._id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{log.description}</p>
                      <p className="mt-1 text-sm text-slate-500">{log.actorId?.name || log.actorType}</p>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <p>{formatDateTime(log.createdAt)}</p>
                      <p className="mt-1 uppercase tracking-[0.12em]">{log.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </PanelCard>
        )}
      </div>
    </div>
  );
}

function PanelCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number;
  icon: any;
  tone: 'blue' | 'emerald' | 'amber' | 'slate';
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  } as const;

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{title}</p>
    </div>
  );
}

function ChartBlock({
  label,
  data,
  color,
}: {
  label: string;
  data: Array<{ label: string; total: number }>;
  color: string;
}) {
  const max = Math.max(...data.map((item) => item.total), 1);
  const points = data
    .map(
      (item, index) =>
        `${(index / Math.max(data.length - 1, 1)) * 100},${100 - (item.total / max) * 85}`,
    )
    .join(' ');

  return (
    <div className="mb-5 last:mb-0">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <div className="inline-flex items-center gap-2 text-xs text-slate-400">
          <BarChart3 className="h-3.5 w-3.5" />
          7 dias
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <svg viewBox="0 0 100 100" className="h-28 w-full overflow-visible">
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="3"
            points={points}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] text-slate-400">
          {data.map((item) => (
            <span key={item.label}>{item.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function InlinePill({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    watchlist: 'border-amber-200 bg-amber-50 text-amber-700',
    banned: 'border-rose-200 bg-rose-50 text-rose-700',
    pending: 'border-amber-200 bg-amber-50 text-amber-700',
    under_review: 'border-blue-200 bg-blue-50 text-blue-700',
    resolved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dismissed: 'border-slate-200 bg-slate-100 text-slate-600',
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${map[status] || map.active}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function MiniKpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'emerald' | 'amber' | 'rose' | 'blue';
}) {
  const tones = {
    emerald: 'bg-emerald-400/15 text-emerald-100 border-emerald-300/15',
    amber: 'bg-amber-400/15 text-amber-100 border-amber-300/15',
    rose: 'bg-rose-400/15 text-rose-100 border-rose-300/15',
    blue: 'bg-blue-400/15 text-blue-100 border-blue-300/15',
  } as const;

  return (
    <div className={`rounded-2xl border px-4 py-3 ${tones[tone]}`}>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.16em]">{label}</p>
    </div>
  );
}

function ActionButton({
  onClick,
  busy,
  label,
  tone,
  icon: Icon,
}: {
  onClick: () => void;
  busy: boolean;
  label: string;
  tone: 'amber' | 'rose' | 'emerald' | 'slate';
  icon: any;
}) {
  const tones = {
    amber: 'bg-amber-500 hover:bg-amber-600 text-white',
    rose: 'bg-rose-600 hover:bg-rose-700 text-white',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    slate: 'bg-slate-900 hover:bg-slate-800 text-white',
  } as const;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${tones[tone]}`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      <MessagesSquare className="mx-auto mb-3 h-5 w-5 text-slate-300" />
      {text}
    </div>
  );
}

function formatDateTime(value?: string) {
  if (!value) return 'Sem registro';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
