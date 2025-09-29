import React, { useEffect, useState } from "react";
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
import { Loader2 } from "lucide-react";
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

// CPG Hub palette
const CPG_BROWN = "#6b3a2d";
const CPG_TEAL = "#1db7a6";
const defaultClass = "";
const DETAIL_ROUTE_PREFIX = "/users";

// If you want to always hit prod API in dev, set VITE_API_BASE in .env.local
const API_BASE = import.meta.env.VITE_API_BASE || "";

function StatClickable({ label, value, onClick }) {
  return (
    <Card
      className="rounded-2xl cursor-pointer hover:shadow-md transition select-none active:scale-[0.99]"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick?.()}
      aria-label={`${label}: ${value}`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-xs sm:text-sm text-gray-500 line-clamp-1">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className={defaultClass}>
        <div className="text-2xl sm:text-3xl font-semibold text-gray-900">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs sm:text-sm text-gray-500 line-clamp-1">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className={defaultClass}>
        <div className="text-2xl sm:text-3xl font-semibold text-gray-900">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

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

export default function RolesDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
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

  async function openList(bucket, niceTitle) {
    setTitle(niceTitle);
    setOpen(true);
    list.reset();
    list.load(bucket, 0).catch(() => {});
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 grid gap-4">
        <Skeleton className="h-7 w-48 sm:h-8 sm:w-64" />
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 sm:h-28" />
          ))}
        </div>
        <Skeleton className="h-64 sm:h-80" />
        <Skeleton className="h-52 sm:h-64" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <h1 className="text-2xl font-semibold text-red-600">Error</h1>
        <p className="text-sm text-gray-600 mt-2">{err}</p>
      </div>
    );
  }

  const { total, singles, combos, any } = data;

  const chartData = [
    { key: "Talent Only", count: singles.talentOnly },
    { key: "Service Only", count: singles.serviceOnly },
    { key: "Brand Only", count: singles.brandOnly },
    { key: "Talent + Service", count: combos.talentService },
    { key: "Talent + Brand", count: combos.talentBrand },
    { key: "Brand + Service", count: combos.brandService },
    { key: "All Three", count: combos.allThree },
    { key: "None", count: singles.none },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
      <div className="flex items-start sm:items-center gap-2 sm:gap-3">
        <h1
          className="text-2xl sm:text-3xl font-extrabold tracking-tight"
          style={{ color: CPG_BROWN }}
        >
          Roles Overview
        </h1>
        <Badge
          variant="default"
          className="ml-auto text-xs sm:text-sm"
          style={{ backgroundColor: `${CPG_TEAL}22`, color: CPG_TEAL }}
        >
          Updated now
        </Badge>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
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

      {/* Singles & Combos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">
              Singles (tap to view)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
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
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">
              Combos (tap to view)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
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
          </CardContent>
        </Card>
      </div>

      {/* Bar chart */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-700">Distribution</CardTitle>
        </CardHeader>
        <CardContent className={defaultClass}>
          {/* Horizontal scroll on small screens to prevent cramped labels */}
          <div className="h-56 sm:h-72 overflow-x-auto">
            <div className="min-w-[640px] h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="key"
                    tick={{ fontSize: 10 }}
                    angle={-20}
                    height={40}
                    interval={0}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={CPG_TEAL} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List dialog */}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) list.reset();
        }}
      >
        {/* Make the whole sheet scrollable on small/"sm" and up */}
        <DialogContent className="sm:max-w-2xl w-[95vw] sm:w-auto p-0 max-h-[90vh] sm:max-h-[90vh] flex flex-col overflow-y-auto">
          {/* Sticky header with its own padding so it doesn't overlap */}
          <DialogHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b">
            <div className="px-4 py-3 sm:px-6 sm:py-4">
              <DialogTitle className="text-base sm:text-lg font-semibold">
                {title}
                {typeof list.total === "number" ? ` — ${list.total}` : ""}
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* Body becomes a flex column; inner list gets the scroll */}
          <div className="px-4 py-3 sm:px-6 sm:py-4 flex flex-col gap-3 min-h-0">
            {/* Progress bar */}
            <div>
              {list.progress === null ? (
                <div className="h-2 w-full overflow-hidden rounded bg-gray-200">
                  <div className="h-full w-1/3 animate-[indeterminate_1.2s_ease_infinite] rounded bg-gray-400" />
                </div>
              ) : (
                <Progress className={defaultClass} value={list.progress} />
              )}
            </div>

            {/* Small spinner when loading more */}
            {list.loading && list.rows.length > 0 && (
              <div className="self-end text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}

            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                className="border rounded-md px-3 py-2 w-full"
                placeholder="Search email or name…"
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
                className="w-full sm:w-auto"
              >
                Search
              </Button>
            </div>

            {/* Results: take remaining height and scroll */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-1">
              {list.loading &&
                list.rows.length === 0 &&
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="border rounded-lg p-3">
                    <div className="h-4 w-40 bg-gray-200 rounded mb-2 animate-pulse" />
                    <div className="h-3 w-64 bg-gray-100 rounded animate-pulse" />
                  </div>
                ))}

              {list.rows.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 border rounded-lg p-3 sm:p-4"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {u.email || u.id}
                    </div>
                    <div className="text-xs text-gray-500">
                      {u.name ? `${u.name} • ` : ""}Created{" "}
                      {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {/* <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="shrink-0"
                  >
                    <Link to={`${DETAIL_ROUTE_PREFIX}/${u.id}`}>View</Link>{" "}
                  </Button> */}
                </div>
              ))}

              {list.offset < (list.total ?? Infinity) && (
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => list.load(list.bucket, list.offset, list.q)}
                  disabled={list.loading}
                  className="w-full"
                >
                  {list.loading ? "Loading..." : "Load more"}
                </Button>
              )}

              {!list.loading && list.rows.length === 0 && (
                <div className="text-sm text-gray-500">No users found.</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
