import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { AxiosError } from "axios";
import { registerPush, unregisterPush } from "../utils/push";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { ThemeToggleWithLabel } from "./ThemeToggle";
import { useVoice } from "../hooks/useVoice";
import { useRooms } from "../hooks/useRooms";
import api from "../api";
import { showError, showSuccess } from "../utils/toast";
import { useTranslation } from "react-i18next";
import type { RoomRead } from "../schemas/room";
import { isRtlLang } from "../utils/localeDirection";
import { ROUTES } from "../utils/routes";
import { getLocalizedRoomTitle } from "../utils/roomLocalization";

export const Settings = () => {
  const { i18n } = useTranslation();
  const { t: ts } = useTranslation("settings");
  const { t: tu } = useTranslation("settingsUi");
  const { t: tRooms } = useTranslation("rooms");
  const rtl = isRtlLang(i18n.language);

  const [pushEnabled, setPushEnabled] = useState(false);
  const { speak } = useVoice();
  const { data: rooms = [] } = useRooms();
  const [shareRoomId, setShareRoomId] = useState<number | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareLoading, setShareLoading] = useState(false);

  const enablePush = async () => {
    try {
      await registerPush();
      setPushEnabled(true);
      speak(tu("pushEnabledSpeak"));
    } catch (e) {
      console.error(e);
      speak(tu("pushEnableFailedSpeak"));
    }
  };

  const disablePush = async () => {
    const endpoint = localStorage.getItem("push_endpoint");
    if (endpoint) {
      try {
        await unregisterPush(endpoint);
        setPushEnabled(false);
        speak(tu("pushDisabledSpeak"));
      } catch (e) {
        console.error(e);
        speak(tu("pushDisableFailedSpeak"));
      }
    }
  };

  useEffect(() => {
    const check = async () => {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        setPushEnabled(true);
        localStorage.setItem("push_endpoint", sub.endpoint);
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    check();
  }, []);

  const shareByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareRoomId || !shareEmail.trim()) return;
    setShareLoading(true);
    try {
      await api.post(`/sharing/rooms/${shareRoomId}/share-by-email`, {
        email: shareEmail.trim(),
        permission: "viewer",
      });
      showSuccess(tu("shareSuccess"));
      setShareEmail("");
    } catch (err) {
      const axiosError = err as AxiosError<{ detail?: string }>;
      showError(axiosError?.response?.data?.detail ?? tu("shareFail"));
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4 bg-cream dark:bg-dark-bg min-h-screen">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">{ts("title")}</h2>

      <section>
        <ThemeToggleWithLabel />
      </section>

      <section>
        <h3 className="font-medium">{tu("pushTitle")}</h3>
        {pushEnabled ? (
          <button type="button" onClick={disablePush} className="btn btn-red">
            {tu("disableNotifications")}
          </button>
        ) : (
          <button type="button" onClick={enablePush} className="btn btn-sky">
            {tu("enableNotifications")}
          </button>
        )}
      </section>

      <section>
        <h3 className="font-medium">{tu("googleCalendarSync")}</h3>
        <GoogleLoginButton />
      </section>

      <section>
        <h3 className="font-medium">{tu("displayTitle")}</h3>
        <p>{tu("displayText")}</p>
      </section>

      <section className="wow-card wow-pad" dir={rtl ? "rtl" : "ltr"}>
        <h3 className="font-medium mb-2">{tu("homeSuppliesTitle")}</h3>
        <p className="wow-muted mb-3">{tu("homeSuppliesBody")}</p>
        <Link className="wow-btn wow-btnPrimary" to={ROUTES.INVENTORY}>
          {tu("openInventory")}
        </Link>
      </section>

      <section className="wow-card wow-pad" dir={rtl ? "rtl" : "ltr"}>
        <h3 className="font-medium mb-2">{tu("sharingTitle")}</h3>
        <p className="wow-muted mb-3">{tu("sharingSub")}</p>
        <form onSubmit={shareByEmail} style={{ display: "grid", gap: 8 }}>
          <select
            className="input"
            value={shareRoomId ?? ""}
            onChange={(e) => setShareRoomId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{tu("selectRoom")}</option>
            {rooms.map((room: RoomRead) => (
              <option key={room.id} value={room.id}>
                {getLocalizedRoomTitle(room.name, tRooms, { roomId: room.id })}
              </option>
            ))}
          </select>
          <input
            className="input"
            type="email"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
            placeholder={tu("emailPlaceholder")}
          />
          <button type="submit" className="wow-btn wow-btnPrimary" disabled={shareLoading}>
            {shareLoading ? tu("adding") : tu("addUser")}
          </button>
        </form>
      </section>
    </div>
  );
};

export default Settings;
