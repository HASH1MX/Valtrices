interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>}
    </div>
  );
}
