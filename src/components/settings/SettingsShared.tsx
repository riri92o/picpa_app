import type { ReactNode } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { localDateKey } from "../../domain/date";

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 MB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function backupFilename(label = "backup") {
  return `PicPa-${label}-${localDateKey()}.picpa`;
}

/** Keep the URL alive while the browser hands the file to Downloads or Files. */
export function downloadBackup(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function SettingsRow({
  Icon,
  title,
  description,
  value,
  disabled,
  onClick,
}: {
  Icon: LucideIcon;
  title: string;
  description?: string;
  value?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="settings-link-row"
      onClick={onClick}
      disabled={disabled}
    >
      <span className="setting-icon" aria-hidden="true">
        <Icon size={19} />
      </span>
      <span className="settings-row-copy">
        <span className="settings-row-title">{title}</span>
        {description && (
          <span className="settings-row-detail">{description}</span>
        )}
      </span>
      {value && <span className="settings-row-value">{value}</span>}
      <ChevronRight size={17} className="settings-chevron" aria-hidden="true" />
    </button>
  );
}

export function SettingsGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="settings-group" aria-label={title}>
      <h3 className="settings-group-heading">{title}</h3>
      <div className="settings-group-card">{children}</div>
    </section>
  );
}

export function SettingsNotice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <p
      className={`settings-notice ${error ? "is-error" : ""}`}
      role={error ? "alert" : "status"}
    >
      {children}
    </p>
  );
}
