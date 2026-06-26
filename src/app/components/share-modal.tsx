import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Share2, Copy, Check, Trash2, Calendar, Link, X, ExternalLink, ShieldCheck, Clock } from 'lucide-react';
import { ModalBackdrop } from './ui/modal-backdrop';
import {
  fetchShareLinks,
  generateShareLink,
  toggleShareLinkStatus,
  deleteShareLink,
} from '../actions';
import type { DbSharedLink } from '../types/database';

type ShareLink = DbSharedLink;

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [label, setLabel] = useState('');
  const [enableExpiry, setEnableExpiry] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load existing links
  const loadLinks = async () => {
    try {
      setFetching(true);
      const data = await fetchShareLinks();
      setLinks(data as ShareLink[]);
    } catch (err) {
      console.error('Failed to fetch share links:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLinks();
    }
  }, [isOpen]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    try {
      setLoading(true);
      // If 1-month expiration is checked, set expiryDays to 30. Otherwise undefined.
      const expiryDays = enableExpiry ? 30 : undefined;
      await generateShareLink(label, expiryDays);
      setLabel('');
      await loadLinks();
    } catch (err) {
      console.error('Failed to generate share link:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      // Optimistic UI update
      setLinks((prev) =>
        prev.map((l) => (l.id === id ? { ...l, active: !currentStatus } : l))
      );
      await toggleShareLinkStatus(id, !currentStatus);
    } catch (err) {
      console.error('Failed to toggle share link:', err);
      loadLinks(); // Rollback
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      setLinks((prev) => prev.filter((l) => l.id !== id));
      await deleteShareLink(id);
    } catch (err) {
      console.error('Failed to revoke share link:', err);
      loadLinks(); // Rollback
    }
  };

  const handleCopy = (id: string, token: string) => {
    const shareUrl = `${window.location.origin}/shared/${token}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose} className="overflow-y-auto w-full flex items-center justify-center">
            <motion.div
              className="modal-panel max-w-2xl w-full overflow-hidden backdrop-blur-xl"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <Share2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Share Growth Path</h3>
                    <p className="text-xs text-gray-400">Generate secure read-only links for team co-viewing</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-gray-400 hover:text-white transition-all border border-slate-700/30"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                
                {/* 1. Generate Link Form */}
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-200">Create a New Share Link</h4>
                  <form onSubmit={handleGenerate} className="space-y-4">
                    <div>
                      <label htmlFor="link-label" className="block text-xs font-medium text-gray-400 mb-1.5">
                        Link Name / Label
                      </label>
                      <input
                        type="text"
                        id="link-label"
                        placeholder="E.g., Q3 Review with Javier"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-200">Auto-Expiration</span>
                        <span className="text-[10px] text-gray-500">Automatically deactivate this link after 1 month for security</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableExpiry}
                          onChange={(e) => setEnableExpiry(e.target.checked)}
                          className="sr-only peer"
                          disabled={loading}
                        />
                        <div className="w-9 h-5 bg-slate-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:bg-white peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500"></div>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !label.trim()}
                      className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-850 disabled:to-slate-850 text-white rounded-lg transition-all duration-300 font-medium text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-cyan-500/10 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Generate Secure URL</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* 2. Existing Share Links list */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-200">Active Sharing Channels</h4>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                      {links.length} total
                    </span>
                  </div>

                  {fetching && links.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3 text-slate-500">
                      <div className="w-6 h-6 border-2 border-slate-650 border-t-cyan-500 rounded-full animate-spin" />
                      <span className="text-xs">Fetching active share links...</span>
                    </div>
                  ) : links.length === 0 ? (
                    <div className="text-center py-10 bg-slate-950/20 border border-dashed border-slate-800/80 rounded-xl">
                      <Link className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No active co-viewing links generated yet.</p>
                      <p className="text-xs text-gray-600 mt-1">Name and create a link above to share your progress.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {links.map((link) => {
                        const expired = isExpired(link.expires_at);
                        const active = link.active && !expired;

                        return (
                          <div
                            key={link.id}
                            className={`p-4 rounded-xl border transition-all ${
                              active
                                ? 'bg-slate-950/30 border-slate-800/80 hover:border-slate-750'
                                : 'bg-slate-950/10 border-slate-850 opacity-60'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4 mb-2.5">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-white">{link.label}</span>
                                  {active ? (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                                      Active
                                    </span>
                                  ) : expired ? (
                                    <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-medium border border-rose-500/20">
                                      Expired
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-gray-400 text-[10px] font-medium border border-slate-700/50">
                                      Inactive
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    Created {new Date(link.created_at).toLocaleDateString()}
                                  </span>
                                  {link.expires_at && (
                                    <span className={`flex items-center gap-1 ${expired ? 'text-rose-400' : ''}`}>
                                      <Calendar className="w-3.5 h-3.5" />
                                      {expired ? 'Expired on' : 'Expires on'} {new Date(link.expires_at).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Toggle active / inactive switch */}
                              {!expired && (
                                <button
                                  onClick={() => handleToggleActive(link.id, link.active)}
                                  className="text-xs text-gray-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-650 px-2.5 py-1 rounded transition-all cursor-pointer"
                                  title={link.active ? 'Pause link access' : 'Resume link access'}
                                >
                                  {link.active ? 'Pause' : 'Activate'}
                                </button>
                              )}
                            </div>

                            {/* Link action toolbar */}
                            <div className="flex items-center justify-between border-t border-slate-800/60 pt-3 mt-1.5 gap-4">
                              <span className="font-mono text-[10px] text-gray-600 truncate max-w-[280px]">
                                token: {link.token.slice(0, 8)}...{link.token.slice(-8)}
                              </span>

                              <div className="flex items-center gap-2">
                                {/* Open Public Link */}
                                {active && (
                                  <a
                                    href={`/shared/${link.token}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white transition-all border border-slate-700 flex items-center justify-center"
                                    title="Open manager co-viewing page"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}

                                {/* Copy Button */}
                                <button
                                  onClick={() => handleCopy(link.id, link.token)}
                                  disabled={!active}
                                  className={`px-3 py-1.5 rounded text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                                    copiedId === link.id
                                      ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400'
                                      : active
                                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-gray-300 hover:text-white'
                                      : 'bg-slate-850 border-slate-800 text-gray-600 cursor-not-allowed'
                                  }`}
                                  title="Copy co-viewing URL"
                                >
                                  {copiedId === link.id ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Copy Link</span>
                                    </>
                                  )}
                                </button>

                                {/* Revoke / Delete Button */}
                                <button
                                  onClick={() => handleRevoke(link.id)}
                                  className="p-1.5 rounded bg-slate-800 hover:bg-rose-900/30 border border-slate-700 hover:border-rose-500/20 text-gray-500 hover:text-rose-400 transition-all cursor-pointer"
                                  title="Revoke and delete this link permanently"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
    </ModalBackdrop>
  );
}
