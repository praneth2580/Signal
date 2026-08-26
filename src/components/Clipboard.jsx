import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { buildClipboardPages } from "../game/clipboard.js";

const SCRAP_TILTS = [-2.4, 1.6, -1.1, 2.2, -0.8, 1.4, -1.8];

export function Clipboard({
  gameCase,
  pinned,
  locked,
  open,
  initialPage = 0,
  onOpenChange,
  onOpenRecord,
  onUnpin,
}) {
  const pages = useMemo(
    () => buildClipboardPages(gameCase, pinned),
    [gameCase, pinned],
  );
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    const max = Math.max(0, pages.length - 1);
    const start = Math.min(Math.max(0, initialPage), max);
    setPageIndex(start);
  }, [open, initialPage, pages.length]);

  useEffect(() => {
    if (pages.length === 0 && open) onOpenChange(false);
  }, [pages.length, open, onOpenChange]);

  useEffect(() => {
    if (!open) return undefined;

    function onKey(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        setPageIndex((current) => Math.max(0, current - 1));
        return;
      }
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        setPageIndex((current) => Math.min(pages.length - 1, current + 1));
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pages.length, onOpenChange]);

  const page = pages[pageIndex] ?? null;
  const scraps = pages.slice(0, 3);

  function openAt(index) {
    onOpenChange(true, index);
  }

  return (
    <>
      <section className="clipboard-desk" aria-label="Evidence clipboard" data-coach="clipboard">
        <div className="clipboard-desk-head">
          <div>
            <h2>Clipboard</h2>
            <p>
              {pages.length === 0
                ? "Pin rows to clip evidence."
                : `${pages.length} clipped · open to flip pages`}
            </p>
          </div>
          <button
            type="button"
            className="clipboard-open-btn"
            disabled={pages.length === 0}
            onClick={() => openAt(0)}
          >
            {pages.length === 0 ? "Empty" : `Open · ${pages.length}`}
          </button>
        </div>

        <button
          type="button"
          className="clipboard-board"
          onClick={() => pages.length > 0 && openAt(Math.max(0, pages.length - 1))}
          disabled={pages.length === 0}
          aria-label={
            pages.length === 0
              ? "Clipboard empty"
              : `Open clipboard, ${pages.length} clipped`
          }
        >
          <span className="clipboard-clip" aria-hidden="true" />
          <span className="clipboard-face">
            {pages.length === 0 ? (
              <span className="clipboard-empty-hand">nothing clipped yet</span>
            ) : (
              scraps.map((scrap, index) => (
                <span
                  key={scrap.id}
                  className="clipboard-scrap"
                  style={{
                    "--tilt": `${SCRAP_TILTS[index % SCRAP_TILTS.length]}deg`,
                    "--stack": String(index),
                  }}
                >
                  <span className="clipboard-scrap-hand">{scrap.scribble}</span>
                  <span className="clipboard-scrap-id">{scrap.id}</span>
                </span>
              ))
            )}
            {pages.length > 3 ? (
              <span className="clipboard-more">+{pages.length - 3} more</span>
            ) : null}
          </span>
        </button>
      </section>

      {open && page
        ? createPortal(
            <div
              className="clipboard-overlay"
              role="dialog"
              aria-modal="true"
              aria-label="Clipboard pages"
            >
              <button
                type="button"
                className="clipboard-backdrop"
                aria-label="Close clipboard"
                onClick={() => onOpenChange(false)}
              />
              <div className="clipboard-viewer">
                <div className="clipboard-viewer-clip" aria-hidden="true" />
                <div className="clipboard-page" key={page.id}>
                  <header className="clipboard-page-head">
                    <p className="eyebrow">clipped · {page.attachment}</p>
                    <p className="clipboard-page-count">
                      {pageIndex + 1} / {pages.length}
                    </p>
                  </header>
                  <p className="clipboard-page-id">{page.id}</p>
                  <h3 className="clipboard-page-hand">{page.scribble}</h3>
                  <pre className="clipboard-page-excerpt">{page.excerpt}</pre>
                  <div className="clipboard-page-stub" aria-hidden="true">
                    <span>{page.attachment}</span>
                    <em>{page.title}</em>
                  </div>
                </div>

                <div className="clipboard-viewer-actions">
                  <button
                    type="button"
                    disabled={pageIndex <= 0}
                    onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    disabled={pageIndex >= pages.length - 1}
                    onClick={() =>
                      setPageIndex((current) => Math.min(pages.length - 1, current + 1))
                    }
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    className="clipboard-primary"
                    disabled={!page.kind}
                    onClick={() => {
                      if (!page.kind) return;
                      onOpenChange(false);
                      onOpenRecord(page.kind, page.id);
                    }}
                  >
                    Open record
                  </button>
                  {!locked ? (
                    <button
                      type="button"
                      className="clipboard-warn"
                      onClick={() => {
                        const nextLen = pages.length - 1;
                        onUnpin(page.id);
                        if (nextLen <= 0) onOpenChange(false);
                        else setPageIndex((current) => Math.min(current, nextLen - 1));
                      }}
                    >
                      Unpin
                    </button>
                  ) : null}
                  <button type="button" onClick={() => onOpenChange(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
