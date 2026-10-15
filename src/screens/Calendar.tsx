import { useEffect, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Download, Share2 } from "lucide-react";
import { ColorMatchBadge } from "../components/ColorMatchBadge";
import { CollageGrid } from "../components/CollageGrid";
import { Modal } from "../components/Modal";
import { colorById } from "../constants/palette";
import { dateFromKey, localDateKey } from "../domain/date";
import { exportCollage } from "../domain/image";
import { useApp } from "../state/AppContext";

export function Calendar() {
  const {
    days,
    images,
    settings,
    getImageBlob,
    ensureFullImages,
    todayKey,
    setSpacing,
  } = useApp();
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const year = month.getFullYear(),
    monthIndex = month.getMonth();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const weeks = Math.ceil((firstWeekday + daysInMonth) / 7);
  const cells = Array.from({ length: weeks * 7 }, (_, i) =>
    i < firstWeekday || i >= firstWeekday + daysInMonth
      ? null
      : i - firstWeekday + 1,
  );
  const selectedDay = days.find((day) => day.date === selected);
  useEffect(() => {
    if (selectedDay)
      void ensureFullImages(selectedDay.photos.map((photo) => photo.id));
  }, [selectedDay, ensureFullImages]);
  const selectedColor = colorById(selectedDay?.colorId);
  const changeMonth = (step: number) =>
    setMonth(new Date(year, monthIndex + step, 1));
  const makeBlob = async () => {
    if (!selectedDay?.completedAt) return;
    setBusy(true);
    try {
      return await exportCollage(
        selectedDay.count,
        selectedDay.photos,
        getImageBlob,
        selectedColor.hex,
        settings.exportLogo,
        selectedDay.spacing,
      );
    } finally {
      setBusy(false);
    }
  };
  const download = async () => {
    try {
      const blob = await makeBlob();
      if (!blob || !selectedDay) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `PicPa-${selectedDay.date}.jpg`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("画像を保存しました");
    } catch {
      setNotice("画像を書き出せませんでした");
    }
  };
  const share = async () => {
    try {
      const blob = await makeBlob();
      if (!blob || !selectedDay) return;
      const file = new File([blob], `PicPa-${selectedDay.date}.jpg`, {
        type: "image/jpeg",
      });
      if (navigator.share && navigator.canShare?.({ files: [file] }))
        await navigator.share({ files: [file], title: "PicPa" });
      else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setNotice("共有に対応していないため画像を保存しました");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError")
        setNotice("共有できませんでした");
    }
  };
  return (
    <main className="screen calendar-screen">
      <header className="app-header">
        <h1>PicPa</h1>
      </header>
      <section
        className="calendar-card"
        aria-label="月のカレンダー"
        style={{ "--calendar-weeks": weeks } as CSSProperties}
      >
        <div className="month-header">
          <button
            className="icon-button"
            onClick={() => changeMonth(-1)}
            aria-label="前の月"
          >
            <ChevronLeft size={22} />
          </button>
          <h3>
            {new Intl.DateTimeFormat("ja-JP", {
              year: "numeric",
              month: "long",
            }).format(month)}
          </h3>
          <button
            className="icon-button"
            onClick={() => changeMonth(1)}
            aria-label="次の月"
          >
            <ChevronRight size={22} />
          </button>
        </div>
        <div className="calendar-grid weekdays">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="calendar-grid dates">
          {cells.map((number, index) => {
            if (!number)
              return index < firstWeekday ? (
                <span key={`blank-${index}`} aria-hidden="true" />
              ) : (
                <span
                  key={`blank-${index}`}
                  className="date-cell"
                  aria-hidden="true"
                >
                  <span className="day-mark">
                    <span className="calendar-padding" />
                  </span>
                  <span className="day-number">&nbsp;</span>
                </span>
              );
            const key = localDateKey(new Date(year, monthIndex, number));
            const day = days.find((item) => item.date === key);
            const color = day?.colorId ? colorById(day.colorId) : undefined;
            return (
              <button
                key={key}
                className={`date-cell ${key === todayKey ? "today" : ""}`}
                onClick={() => {
                  setSelected(key);
                  setNotice("");
                }}
                aria-label={`${number}日${color ? `、${color.name}` : ""}${day?.completedAt ? "、完成済み" : ""}`}
              >
                <span className="day-mark">
                  {day?.completedAt ? (
                    <span className="calendar-photo">
                      <CollageGrid
                        count={day.count}
                        spacing={day.spacing}
                        photos={day.photos}
                        images={images}
                        locked
                        mini
                      />
                    </span>
                  ) : color ? (
                    <span
                      className="calendar-bubble"
                      style={{
                        backgroundColor: color.hex,
                        border: ["white", "black"].includes(color.id)
                          ? "1px solid var(--muted)"
                          : undefined,
                      }}
                    />
                  ) : (
                    <span className="calendar-empty" />
                  )}
                </span>
                <span className="day-number">{number}</span>
              </button>
            );
          })}
        </div>
      </section>
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={
          selected
            ? new Intl.DateTimeFormat("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }).format(dateFromKey(selected))
            : ""
        }
      >
        {selectedDay?.colorId ? (
          <>
            <div className="detail-color">
              <span
                className="detail-bubble"
                style={{
                  backgroundColor: selectedColor.hex,
                  border: ["white", "black"].includes(selectedColor.id)
                    ? "1px solid var(--muted)"
                    : undefined,
                }}
              />
              <div>
                <h3>{selectedColor.name}</h3>
              </div>
              <span className="detail-state">
                {selectedDay.completedAt ? "完成" : "制作中"}
              </span>
            </div>
            {selectedDay.completedAt && (
              <div
                className="spacing-selector detail-spacing"
                role="group"
                aria-label="写真の間隔"
              >
                {(["joined", "separated"] as const).map((spacing) => (
                  <button
                    key={spacing}
                    className={
                      (selectedDay.spacing ?? "separated") === spacing
                        ? "selected"
                        : ""
                    }
                    aria-pressed={
                      (selectedDay.spacing ?? "separated") === spacing
                    }
                    onClick={() => setSpacing(spacing, selectedDay.date)}
                  >
                    {spacing === "joined" ? "くっつける" : "離す"}
                  </button>
                ))}
              </div>
            )}
            <div className="detail-collage">
              <CollageGrid
                count={selectedDay.count}
                spacing={selectedDay.spacing}
                photos={selectedDay.photos}
                images={images}
                locked
              />
            </div>
            {selectedDay.completedAt && (
              <ColorMatchBadge day={selectedDay} showComment />
            )}
            {selectedDay.completedAt ? (
              <div className="detail-actions">
                <button
                  className="secondary-button"
                  disabled={busy}
                  onClick={() => void download()}
                >
                  <Download size={18} />
                  保存
                </button>
                <button
                  className="primary-button"
                  disabled={busy}
                  onClick={() => void share()}
                >
                  <Share2 size={18} />
                  共有
                </button>
              </div>
            ) : (
              <p className="modal-footnote">
                {selectedDay.photos.length} / {selectedDay.count}枚 ·
                完成するとここから保存・共有できます。
              </p>
            )}
            {notice && <p className="modal-footnote centered">{notice}</p>}
          </>
        ) : (
          <div className="empty-day">
            <span className="empty-day-bubble" />
            <p>この日はまだ色を引いていません</p>
          </div>
        )}
      </Modal>
    </main>
  );
}
