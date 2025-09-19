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
import { useNavigate } from "react-router-dom";

// CPG Hub palette
const CPG_BROWN = "#6b3a2d";
const CPG_TEAL = "#1db7a6";
const defaultClass = "";

// If you want to always hit prod API in dev, set VITE_API_BASE in .env.local
const API_BASE = import.meta.env.VITE_API_BASE || "";

function StatClickable({ label, value, onClick }) {
  return (
    <Card
      className="rounded-2xl cursor-pointer hover:shadow-md transition"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-gray-500">{label}</CardTitle>
      </CardHeader>
      <CardContent className={defaultClass}>
        <div className="text-3xl font-semibold text-gray-900">{value}</div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-gray-500">{label}</CardTitle>
      </CardHeader>
      <CardContent className={defaultClass}>
        <div className="text-3xl font-semibold text-gray-900">{value}</div>
      </CardContent>
    </Card>
  );
}

function useRoleList() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [bucket, setBucket] = useState(null);
  const [q, setQ] = useState("");

  async function load(b, nextOffset = 0, query = q) {
    setLoading(true);
    const params = new URLSearchParams({
      bucket: b,
      limit: "50",
      offset: String(nextOffset),
    });
    if (query) params.set("q", query);
    const res = await fetch(
      `${API_BASE}/api/analytics/roles?${params.toString()}`
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Roles list ${res.status}: ${text.slice(0, 200)}`);
    }
    const json = await res.json();
    setBucket(b);
    setTotal(json.total);
    setOffset(json.offset + json.count);
    setRows(nextOffset === 0 ? json.users : [...rows, ...json.users]);
    setLoading(false);
  }

  function reset() {
    setRows([]);
    setTotal(0);
    setOffset(0);
    setBucket(null);
    setQ("");
  }

  return { loading, rows, total, offset, bucket, q, setQ, load, reset };
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
    await list.load(bucket, 0);
    setOpen(true);
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 grid gap-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-6xl mx-auto p-6">
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1
          className="text-3xl font-extrabold tracking-tight"
          style={{ color: CPG_BROWN }}
        >
          Roles Overview
        </h1>
        <Badge
          variant="default"
          className="ml-auto"
          style={{ backgroundColor: `${CPG_TEAL}22`, color: CPG_TEAL }}
        >
          Updated now
        </Badge>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">
              Singles (click to view)
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
              Combos (click to view)
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
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="key" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill={CPG_TEAL} />
              </BarChart>
            </ResponsiveContainer>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader className={defaultClass}>
            <DialogTitle className={defaultClass}>
              {title}
              {list.total ? ` — ${list.total}` : ""}
            </DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="flex gap-2 mt-2">
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
              className=""
              variant="default"
              size="lg"
              onClick={() => list.load(list.bucket, 0, list.q)}
              disabled={list.loading}
            >
              Search
            </Button>
          </div>

          <div className="mt-3 space-y-2 max-h-[60vh] overflow-auto">
            {list.rows.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between border rounded-lg p-3"
              >
                <div>
                  <div className="text-sm font-medium">{u.email || u.id}</div>
                  <div className="text-xs text-gray-500">
                    {u.name ? `${u.name} • ` : ""}Created{" "}
                    {new Date(u.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {/* <Button asChild variant="secondary" size="sm">
                  <a href={`/users/${u.id}`}>View</a>
                </Button> */}
              </div>
            ))}
            {list.offset < list.total && (
              <Button
                className=""
                variant="default"
                size="default"
                onClick={() => list.load(list.bucket, list.offset, list.q)}
                disabled={list.loading}
              >
                {list.loading ? "Loading..." : "Load more"}
              </Button>
            )}
            {!list.loading && list.rows.length === 0 && (
              <div className="text-sm text-gray-500">No users found.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
