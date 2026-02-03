import React, { useEffect, useState, useMemo, useCallback, memo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Progress } from "@/components/ui/progress.jsx";
import {
  Loader2,
  Mail,
  ExternalLink,
  BarChart3,
  Users,
  Briefcase,
  Building2,
  UserX,
  Layers,
} from "lucide-react";
import { getEdgeFunctionUrl } from "@/utils/supabase.js";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useUser } from "@clerk/clerk-react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Label } from "@/components/ui/label.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Input } from "@/components/ui/input.jsx";
import { classInput, classLabel } from "@/constants/classnames.js";
import BackButton from "@/components/back-button.jsx";

// CPG Hub palette
const CPG_TEAL = "#00A19A";
const DETAIL_ROUTE_PREFIX = "/users";

// If you want to always hit prod API in dev, set VITE_API_BASE in .env.local
const API_BASE = import.meta.env.VITE_API_BASE || "";

// Icon mapping for stat cards
const STAT_ICONS = {
  "Total People": Users,
  "Any Talent": Briefcase,
  "Any Service": Building2,
  "Any Brand": Building2,
  "No Roles": UserX,
  "Talent Only": Briefcase,
  "Service Only": Building2,
  "Brand Only": Building2,
  "None": UserX,
  "Talent + Service": Layers,
  "Talent + Brand": Layers,
  "Brand + Service": Layers,
  "All Three": Layers,
};

const StatClickable = memo(function StatClickable({ label, value, onClick }) {
  const Icon = STAT_ICONS[label] || Users;

  return (
    <div
      className="bg-white border-2 border-gray-100 rounded-2xl p-4 sm:p-5 cursor-pointer hover:border-cpg-teal/30 hover:shadow-md transition-all select-none active:scale-[0.99]"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick?.()}
      aria-label={`${label}: ${value}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            {value}
          </p>
        </div>
        <div className="bg-cpg-teal/10 rounded-xl p-2 sm:p-2.5">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-cpg-teal" />
        </div>
      </div>
    </div>
  );
});

const Stat = memo(function Stat({ label, value, icon: Icon = Users }) {
  return (
    <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            {value}
          </p>
        </div>
        <div className="bg-cpg-teal/10 rounded-xl p-2 sm:p-2.5">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-cpg-teal" />
        </div>
      </div>
    </div>
  );
});

function useRoleList() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(null); // null = unknown yet
  const [offset, setOffset] = useState(0);
  const [bucket, setBucket] = useState(null);
  const [q, setQ] = useState("");
  const [progress, setProgress] = useState(null); // null = indeterminate

  // keep a ref to AbortController so we can cancel previous loads
  const controllerRef = React.useRef(null);

  function reset() {
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = null;
    setRows([]);
    setTotal(null);
    setOffset(0);
    setBucket(null);
    setQ("");
    setProgress(null);
  }

  async function load(b, nextOffset = 0, query = q) {
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    if (nextOffset === 0) {
      setProgress(null);
      setTotal(null);
      setRows([]);
      setOffset(0);
    }

    try {
      const params = new URLSearchParams({
        bucket: b,
        limit: "50",
        offset: String(nextOffset),
      });
      if (query) params.set("q", query);

      const res = await fetch(
        `${API_BASE}/api/analytics/roles?${params.toString()}`,
        {
          signal: controller.signal,
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Roles list ${res.status}: ${text.slice(0, 200)}`);
      }
      const json = await res.json();

      setBucket(b);
      if (total === null) setTotal(json.total ?? 0);

      setRows(
        nextOffset === 0 ? json.users : (prev) => [...prev, ...json.users]
      );
      const newOffset = json.offset + json.count;
      setOffset(newOffset);

      if (json.total && json.total > 0) {
        const pct = Math.min(100, Math.round((newOffset / json.total) * 100));
        setProgress(pct);
      } else {
        setProgress(null);
      }
    } catch (e) {
      if (e?.name !== "AbortError") {
        console.error(e);
        throw e;
      }
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    rows,
    total,
    offset,
    bucket,
    q,
    setQ,
    load,
    reset,
    progress,
  };
}

