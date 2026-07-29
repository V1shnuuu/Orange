import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned actions (buttons, links). */
  actions?: React.ReactNode;
  /** Small label rendered above the title. */
  eyebrow?: string;
}

/**
 * Consistent header for app screens. Deliberately calmer than the
 * marketing display type used on the landing page.
 */
export default function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: PageHeaderProps) {
  return (
    <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <span className="eyebrow mb-3">
            <span className="pulse-indicator" />
            {eyebrow}
          </span>
        )}
        <h1 className="heading-page text-white">{title}</h1>
        {description && (
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-text-secondary">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 gap-3">{actions}</div>}
    </div>
  );
}
