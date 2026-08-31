"use client";

import { useState } from "react";
import { User, Award, MessageSquare, Flame, Calendar, LogOut, CheckCircle } from "lucide-react";

export interface RedditUser {
  id: number;
  reddit_id: string;
  username: string;
  icon_img: string | null;
  total_karma: number;
  link_karma: number;
  comment_karma: number;
  reddit_created_utc: number | null;
  connected_at: string | null;
}

interface UserProfileProps {
  user: RedditUser;
  onLogout: () => Promise<void>;
}

export default function UserProfile({ user, onLogout }: UserProfileProps) {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setLoggingOut(false);
    }
  };

  const formattedJoinDate = user.reddit_created_utc
    ? new Date(user.reddit_created_utc * 1000).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Unknown";

  return (
    <div className="w-full max-w-lg bg-[#1a1a1b] border border-[#343536] rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff4500]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header with Avatar & Username */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          {user.icon_img ? (
            <img
              src={user.icon_img}
              alt={user.username}
              className="w-16 h-16 rounded-full border-2 border-[#ff4500] object-cover bg-[#272729]"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#ff4500]/20 border-2 border-[#ff4500] flex items-center justify-center text-[#ff4500]">
              <User className="w-8 h-8" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                u/{user.username}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-700/40">
                <CheckCircle className="w-3 h-3" />
                Connected
              </span>
            </div>
            <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Reddit Member since {formattedJoinDate}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg bg-[#272729] hover:bg-red-950/40 border border-[#343536] disabled:opacity-50"
          title="Disconnect Reddit Account"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{loggingOut ? "Disconnecting..." : "Disconnect"}</span>
        </button>
      </div>

      {/* Karma Metrics Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#272729]/80 border border-[#343536]/60 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[#ff4500] mb-1">
            <Flame className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Total</span>
          </div>
          <div className="text-lg font-extrabold text-white">
            {user.total_karma.toLocaleString()}
          </div>
          <div className="text-[10px] text-neutral-400">Karma</div>
        </div>

        <div className="bg-[#272729]/80 border border-[#343536]/60 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
            <Award className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Post</span>
          </div>
          <div className="text-lg font-extrabold text-white">
            {user.link_karma.toLocaleString()}
          </div>
          <div className="text-[10px] text-neutral-400">Karma</div>
        </div>

        <div className="bg-[#272729]/80 border border-[#343536]/60 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Comment</span>
          </div>
          <div className="text-lg font-extrabold text-white">
            {user.comment_karma.toLocaleString()}
          </div>
          <div className="text-[10px] text-neutral-400">Karma</div>
        </div>
      </div>

      {/* Account Status Info */}
      <div className="text-xs bg-[#111213] border border-[#2d2e30] rounded-xl p-3.5 text-neutral-300">
        <div className="flex items-center justify-between text-neutral-400 mb-1.5">
          <span>Reddit Account ID:</span>
          <span className="font-mono text-neutral-200">{user.reddit_id}</span>
        </div>
        <div className="flex items-center justify-between text-neutral-400">
          <span>Connected Since:</span>
          <span className="text-neutral-200">
            {user.connected_at ? new Date(user.connected_at).toLocaleString() : "Just now"}
          </span>
        </div>
      </div>
    </div>
  );
}