// Newsletter Dialog Component
const NewsletterDialog = memo(function NewsletterDialog({ open, onOpenChange }) {
  const { user } = useUser();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [allEmails, setAllEmails] = useState([]);

  // Load all user emails when dialog opens
  useEffect(() => {
    if (open) {
      loadAllEmails();
    }
  }, [open]);

  async function loadAllEmails() {
    setLoadingEmails(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/analytics/roles?bucket=total&limit=1000`
      );
      if (!res.ok) throw new Error("Failed to load users");
      const json = await res.json();

      // Extract emails, filter out empty ones
      const emails = json.users
        .map((u) => u.email)
        .filter((e) => e && e.includes("@"));

      setAllEmails(emails);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load user emails");
    } finally {
      setLoadingEmails(false);
    }
  }

  function handleMailto() {
    if (allEmails.length === 0) {
      toast.error("No user emails available");
      return;
    }

    // Create mailto link with BCC
    const bccEmails = allEmails.join(",");
    const mailtoLink = `mailto:?bcc=${encodeURIComponent(bccEmails)}${subject ? `&subject=${encodeURIComponent(subject)}` : ""}${message ? `&body=${encodeURIComponent(message)}` : ""}`;

    // Check if URL might be too long
    if (mailtoLink.length > 2000) {
      toast.error(
        "Too many emails for mailto link. Please use the Send option instead or export the email list."
      );
      return;
    }

    window.location.href = mailtoLink;
    toast.success("Opening your email client...");
  }

  async function handleSend() {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill out subject and message");
      return;
    }

    if (allEmails.length === 0) {
      toast.error("No users to send to");
      return;
    }

    setSending(true);

    try {
      const res = await fetch(
        getEdgeFunctionUrl("send-blast-email"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from: user?.primaryEmailAddress?.emailAddress || "",
            subject,
            message,
            recipients: allEmails,
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("Blast email failed:", text);
        throw new Error("Failed to send blast email");
      }

      toast.success(`Newsletter sent to ${allEmails.length} users!`);
      setSubject("");
      setMessage("");
      onOpenChange(false);
    } catch (err) {
      toast.error("Could not send newsletter. Please try mailto option.");
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  function copyEmailList() {
    if (allEmails.length === 0) {
      toast.error("No emails to copy");
      return;
    }
    navigator.clipboard.writeText(allEmails.join(", "));
    toast.success(`Copied ${allEmails.length} email addresses to clipboard`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="bg-cpg-teal/10 rounded-lg p-2">
              <Mail className="h-5 w-5 text-cpg-teal" />
            </div>
            Send Newsletter
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {loadingEmails ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-cpg-teal" />
              <span className="ml-3 text-sm text-muted-foreground">
                Loading user emails...
              </span>
            </div>
          ) : (
            <>
              {/* Recipients count */}
              <div className="flex items-center justify-between text-sm bg-cpg-teal/5 border-2 border-cpg-teal/20 p-4 rounded-xl">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-cpg-teal" />
                  <span className="text-gray-700">
                    <strong className="text-cpg-teal">{allEmails.length}</strong> users will receive this newsletter
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyEmailList}
                  className="h-8 text-cpg-teal hover:bg-cpg-teal/10 rounded-lg"
                >
                  Copy Emails
                </Button>
              </div>

              {/* Subject field */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Subject</Label>
                <Input
                  className="border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-cpg-teal/50"
                  type="text"
                  placeholder="Newsletter subject..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={sending}
                />
              </div>

              {/* Message field */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Message</Label>
                <Textarea
                  placeholder="Your newsletter message..."
                  rows={8}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={sending}
                  className="resize-y border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-cpg-teal/50"
                />
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  variant="default"
                  onClick={handleSend}
                  disabled={sending || !subject.trim() || !message.trim()}
                  className="flex-1 bg-cpg-brown hover:bg-cpg-brown/90 rounded-xl h-12"
                  size="lg"
                >
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send via Platform
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleMailto}
                  variant="outline"
                  disabled={sending || loadingEmails}
                  className="flex-1 rounded-xl h-12 border-2"
                  size="lg"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in Email Client
                </Button>
              </div>

              {/* Help text */}
              <p className="text-xs text-muted-foreground text-center bg-gray-50 p-3 rounded-xl">
                <strong>Send via Platform</strong> sends through your backend service.
                <br />
                <strong>Open in Email Client</strong> opens your default email app with all users in BCC.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default function RolesDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const list = useRoleList();
  const { isSignedIn } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/analytics/roles`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Roles ${res.status}: ${text.slice(0, 200)}`);
        }
        const json = await res.json();
        setData(json);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Memoize openList callback
  const openList = useCallback((bucket, niceTitle) => {
    setTitle(niceTitle);
    setOpen(true);
    list.reset();
    list.load(bucket, 0).catch(() => {});
  }, [list]);

  // Memoize chart data
  const chartData = useMemo(() => {
    if (!data) return [];
    const { singles, combos } = data;
    return [
      { key: "Talent Only", count: singles.talentOnly },
      { key: "Service Only", count: singles.serviceOnly },
      { key: "Brand Only", count: singles.brandOnly },
      { key: "Talent + Service", count: combos.talentService },
      { key: "Talent + Brand", count: combos.talentBrand },
      { key: "Brand + Service", count: combos.brandService },
      { key: "All Three", count: combos.allThree },
      { key: "None", count: singles.none },
    ];
  }, [data]);

  if (loading) {
    return (
      <main className="py-8 sm:py-10">
        <section className="w-11/12 sm:w-5/6 max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 sm:h-28 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
          <Skeleton className="h-72 rounded-2xl" />
        </section>
      </main>
    );
  }

  if (err) {
    return (
      <main className="py-8 sm:py-10">
        <section className="w-11/12 sm:w-5/6 max-w-6xl mx-auto">
          <BackButton />
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mt-6">
            <h1 className="text-xl font-semibold text-red-600 mb-2">Error Loading Analytics</h1>
            <p className="text-sm text-red-600/80">{err}</p>
          </div>
        </section>
      </main>
    );
  }

  const { total, singles, combos, any } = data;

  return (
    <main className="py-8 sm:py-10">
      {/* Back Button */}
      <section className="w-11/12 sm:w-5/6 max-w-6xl mx-auto mb-6">
        <BackButton />
      </section>

      {/* Header Section */}
      <section className="w-11/12 sm:w-5/6 max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="bg-cpg-teal/10 rounded-xl p-3">
            <BarChart3 className="h-6 w-6 text-cpg-teal" />
          </div>
        </div>
        <h1 className="gradient-title font-extrabold text-3xl sm:text-4xl text-center">
          User Analytics
        </h1>
        <p className="text-center text-muted-foreground mt-3 max-w-lg mx-auto">
          Overview of user roles and platform engagement
        </p>

        {/* Newsletter Button */}
        <div className="flex justify-center mt-6">
          <Button
            variant="default"
            onClick={() => setNewsletterOpen(true)}
            className="bg-cpg-brown hover:bg-cpg-brown/90 rounded-xl px-6"
            size="lg"
          >
            <Mail className="mr-2 h-4 w-4" />
            Send Newsletter
          </Button>
        </div>
      </section>

      {/* Quick Stats - Totals */}
      <section className="w-11/12 sm:w-5/6 max-w-6xl mx-auto mb-6">
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-cpg-teal" />
            Quick Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <StatClickable
              label="Total People"
              value={total}
              onClick={() => openList("total", "Total People")}
            />
            <StatClickable
              label="Any Talent"
              value={any.anyTalent}
              onClick={() => openList("anyTalent", "Any Talent")}
            />
            <StatClickable
              label="Any Service"
              value={any.anyService}
              onClick={() => openList("anyService", "Any Service")}
            />
            <StatClickable
              label="Any Brand"
              value={any.anyBrand}
              onClick={() => openList("anyBrand", "Any Brand")}
            />
            <StatClickable
              label="No Roles"
              value={singles.none}
              onClick={() => openList("none", "No Roles")}
            />
          </div>
        </div>
      </section>

      {/* Singles & Combos */}
      <section className="w-11/12 sm:w-5/6 max-w-6xl mx-auto mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Singles Card */}
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-cpg-teal" />
              Single Roles
              <span className="text-sm font-normal text-muted-foreground">(tap to view)</span>
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <StatClickable
                label="Talent Only"
                value={singles.talentOnly}
                onClick={() => openList("talentOnly", "Talent Only")}
              />
              <StatClickable
                label="Service Only"
                value={singles.serviceOnly}
                onClick={() => openList("serviceOnly", "Service Only")}
              />
              <StatClickable
                label="Brand Only"
                value={singles.brandOnly}
                onClick={() => openList("brandOnly", "Brand Only")}
              />
              <StatClickable
                label="None"
                value={singles.none}
                onClick={() => openList("none", "No Roles")}
              />
            </div>
          </div>

          {/* Combos Card */}
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-cpg-teal" />
              Role Combinations
              <span className="text-sm font-normal text-muted-foreground">(tap to view)</span>
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <StatClickable
                label="Talent + Service"
                value={combos.talentService}
                onClick={() => openList("talentService", "Talent + Service")}
              />
              <StatClickable
                label="Talent + Brand"
                value={combos.talentBrand}
                onClick={() => openList("talentBrand", "Talent + Brand")}
              />
              <StatClickable
                label="Brand + Service"
                value={combos.brandService}
                onClick={() => openList("brandService", "Brand + Service")}
              />
              <StatClickable
                label="All Three"
                value={combos.allThree}
                onClick={() => openList("allThree", "All Three")}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Distribution Chart */}
      <section className="w-11/12 sm:w-5/6 max-w-6xl mx-auto mb-6">
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-cpg-teal" />
              Role Distribution
            </h2>
            <Badge variant="secondary" className="bg-cpg-teal/10 text-cpg-teal text-xs">
              {chartData.reduce((sum, d) => sum + d.count, 0)} total
            </Badge>
          </div>
          {/* Horizontal scroll on small screens to prevent cramped labels */}
          <div className="h-72 sm:h-96 overflow-x-auto">
            <div className="min-w-[640px] h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ left: 0, right: 16, bottom: 16, top: 8 }}
                  barCategoryGap="20%"
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00A19A" stopOpacity={1} />
                      <stop offset="100%" stopColor="#00A19A" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="key"
                    tick={{ fontSize: 11, fill: "#6b7280", fontWeight: 500 }}
                    angle={-25}
                    textAnchor="end"
                    height={70}
                    interval={0}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0, 161, 154, 0.05)" }}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "2px solid #e5e7eb",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                      padding: "12px 16px",
                    }}
                    labelStyle={{
                      fontWeight: 600,
                      color: "#111827",
                      marginBottom: "4px",
                      fontSize: "14px"
                    }}
                    formatter={(value) => [
                      <span key="value" style={{ color: "#00A19A", fontWeight: 600, fontSize: "16px" }}>
                        {value} users
                      </span>,
                      null
                    ]}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#barGradient)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Dialog */}
      <NewsletterDialog
        open={newsletterOpen}
        onOpenChange={setNewsletterOpen}
      />

      {/* User List Dialog */}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) list.reset();
        }}
      >
        <DialogContent className="sm:max-w-2xl w-[95vw] sm:w-auto p-0 max-h-[90vh] sm:max-h-[90vh] flex flex-col overflow-y-auto rounded-2xl">
          {/* Sticky header */}
          <DialogHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b">
            <div className="px-4 py-4 sm:px-6 sm:py-5">
              <DialogTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-cpg-teal" />
                {title}
                {typeof list.total === "number" && (
                  <Badge variant="secondary" className="ml-2 bg-cpg-teal/10 text-cpg-teal">
                    {list.total} users
                  </Badge>
                )}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="px-4 py-4 sm:px-6 sm:py-5 flex flex-col gap-4 min-h-0">
            {/* Progress bar */}
            <div>
              {list.progress === null ? (
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full w-1/3 animate-[indeterminate_1.2s_ease_infinite] rounded-full bg-cpg-teal/50" />
                </div>
              ) : (
                <Progress value={list.progress} className="h-2" />
              )}
            </div>

            {/* Loading indicator when fetching more */}
            {list.loading && list.rows.length > 0 && (
              <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading more...
              </div>
            )}

            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                className="border-2 border-gray-100 rounded-xl px-4 py-2.5 w-full focus:border-cpg-teal/50 focus:outline-none transition-colors"
                placeholder="Search email or name..."
                value={list.q}
                onChange={(e) => list.setQ(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  list.load(list.bucket, 0, e.currentTarget.value)
                }
              />
              <Button
                variant="default"
                size="lg"
                onClick={() => list.load(list.bucket, 0, list.q)}
                disabled={list.loading}
                className="w-full sm:w-auto bg-cpg-teal hover:bg-cpg-teal/90 rounded-xl"
              >
                Search
              </Button>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-1">
              {/* Loading skeletons */}
              {list.loading &&
                list.rows.length === 0 &&
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="border-2 border-gray-100 rounded-xl p-4">
                    <div className="h-4 w-48 bg-gray-100 rounded-lg mb-2 animate-pulse" />
                    <div className="h-3 w-64 bg-gray-50 rounded-lg animate-pulse" />
                  </div>
                ))}

              {/* User rows */}
              {list.rows.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 border-2 border-gray-100 rounded-xl p-4 hover:border-cpg-teal/30 transition-colors"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-cpg-teal/10 flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-cpg-teal" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {u.email || u.id}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {u.name ? `${u.name} • ` : ""}Joined{" "}
                        {new Date(u.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Load more button */}
              {list.offset < (list.total ?? Infinity) && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => list.load(list.bucket, list.offset, list.q)}
                  disabled={list.loading}
                  className="w-full rounded-xl border-2 mt-2"
                >
                  {list.loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load more"
                  )}
                </Button>
              )}

              {/* Empty state */}
              {!list.loading && list.rows.length === 0 && (
                <div className="text-center py-8">
                  <div className="bg-gray-50 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">No users found.</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
