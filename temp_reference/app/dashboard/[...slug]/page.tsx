import Link from "next/link";
import { Construction } from "lucide-react";

const MODULE_TITLES: Record<string, string> = {
  chat: "Chat interno",
  empresa: "Empresa",
  atendimento: "Atendimento",
  contatos: "Contatos",
  pedidos: "Pedidos",
  separacao: "Separação",
  rotas: "Rotas",
  conferencia: "Conferência",
  entrega: "Entrega",
  configuracoes: "Configurações",
};

export default async function ModulePlaceholder({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const key = slug?.[0] ?? "";
  const title = MODULE_TITLES[key] ?? "Módulo";

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary">
        <Construction className="h-7 w-7 text-accent" aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
      <p className="max-w-md text-muted-foreground">
        Este módulo faz parte das próximas fases do sistema. A estrutura de
        navegação e o layout base já estão prontos — a construção de{" "}
        <span className="font-medium text-foreground">{title}</span> virá em
        seguida.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
