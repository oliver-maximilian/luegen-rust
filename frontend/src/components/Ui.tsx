import type { ReactNode } from 'react';

type PanelProps = {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
};

export function Panel({ title, eyebrow, children, className = '' }: PanelProps) {
  return (
    <section className={`panel ${className}`.trim()}>
      {eyebrow ? <p className="panel__eyebrow">{eyebrow}</p> : null}
      {title ? <h2 className="panel__title">{title}</h2> : null}
      <div className="panel__body">{children}</div>
    </section>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return <button className={`button button--${variant} ${className}`.trim()} {...props} />;
}

type PillProps = {
  children: ReactNode;
  tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'gold';
};

export function Pill({ children, tone = 'neutral' }: PillProps) {
  return <span className={`pill pill--${tone}`}>{children}</span>;
}

type FieldProps = {
  label: string;
  children: ReactNode;
  hint?: string;
};

export function Field({ label, children, hint }: FieldProps) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

type SectionHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function SectionHeader({ title, description, actions }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div>
        <h3 className="section-header__title">{title}</h3>
        {description ? <p className="section-header__description">{description}</p> : null}
      </div>
      {actions ? <div className="section-header__actions">{actions}</div> : null}
    </div>
  );
}