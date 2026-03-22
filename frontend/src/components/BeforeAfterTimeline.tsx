import { useEffect, useState } from "react";
import api from "../api";
import { useTranslation } from "react-i18next";
import { isRtlLang } from "../utils/localeDirection";

type TimelineItem = {
  task_id: number;
  task_title: string;
  room_id?: number | null;
  before_image_url: string;
  after_image_url: string;
  before_image_at?: string | null;
  after_image_at?: string | null;
  completed: boolean;
  completed_at?: string | null;
};

export default function BeforeAfterTimeline() {
  const { t } = useTranslation("dashboard");
  const { i18n } = useTranslation();
  const dirAttr = isRtlLang(i18n.language) ? "rtl" : "ltr";
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api
      .get<TimelineItem[]>("/tasks/progress-timeline", { params: { limit: 8 } })
      .then(({ data }) => {
        if (!mounted) return;
        setItems(data || []);
      })
      .catch(() => {
        if (!mounted) return;
        setItems([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="lifestyle-card" dir={dirAttr}>
      <div className="lifestyle-title">{t("beforeAfter_title")}</div>
      <div className="lifestyle-muted" style={{ marginBottom: 10 }}>
        {t("beforeAfter_subtitle")}
      </div>
      {loading ? (
        <div className="wow-skeleton" style={{ height: 90 }} />
      ) : items.length === 0 ? (
        <p className="wow-muted">{t("beforeAfter_empty")}</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((it) => (
            <article key={it.task_id} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 10 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{it.task_title}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <img
                  src={it.before_image_url}
                  alt={t("beforeAfter_altBefore")}
                  style={{ width: "100%", borderRadius: 10, objectFit: "cover", maxHeight: 140 }}
                />
                <img
                  src={it.after_image_url}
                  alt={t("beforeAfter_altAfter")}
                  style={{ width: "100%", borderRadius: 10, objectFit: "cover", maxHeight: 140 }}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
