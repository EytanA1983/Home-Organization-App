import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Modal } from "./Modal";
import { getVisionBoard, putVisionBoard } from "../api.ts";
import type { VisionBoardRead, VisionBoardUpdate } from "../schemas/vision_board";
import { showError, showSuccess } from "../utils/toast";
import { isRtlLang } from "../utils/localeDirection";

type ApiLang = "he" | "en";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Backend stores copy per Hebrew/English; other UI languages map here. */
  apiLang: ApiLang;
};

function toDraft(data: VisionBoardRead) {
  return {
    vision_statement: data.vision_statement,
    intentions: [...data.intentions] as [string, string, string],
    image_url: data.image_url ?? "",
    quote: data.quote ?? "",
  };
}

export function VisionBoardModal({ isOpen, onClose, apiLang }: Props) {
  const queryClient = useQueryClient();
  const { i18n, t } = useTranslation("visionBoard");
  const isRtl = isRtlLang(i18n.language);

  const queryKey = useMemo(() => ["vision-board", apiLang] as const, [apiLang]);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey,
    queryFn: async () => (await getVisionBoard(apiLang)).data,
    enabled: isOpen,
    staleTime: 60_000,
  });

  const [draft, setDraft] = useState(() =>
    toDraft({
      vision_statement: "",
      intentions: ["", "", ""],
      image_url: null,
      quote: null,
    }),
  );

  useEffect(() => {
    if (!isOpen || !data) return;
    setDraft(toDraft(data));
  }, [isOpen, data]);

  const saveMutation = useMutation({
    mutationFn: async (body: VisionBoardUpdate) => (await putVisionBoard(body)).data,
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKey, saved);
      showSuccess(t("saved"));
    },
    onError: () => showError(t("saveError")),
  });

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid var(--border, #e5e7eb)",
    fontSize: 14,
    background: "#fff",
    boxSizing: "border-box",
  };

  const labelStyle: CSSProperties = {
    display: "block",
    fontWeight: 600,
    marginBottom: 6,
    fontSize: 13,
  };

  if (!isOpen) return null;

  return (
    <Modal title={t("title")} description={null} onClose={onClose}>
      <div dir={isRtl ? "rtl" : "ltr"} style={{ display: "grid", gap: 14 }}>
        <p className="wow-muted" style={{ margin: 0 }}>
          {t("hint")}
        </p>

        {isPending && !data ? (
          <p>{t("loading")}</p>
        ) : isError ? (
          <div style={{ display: "grid", gap: 8 }}>
            <p className="wow-muted">{t("loadError")}</p>
            <button type="button" className="wow-btn" onClick={() => void refetch()}>
              {t("retry")}
            </button>
          </div>
        ) : (
          <>
            {draft.image_url.trim() ? (
              <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--border, #e5e7eb)" }}>
                <img
                  src={draft.image_url.trim()}
                  alt=""
                  style={{ width: "100%", maxHeight: 180, objectFit: "cover", display: "block" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            ) : null}

            <div>
              <label style={labelStyle} htmlFor="vb-vision">
                {t("vision")}
              </label>
              <textarea
                id="vb-vision"
                rows={3}
                style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
                value={draft.vision_statement}
                onChange={(e) => setDraft((d) => ({ ...d, vision_statement: e.target.value }))}
                maxLength={4000}
              />
            </div>

            {[0, 1, 2].map((i) => (
              <div key={i}>
                <label style={labelStyle} htmlFor={`vb-int-${i}`}>
                  {t("intention", { n: i + 1 })}
                </label>
                <input
                  id={`vb-int-${i}`}
                  type="text"
                  style={inputStyle}
                  value={draft.intentions[i]}
                  onChange={(e) =>
                    setDraft((d) => {
                      const next: [string, string, string] = [...d.intentions];
                      next[i] = e.target.value;
                      return { ...d, intentions: next };
                    })
                  }
                  maxLength={500}
                />
              </div>
            ))}

            <div>
              <label style={labelStyle} htmlFor="vb-img">
                {t("imageUrl")}
              </label>
              <input
                id="vb-img"
                type="url"
                inputMode="url"
                placeholder="https://..."
                style={inputStyle}
                value={draft.image_url}
                onChange={(e) => setDraft((d) => ({ ...d, image_url: e.target.value }))}
                maxLength={2048}
              />
            </div>

            <div>
              <label style={labelStyle} htmlFor="vb-quote">
                {t("quote")}
              </label>
              <textarea
                id="vb-quote"
                rows={2}
                style={{ ...inputStyle, resize: "vertical", minHeight: 56 }}
                value={draft.quote}
                onChange={(e) => setDraft((d) => ({ ...d, quote: e.target.value }))}
                maxLength={2000}
              />
            </div>

            <div className="focusTimerActions" style={{ marginTop: 8 }}>
              <button
                type="button"
                className="wow-btn wow-btnPrimary"
                disabled={saveMutation.isPending}
                onClick={() => {
                  const body: VisionBoardUpdate = {
                    vision_statement: draft.vision_statement,
                    intentions: draft.intentions.slice(0, 3),
                    image_url: draft.image_url.trim() || null,
                    quote: draft.quote.trim() || null,
                  };
                  saveMutation.mutate(body);
                }}
              >
                {saveMutation.isPending ? t("saving") : t("save")}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
