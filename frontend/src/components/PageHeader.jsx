import React from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';

export default function PageHeader({
  icon: Icon,
  title,
  subtitle,
  onRefresh,
  refreshLabel = 'Refresh Data',
  loading = false,
  onBack,
  backLabel = 'Back to Dashboard',
  extraActions = null,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          {Icon && <Icon className="text-emerald-400" size={20} />}
          {title}
        </h2>
        {subtitle && <p className="text-xs text-neutral-400">{subtitle}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {extraActions}

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="px-3 py-1.5 rounded bg-[#1c1c1c] border border-neutral-800 hover:bg-neutral-800 hover:border-emerald-500/50 text-xs font-medium text-neutral-200 flex items-center gap-1.5 transition"
          >
            <RefreshCw
              size={13}
              className={`${loading ? 'animate-spin' : ''} text-emerald-400`}
            />
            {loading ? 'Refreshing...' : refreshLabel}
          </button>
        )}

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <ArrowLeft size={14} /> {backLabel}
          </button>
        )}
      </div>
    </div>
  );
}