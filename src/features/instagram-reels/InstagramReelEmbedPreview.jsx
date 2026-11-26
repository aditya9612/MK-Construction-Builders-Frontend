import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  Film,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import {
  extractInstagramShortcode,
  parseAndNormalizeInstagramUrl,
} from '../../services/api/instagramReelsService';

/**
 * Official Instagram embed preview using the backend-provided embed_url
 * with timeout detection, manual switch, and clean fallback card.
 */
export function InstagramReelEmbedPreview({
  embedUrl,
  instagramUrl,
  title,
  description,
  compact = false,
}) {
  const parsed = useMemo(() => {
    if (instagramUrl) {
      return parseAndNormalizeInstagramUrl(instagramUrl);
    }
    return { valid: false };
  }, [instagramUrl]);

  const resolvedEmbedUrl = embedUrl || (parsed.valid ? parsed.embedUrl : '');
  const resolvedInstagramUrl = (parsed.valid ? parsed.canonicalUrl : instagramUrl) || '';
  const shortcode = parsed.valid
    ? parsed.shortcode
    : extractInstagramShortcode(resolvedInstagramUrl);

  const [mode, setMode] = useState(resolvedEmbedUrl ? 'embed' : 'fallback');
  const [loading, setLoading] = useState(Boolean(resolvedEmbedUrl));
  const [timedOut, setTimedOut] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    if (!resolvedEmbedUrl) {
      setMode('fallback');
      setLoading(false);
      setTimedOut(false);
      return;
    }
    setMode('embed');
    setLoading(true);
    setTimedOut(false);
  }, [resolvedEmbedUrl]);

  useEffect(() => {
    if (mode !== 'embed' || !loading || !resolvedEmbedUrl) return undefined;
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [mode, loading, resolvedEmbedUrl, iframeKey]);

  const handleRetryEmbed = () => {
    if (!resolvedEmbedUrl) return;
    setMode('embed');
    setLoading(true);
    setTimedOut(false);
    setIframeKey((prev) => prev + 1);
  };

  if (!resolvedEmbedUrl && !resolvedInstagramUrl) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-12 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-xs">
          <Film className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-slate-700">No Instagram URL provided</p>
        <p className="mt-1 max-w-xs text-xs text-slate-500">
          Enter a valid <code className="rounded bg-slate-200/70 px-1 py-0.5">/reel/</code> or{' '}
          <code className="rounded bg-slate-200/70 px-1 py-0.5">/p/</code> Instagram link to load the official embed preview.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      {/* Preview Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-3.5 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white">
            <Film className="h-3.5 w-3.5" />
          </span>
          <span className="truncate text-xs font-semibold text-slate-700">
            {mode === 'embed' ? 'Official Instagram Embed' : 'Fallback Preview Card'}
          </span>
          {shortcode ? (
            <span className="hidden sm:inline-flex rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-600">
              {shortcode}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5">
          {resolvedEmbedUrl ? (
            <button
              type="button"
              onClick={() => {
                if (mode === 'embed') {
                  setMode('fallback');
                  setLoading(false);
                } else {
                  handleRetryEmbed();
                }
              }}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {mode === 'embed' ? 'Fallback View' : 'Try Live Embed'}
            </button>
          ) : null}

          {resolvedInstagramUrl ? (
            <a
              href={resolvedInstagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-brand transition hover:bg-brand-pale"
            >
              <span>Open</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>
      </div>

      {/* Embed Frame or Fallback */}
      {mode === 'embed' && resolvedEmbedUrl ? (
        <div className="relative bg-slate-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
              <p className="text-xs font-medium text-slate-500">
                Loading official Instagram embed...
              </p>
            </div>
          ) : null}

          {timedOut && loading ? (
            <div className="mx-3 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>Instagram embed is taking longer than expected or may be blocked.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode('fallback');
                  setLoading(false);
                }}
                className="font-semibold text-amber-900 underline hover:no-underline"
              >
                Use Fallback Card
              </button>
            </div>
          ) : null}

          <div
            className={`mx-auto w-full ${
              compact ? 'max-w-[320px] h-[380px]' : 'max-w-[360px] h-[460px]'
            } ${loading ? 'h-0 overflow-hidden opacity-0' : 'opacity-100 transition-opacity duration-200'}`}
          >
            <iframe
              key={`${resolvedEmbedUrl}-${iframeKey}`}
              src={resolvedEmbedUrl}
              title={title || 'Instagram Reel Embed'}
              className="h-full w-full border-0 bg-white"
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={() => {
                setLoading(false);
                setTimedOut(false);
              }}
              onError={() => {
                setLoading(false);
                setMode('fallback');
              }}
            />
          </div>

          {!loading ? (
            <div className="flex items-center justify-between border-t border-slate-100 bg-white px-3.5 py-2 text-[11px] text-slate-500">
              <span>Preview blank or restricted?</span>
              <button
                type="button"
                onClick={() => setMode('fallback')}
                className="font-semibold text-brand hover:underline"
              >
                Show fallback card
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="p-5 text-center space-y-3 bg-gradient-to-b from-slate-50/70 to-white">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-sm">
            <Film className="h-6 w-6" />
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">
              {title || 'Instagram Reel'}
            </h4>
            {description ? (
              <p className="mx-auto max-w-sm line-clamp-3 text-xs text-slate-600">
                {description}
              </p>
            ) : null}
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-[11px] text-slate-600">
            <p className="font-semibold text-slate-700">Fallback Preview Mode</p>
            <p className="mt-0.5">
              Instagram embeds can be unavailable when a reel is private, deleted, or blocked by browser tracking protection.
            </p>
            {resolvedInstagramUrl ? (
              <p className="mt-1.5 truncate font-mono text-[10px] text-slate-500">
                {resolvedInstagramUrl}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {resolvedInstagramUrl ? (
              <a
                href={resolvedInstagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-xs font-semibold text-white transition hover:bg-brand-hover"
              >
                <span>Open on Instagram</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}

            {resolvedEmbedUrl ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRetryEmbed}
                className="inline-flex items-center gap-1.5 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Retry Embed</span>
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default InstagramReelEmbedPreview;
