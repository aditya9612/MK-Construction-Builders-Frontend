import { useMemo } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  Sparkles,
  Star,
  Globe,
  Laptop,
  PenTool,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { Card } from '../../components/cards/Card';
import { Button } from '../../components/common/Button';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

function StatCard({ label, value, subtext, icon: Icon, colorClass, bgClass, borderClass }) {
  return (
    <Card className="relative overflow-hidden border p-4 sm:p-5 transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {value}
            </span>
          </div>
          {subtext ? <p className="mt-1 truncate text-xs text-slate-500">{subtext}</p> : null}
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${borderClass} ${bgClass} ${colorClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

const RATING_COLORS = {
  '5': '#16a34a',
  '4': '#2563eb',
  '3': '#eab308',
  '2': '#f97316',
  '1': '#dc2626',
};

export function FeedbackStatsCards({ stats, loading, error, onRetry }) {
  const chartData = useMemo(() => {
    if (!stats?.rating_distribution) return [];
    return [5, 4, 3, 2, 1].map((star) => {
      const count = Number(stats.rating_distribution[String(star)]) || 0;
      const total = Number(stats.total_reviews) || 0;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return {
        star: `${star} Stars`,
        starNum: star,
        count,
        pct,
        fill: RATING_COLORS[String(star)],
      };
    });
  }, [stats]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-3 w-20 rounded bg-slate-200" />
                  <div className="h-6 w-12 rounded bg-slate-200" />
                </div>
                <div className="h-10 w-10 rounded-xl bg-slate-200" />
              </div>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse p-6">
          <div className="h-4 w-48 rounded bg-slate-200 mb-4" />
          <div className="h-48 rounded bg-slate-100" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border border-red-200 bg-red-50/50 p-6 text-center">
        <p className="text-sm font-medium text-red-600">{error}</p>
        {onRetry && (
          <Button
            variant="secondary"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold"
            onClick={onRetry}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Loading Statistics
          </Button>
        )}
      </Card>
    );
  }

  const avgRating = Number(stats?.average_rating || 0).toFixed(2);
  const totalReviews = Number(stats?.total_reviews || 0);

  return (
    <div className="space-y-4">
      {/* 8 Primary Statistics Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Total Reviews */}
        <StatCard
          label="Total Reviews"
          value={totalReviews}
          subtext="All customer submissions"
          icon={MessageSquare}
          colorClass="text-brand-navy"
          bgClass="bg-slate-100"
          borderClass="border-slate-200"
        />

        {/* 2. Published Reviews */}
        <StatCard
          label="Published Reviews"
          value={Number(stats?.published_reviews || 0)}
          subtext="Visible on public website"
          icon={CheckCircle2}
          colorClass="text-emerald-700"
          bgClass="bg-emerald-50"
          borderClass="border-emerald-200"
        />

        {/* 3. Pending Reviews */}
        <StatCard
          label="Pending Reviews"
          value={Number(stats?.pending_reviews || 0)}
          subtext="Awaiting review & publish"
          icon={Clock}
          colorClass="text-amber-700"
          bgClass="bg-amber-50"
          borderClass="border-amber-200"
        />

        {/* 4. Featured Reviews */}
        <StatCard
          label="Featured Reviews"
          value={Number(stats?.featured_reviews || 0)}
          subtext="Highlighted on homepage"
          icon={Sparkles}
          colorClass="text-purple-700"
          bgClass="bg-purple-50"
          borderClass="border-purple-200"
        />

        {/* 5. Average Rating */}
        <StatCard
          label="Average Rating"
          value={`${avgRating} ★`}
          subtext={`Based on ${totalReviews} feedback records`}
          icon={Star}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
          borderClass="border-amber-200"
        />

        {/* 6. Google Reviews */}
        <StatCard
          label="Google Reviews"
          value={Number(stats?.google_review_count || 0)}
          subtext="Imported Google My Business"
          icon={Globe}
          colorClass="text-blue-700"
          bgClass="bg-blue-50"
          borderClass="border-blue-200"
        />

        {/* 7. Website Reviews */}
        <StatCard
          label="Website Reviews"
          value={Number(stats?.website_review_count || 0)}
          subtext="Direct web customer submissions"
          icon={Laptop}
          colorClass="text-sky-700"
          bgClass="bg-sky-50"
          borderClass="border-sky-200"
        />

        {/* 8. Manual Reviews */}
        <StatCard
          label="Manual Reviews"
          value={Number(stats?.manual_review_count || 0)}
          subtext="Offline client testimonials"
          icon={PenTool}
          colorClass="text-indigo-700"
          bgClass="bg-indigo-50"
          borderClass="border-indigo-200"
        />
      </div>

      {/* Rating Distribution Breakdown & Chart */}
      <Card className="border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <TrendingUp className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Rating Distribution</h3>
              <p className="text-xs text-slate-500">Breakdown of star ratings across all customer feedback</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Overall Score:</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              {avgRating} / 5.0
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-center">
          {/* Progress bar list */}
          <div className="space-y-3">
            {chartData.map((d) => (
              <div key={d.starNum} className="flex items-center gap-3 text-xs">
                <span className="w-16 font-semibold text-slate-700 flex items-center gap-1">
                  {d.starNum} <Star className="h-3 w-3 fill-amber-400 text-amber-400 inline" />
                </span>
                <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${d.pct}%`,
                      backgroundColor: d.fill,
                    }}
                  />
                </div>
                <span className="w-12 text-right font-medium text-slate-700">
                  {d.count} <span className="text-slate-400">({d.pct}%)</span>
                </span>
              </div>
            ))}
          </div>

          {/* Recharts BarChart representation */}
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="star" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val, _name, item) => [`${val} reviews (${item.payload.pct}%)`, 'Feedback Count']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#38bdf8' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default FeedbackStatsCards;
