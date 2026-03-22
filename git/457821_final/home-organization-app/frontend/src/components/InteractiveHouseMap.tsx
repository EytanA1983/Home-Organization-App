import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { resolveAreaPath } from "../utils/routes";
import { getLocalizedRoomTitle } from "../utils/roomLocalization";
import { isRtlLang } from "../utils/localeDirection";

type RoomLike = {
  id: number | string;
  name: string;
};

type Props = {
  rooms: RoomLike[];
};

const SLOT_LAYOUT = [
  { x: 40, y: 40, w: 210, h: 140 },
  { x: 270, y: 40, w: 210, h: 140 },
  { x: 40, y: 190, w: 140, h: 170 },
  { x: 190, y: 190, w: 140, h: 170 },
  { x: 340, y: 190, w: 140, h: 170 },
  { x: 40, y: 370, w: 140, h: 130 },
  { x: 190, y: 370, w: 140, h: 130 },
  { x: 340, y: 370, w: 140, h: 130 },
];

const roomFill = (idx: number) => {
  const palette = ["#dbeafe", "#dcfce7", "#fce7f3", "#fef3c7", "#e9d5ff", "#cffafe", "#f5f5f4", "#fde68a"];
  return palette[idx % palette.length];
};

export default function InteractiveHouseMap({ rooms }: Props) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { t: tRooms } = useTranslation("rooms");
  const { t } = useTranslation("rooms");
  const rtl = isRtlLang(i18n.language);

  const roomSlots = useMemo(() => {
    return rooms.slice(0, SLOT_LAYOUT.length).map((room, idx) => ({
      room,
      slot: SLOT_LAYOUT[idx],
      fill: roomFill(idx),
    }));
  }, [rooms]);

  return (
    <section
      className="wow-card wow-pad"
      dir={rtl ? "rtl" : "ltr"}
      style={{ borderRadius: 20, overflow: "hidden", background: "rgba(255,255,255,0.72)" }}
    >
      <svg viewBox="0 0 520 540" width="100%" role="img" aria-label={t("hub.mapTitle")}>
        <rect x="10" y="10" width="500" height="520" rx="26" fill="#fffdf8" stroke="#d6cdbf" strokeWidth="2" />
        <text x="260" y="32" textAnchor="middle" fontSize="14" fill="#6b6358" fontWeight={700}>
          {t("hub.mapTapHint")}
        </text>

        {roomSlots.map(({ room, slot, fill }) => (
          <g
            key={`map-room-${room.id}`}
            onClick={() => navigate(resolveAreaPath({ id: Number(room.id), name: room.name }))}
            style={{ cursor: "pointer" }}
          >
            <rect
              x={slot.x}
              y={slot.y}
              width={slot.w}
              height={slot.h}
              rx="16"
              fill={fill}
              stroke="#9f9588"
              strokeWidth="1.5"
            />
            <text
              x={slot.x + slot.w / 2}
              y={slot.y + slot.h / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="16"
              fontWeight={700}
              fill="#3d352b"
            >
              {getLocalizedRoomTitle(room.name, tRooms, { roomId: room.id })}
            </text>
          </g>
        ))}
      </svg>
      {rooms.length > SLOT_LAYOUT.length && (
        <div className="wow-muted" style={{ marginTop: 8 }}>
          {t("hub.mapMoreRooms", { count: rooms.length - SLOT_LAYOUT.length })}
        </div>
      )}
    </section>
  );
}
