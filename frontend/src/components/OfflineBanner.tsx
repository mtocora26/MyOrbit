import { useOnlineStatus } from "../hooks/useOnlineStatus";

export default function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div role="status" className="flex-shrink-0 bg-[#101828] px-4 py-2 text-center text-[12px] font-medium text-white">
      Sin conexión. Puedes navegar, pero tus datos no se actualizarán hasta volver a conectarte.
    </div>
  );
}
