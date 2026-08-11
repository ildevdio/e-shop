import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown,
  ClipboardList, Headset, DollarSign,
  Boxes, PackageCheck, Truck, Route, ScanLine,
  Megaphone, Wheat,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import GrainPattern from '../components/GrainPattern';
import { pedidoService } from '../services/pedidoService';
import { logisticaService } from '../services/logisticaService';
import { entregaService } from '../services/entregaService';
import { avisoService } from '../services/avisoService';
import type { LucideIcon } from 'lucide-react';
import { useSistemaStore } from '../store/sistemaStore';

interface Kpi {
  label: string;
  value: string;
  hint: string;
  trend?: { dir: 'up' | 'down'; value: string };
  icon: LucideIcon;
}

function getSectorKey(setores: string[]): string {
  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (setores.some(s => normalize(s) === normalize('Comercial'))) return 'comercial';
  if (setores.some(s => normalize(s) === normalize('Separação'))) return 'separacao';
  if (setores.some(s => normalize(s) === normalize('Logística'))) return 'logistica';
  return 'admin';
}

const FLOW = [
  'Comercial', 'Produção', 'Separação', 'Expedição',
  'Roteirização', 'Conferência', 'Entrega', 'Entregue',
];

export default function Dashboard() {
  const nome = useAuthStore(state => state.nome);
  const role = useAuthStore(state => state.role);
  const setores = useAuthStore(state => state.setores);
  const isAdmin = role === 'AdminMaster' || role === 'SuperAdmin';
  const config = useSistemaStore((state) => state.config);

  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      setCarregando(true);
      try {
        const [pedidos, veiculos, entregas, avisos] = await Promise.all([
          pedidoService.getPedidos(),
          logisticaService.getVeiculos(),
          entregaService.getEntregas(),
          avisoService.getAvisos(),
        ]);

        const pedidosAbertos = pedidos.filter(p => p.status === 'Pendente' || p.status === 'EmProducao').length;
        const pedidosEmSeparacao = pedidos.filter(p => p.status === 'EmSeparacao').length;
        const pedidosProntos = pedidos.filter(p => p.status === 'ProntoEntrega').length;
        const pedidosEntregues = pedidos.filter(p => p.status === 'Entregue').length;
        const faturamento = pedidos.reduce((acc, p) => acc + p.valorTotal, 0);

        const rotas = await logisticaService.getRotas();
        const rotasAtivas = rotas.filter(r => r.status === 'Criada' || r.status === 'EmAndamento').length;

        const entregasPendentes = entregas.filter(e => e.status === 'PendenteConferencia' || e.status === 'EmConferencia' || e.status === 'EmRota').length;

        const sectorKey = isAdmin ? 'admin' : getSectorKey(setores);

        const kpisBySector: Record<string, Kpi[]> = {
          comercial: [
            { label: 'Pedidos abertos', value: String(pedidosAbertos), hint: 'aguardando produção', icon: ClipboardList },
            { label: 'Em separação', value: String(pedidosEmSeparacao), hint: 'sendo separados', icon: Boxes },
            { label: 'Prontos p/ entrega', value: String(pedidosProntos), hint: 'expedidos', icon: PackageCheck },
            { label: 'Faturamento total', value: `R$ ${(faturamento / 1000).toFixed(1)}k`, hint: 'acumulado', icon: DollarSign },
          ],
          separacao: [
            { label: 'Pedidos em aberto', value: String(pedidosAbertos), hint: 'aguardando separação', icon: Boxes },
            { label: 'Itens a separar', value: String(pedidos.reduce((acc, p) => acc + (p.itens?.length ?? 0), 0)), hint: 'distribuídos nos pedidos', icon: ClipboardList },
            { label: 'Concluídos', value: String(pedidosEntregues + pedidosProntos), hint: 'prontos p/ entrega', icon: PackageCheck },
          ],
          logistica: [
            { label: 'Entregas pendentes', value: String(entregasPendentes), hint: 'aguardando', icon: Truck },
            { label: 'Rotas ativas', value: String(rotasAtivas), hint: 'veículos em campo', icon: Route },
            { label: 'Veículos', value: String(veiculos.length), hint: 'cadastrados', icon: ScanLine },
          ],
          admin: [
            { label: 'Avisos publicados', value: String(avisos.length), hint: 'no mural', icon: Megaphone },
            { label: 'Pedidos totais', value: String(pedidos.length), hint: 'no sistema', icon: ClipboardList },
            { label: 'Veículos', value: String(veiculos.length), hint: 'na frota', icon: Truck },
          ],
        };

        setKpis(kpisBySector[sectorKey] ?? kpisBySector.admin);
      } catch {
        setKpis([
          { label: 'Pedidos', value: '—', hint: 'carregando...', icon: ClipboardList },
        ]);
      }
      setCarregando(false);
    };
    carregar();
  }, [isAdmin, setores]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">

      <div className="relative overflow-hidden rounded-xl border border-border bg-primary p-8 text-primary-foreground anim-fade-in-up">
        <GrainPattern opacity={0.10} color="#fafafa" className="inset-0 w-full h-full" animated />
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Wheat size={16} className="text-white/40" />
            <span className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em]">{config.nomeEmpresa}{config.slogan ? ` — ${config.slogan}` : ''}</span>
          </div>
          <h2 className="text-2xl font-heading font-bold tracking-tight mb-1">
            {greeting}, {nome?.split(' ')[0] || 'Operador'}
          </h2>
          <p className="text-white/50 text-sm max-w-lg">
            Indicadores operacionais para hoje. Tenha uma excelente jornada.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {carregando ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse">
              <div className="h-10 w-10 bg-secondary rounded-lg mb-4"></div>
              <div className="h-7 w-16 bg-secondary rounded mb-2"></div>
              <div className="h-4 w-24 bg-secondary rounded"></div>
            </div>
          ))
        ) : (
          kpis.map((kpi, i) => (
            <div key={kpi.label} className={`anim-fade-in-up anim-delay-${i + 1}`}>
              <KpiCard kpi={kpi} />
            </div>
          ))
        )}
      </div>

      <section className="relative overflow-hidden rounded-xl border border-border bg-card p-5 anim-fade-in-up anim-delay-3">
        <GrainPattern opacity={0.05} color="#a3a3a3" className="inset-0 w-full h-full" animated />
        <div className="relative z-10">
          <h3 className="text-sm font-heading font-medium text-foreground">Fluxo do pedido</h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Do atendimento comercial até a entrega final ao cliente.
          </p>
          <ol className="flex flex-wrap items-center gap-2">
            {FLOW.map((step, i) => (
              <li key={step} className="flex items-center gap-2">
                <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
                  {step}
                </span>
                {i < FLOW.length - 1 && (
                  <span className="text-muted-foreground" aria-hidden="true">›</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[
          { to: '/comercial', icon: Headset, label: 'Atendimento', desc: 'Abrir omnichannel' },
          { to: '/comercial/pedidos', icon: ClipboardList, label: 'Pedidos', desc: 'Gerenciar pedidos' },
          { to: '/separacao', icon: PackageCheck, label: 'Separação', desc: 'Separar pedidos' },
        ].map((item, i) => (
          <Link
            key={item.to}
            to={item.to}
            className={`anim-fade-in-up anim-delay-${i + 4} rounded-xl border border-border bg-card p-5 transition-all hover:bg-secondary/50 hover:shadow-md hover:border-foreground/10`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <item.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.icon;
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md hover:border-foreground/10">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        {kpi.trend && (
          <span className={`flex items-center gap-1 text-xs font-medium ${kpi.trend.dir === 'up' ? 'text-success' : 'text-destructive'}`}>
            {kpi.trend.dir === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {kpi.trend.value}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-heading font-bold text-foreground">{kpi.value}</p>
      <p className="text-sm font-medium text-foreground">{kpi.label}</p>
      <p className="text-xs text-muted-foreground">{kpi.hint}</p>
    </div>
  );
}
