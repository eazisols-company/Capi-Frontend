export default function VersionDisplay() {
  return (
    <div className="flex items-center justify-center py-2">
      <span className="text-xs text-muted-foreground">
        Version: {import.meta.env.VITE_APP_VERSION || '0.0.0'}
      </span>
    </div>
  );
}
