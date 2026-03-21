import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { showError, showSuccess } from "../utils/toast";
import { EmotionalJournalEntry } from "../schemas/emotionalJournal";
import { useTranslation } from "react-i18next";
import { isRtlLang } from "../utils/localeDirection";
import { ROUTES, getCategoryRoute } from "../utils/routes";

export default function EmotionalJournalPage() {
  const { i18n, t } = useTranslation("emotionalJournal");
  const rtl = isRtlLang(i18n.language);

  const [entries, setEntries] = useState<EmotionalJournalEntry[]>([]);
  const [itemName, setItemName] = useState("");
  const [whyKeep, setWhyKeep] = useState("");
  const [sparkJoy, setSparkJoy] = useState(true);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<EmotionalJournalEntry[]>("/emotional-journal", { params: { limit: 50 } });
      setEntries(data || []);
    } catch (err: unknown) {
      const detail =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      showError(detail ?? t("failed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;
    try {
      const { data } = await api.post<EmotionalJournalEntry>("/emotional-journal", {
        item_name: itemName.trim(),
        why_keep: whyKeep.trim(),
        spark_joy: sparkJoy,
      });
      setEntries((prev) => [data, ...prev]);
      setItemName("");
      setWhyKeep("");
      setSparkJoy(true);
      showSuccess(t("saved"));
    } catch (err: unknown) {
      const detail =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      showError(detail ?? t("failed"));
    }
  };

  const removeEntry = async (id: number) => {
    try {
      await api.delete(`/emotional-journal/${id}`);
      setEntries((prev) => prev.filter((x) => x.id !== id));
    } catch (err: unknown) {
      const detail =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      showError(detail ?? t("failed"));
    }
  };

  return (
    <main className="pageContent" dir={rtl ? "rtl" : "ltr"} style={{ display: "grid", gap: 20 }}>
      <nav className="lifestyle-muted" style={{ fontSize: "0.9rem", display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Link to={ROUTES.CATEGORIES} className="wow-btn" style={{ padding: "4px 10px", fontSize: "0.85rem" }}>
          {t("breadcrumbCategories")}
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          to={getCategoryRoute("emotional")}
          className="wow-btn"
          style={{ padding: "4px 10px", fontSize: "0.85rem" }}
        >
          {t("breadcrumbEmotionalCategory")}
        </Link>
        <span aria-hidden="true">/</span>
        <span style={{ fontWeight: 600 }}>{t("breadcrumbJournal")}</span>
      </nav>

      <section className="lifestyle-card">
        <div className="lifestyle-title">{t("title")}</div>
        <div className="lifestyle-muted">{t("subtitle")}</div>
        <div className="lifestyle-muted" style={{ marginTop: 10, lineHeight: 1.5 }}>
          {t("categoryContextLine")}
        </div>
      </section>

      <section className="lifestyle-card">
        <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
          <label className="label">{t("itemLabel")}</label>
          <input
            className="input"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder={t("itemPlaceholder")}
          />
          <label className="label">{t("q1")}</label>
          <textarea
            className="input"
            value={whyKeep}
            onChange={(e) => setWhyKeep(e.target.value)}
            placeholder={t("q1Placeholder")}
          />
          <label className="label">{t("q2")}</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className={`wow-btn ${sparkJoy ? "wow-btnPrimary" : ""}`} onClick={() => setSparkJoy(true)}>
              {t("yes")}
            </button>
            <button type="button" className={`wow-btn ${!sparkJoy ? "wow-btnPrimary" : ""}`} onClick={() => setSparkJoy(false)}>
              {t("no")}
            </button>
          </div>
          <button type="submit" className="wow-btn wow-btnPrimary">
            {t("save")}
          </button>
        </form>
      </section>

      <section className="lifestyle-card">
        {loading ? (
          <div className="wow-skeleton" style={{ height: 80 }} />
        ) : entries.length === 0 ? (
          <p className="wow-muted">{t("empty")}</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {entries.map((entry) => (
              <article key={entry.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ fontWeight: 700 }}>{entry.item_name}</div>
                  <button type="button" className="wow-btn" onClick={() => removeEntry(entry.id)}>
                    {t("delete")}
                  </button>
                </div>
                <div className="wow-muted" style={{ marginTop: 6 }}>
                  {entry.why_keep || "-"}
                </div>
                <div style={{ marginTop: 6 }}>
                  <span className={`wow-chip ${entry.spark_joy ? "wow-chipAccent" : ""}`}>
                    {t("q2")}: {entry.spark_joy ? t("yes") : t("no")}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
