import React, { useState, useEffect, useMemo } from "react";
import { User, UserRole, Incident, IncidentStatus } from "../types";
import { dbService } from "../services/db";
import { STATUS_COLORS, Icons } from "../constants";
import IncidentForm from "./IncidentForm";
import IncidentImages from "./IncidentImages";

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<IncidentStatus | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const isAdmin = user.role === UserRole.ADMIN;

  const loadData = async () => {
    setLoading(true);
    try {
      const data = isAdmin
        ? await dbService.getIncidents()
        : await dbService.getUserIncidents(user.id);
      setIncidents(
        data.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
      );
    } catch (error) {
      console.error("Error loading incidents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Set up real-time subscription
    let unsubscribe: (() => void) | null = null;
    if (isAdmin) {
      unsubscribe = dbService.subscribeToIncidents((freshData) => {
        setIncidents(
          freshData.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          ),
        );
      });
    } else {
      unsubscribe = dbService.subscribeToUserIncidents(user.id, (freshData) => {
        setIncidents(
          freshData.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          ),
        );
      });
    }

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, isAdmin]);

  const stats = useMemo(
    () => ({
      all: incidents.length,
      pending: incidents.filter((i) => i.status === IncidentStatus.PENDING)
        .length,
      active: incidents.filter(
        (i) => i.status === IncidentStatus.UNDER_INVESTIGATION,
      ).length,
      resolved: incidents.filter((i) => i.status === IncidentStatus.RESOLVED)
        .length,
    }),
    [incidents],
  );

  const filteredIncidents = useMemo(() => {
    return incidents.filter((i) => {
      const matchesFilter = filter === "ALL" || i.status === filter;
      const matchesSearch =
        i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.reporter_email?.toLowerCase().includes(searchTerm.toLowerCase()) ??
          false) ||
        i.location.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [incidents, filter, searchTerm]);

  const handleCreate = async (data: any) => {
    try {
      await dbService.addIncident({
        ...data,
        reporter_id: user.id,
        reporter_email: user.email,
      });
      setShowForm(false);
      // Data will update via real-time subscription
    } catch (error) {
      console.error("Error creating incident:", error);
      alert("Failed to create incident. Please try again.");
    }
  };

  const handleUpdateStatus = async (id: string, status: IncidentStatus) => {
    try {
      await dbService.updateIncidentStatus(id, status);
      // Data will update via real-time subscription
    } catch (error) {
      console.error("Error updating incident:", error);
      alert("Failed to update incident. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        "Permanently expunge this case record? This action cannot be undone.",
      )
    ) {
      try {
        await dbService.deleteIncident(id);
        // Data will update via real-time subscription
      } catch (error) {
        console.error("Error deleting incident:", error);
        alert("Failed to delete incident. Please try again.");
      }
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 lg:py-14 space-y-8 md:space-y-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 lg:gap-10">
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="px-2.5 md:px-3 py-1 md:py-1.5 bg-indigo-50 text-indigo-600 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] rounded-lg border border-indigo-100/50">
              {isAdmin ? "Admin Control" : "User Portal"}
            </span>
            <div className="h-px w-8 md:w-12 bg-indigo-200"></div>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            {isAdmin ? "Command Center" : "My Incidents"}
          </h1>
          <p className="text-slate-500 font-medium text-sm md:text-base lg:text-lg max-w-2xl leading-relaxed">
            {isAdmin
              ? "Oversee and orchestrate community safety responses with unified case management."
              : "Track investigative milestones for your filed reports in real-time."}
          </p>
        </div>

        <div className="flex flex-col gap-3 md:gap-4">
          <div className="relative w-full md:min-w-[320px]">
            <div className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search cases, reporters, locations..."
              className="w-full pl-10 md:pl-14 pr-4 md:pr-6 py-3 md:py-4 rounded-xl md:rounded-2xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-sm md:text-base text-slate-800 shadow-sm hover:border-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {!isAdmin && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="group flex items-center justify-center gap-2 md:gap-3 bg-slate-900 hover:bg-black active:scale-95 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black shadow-lg md:shadow-xl md:shadow-slate-200 transition-all uppercase text-[9px] md:text-[11px] tracking-widest"
            >
              <Icons.Plus />
              <span>File New Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Performance Overview Grid */}
      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {[
            {
              label: "Total Cases",
              value: stats.all,
              icon: "Shield",
              color: "indigo",
            },
            {
              label: "Unassigned",
              value: stats.pending,
              icon: "AlertCircle",
              color: "amber",
            },
            {
              label: "Active Audit",
              value: stats.active,
              icon: "Search",
              color: "blue",
            },
            {
              label: "Resolved",
              value: stats.resolved,
              icon: "Check",
              color: "emerald",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white p-4 md:p-6 rounded-xl md:rounded-3xl border border-slate-100 shadow-sm group hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-3 md:mb-4">
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {stat.label}
                </span>
                <div
                  className={`p-2 rounded-lg md:rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}
                >
                  <Icons.Shield />
                </div>
              </div>
              <div className="text-2xl md:text-4xl font-black text-slate-900">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unified Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3 bg-slate-100/50 p-2 md:p-3 rounded-xl md:rounded-2xl border border-slate-200/50">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${
            filter === "ALL"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          All ({stats.all})
        </button>
        {Object.values(IncidentStatus).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${
              filter === s
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <IncidentForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Incident Grid */}
      <div className="grid gap-4 md:gap-6 lg:gap-8">
        {filteredIncidents.length === 0 ? (
          <div className="py-16 md:py-24 bg-white rounded-2xl md:rounded-[3rem] border-2 border-dashed border-slate-200 text-center space-y-3 md:space-y-4">
            <div className="flex justify-center text-slate-100">
              <div className="scale-[2.5] md:scale-[3]">
                <Icons.Shield />
              </div>
            </div>
            <p className="text-slate-400 font-bold uppercase text-[10px] md:text-[11px] tracking-[0.3em]">
              No incident records match your criteria
            </p>
          </div>
        ) : (
          filteredIncidents.map((incident) => (
            <div
              key={incident.id}
              className="group relative bg-white rounded-xl md:rounded-2xl lg:rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-lg md:hover:shadow-2xl hover:shadow-indigo-500/5 hover:border-indigo-100 transition-all duration-500 overflow-hidden"
            >
              {/* Dynamic Status Strip */}
              <div
                className={`absolute top-0 left-0 bottom-0 w-1 md:w-2 ${
                  incident.status === IncidentStatus.RESOLVED
                    ? "bg-emerald-500"
                    : incident.status === IncidentStatus.PENDING
                      ? "bg-amber-400"
                      : "bg-blue-500"
                } opacity-80`}
              ></div>

              <div className="p-4 md:p-8 lg:p-12 pl-5 md:pl-10 lg:pl-16">
                {/* Header Row */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 md:gap-6 lg:gap-8 mb-6 md:mb-8">
                  <div className="space-y-2 md:space-y-3 flex-grow">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                      <span
                        className={`px-2.5 md:px-4 py-1 md:py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border ${STATUS_COLORS[incident.status]}`}
                      >
                        {incident.status.replace("_", " ")}
                      </span>
                      <span className="px-2.5 md:px-4 py-1 md:py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-100">
                        {incident.category}
                      </span>
                      <span className="flex items-center gap-1 text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        <Icons.MapPin /> {incident.location}
                      </span>
                    </div>
                    <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
                      {incident.title}
                    </h3>
                  </div>

                  <div className="flex flex-col lg:items-end gap-1 md:gap-2 text-right flex-shrink-0">
                    <div className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                      Ref: #{incident.id.slice(0, 8).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-[8px] md:text-[10px] font-bold uppercase tracking-wider">
                      <svg
                        width="10"
                        height="10"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      filed {getTimeAgo(incident.created_at)}
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="grid lg:grid-cols-3 gap-6 md:gap-8 lg:gap-12 items-start pt-6 md:pt-8 border-t border-slate-50">
                  {/* Left: Narrative */}
                  <div className="lg:col-span-2 space-y-4 md:space-y-6">
                    <div className="text-slate-600 text-base md:text-lg leading-relaxed font-medium italic">
                      "{incident.description}"
                    </div>

                    {/* Evidence Gallery - Admin Only */}
                    {isAdmin && (
                      <div className="p-4 md:p-6 bg-slate-50 rounded-xl md:rounded-3xl border border-slate-100/50">
                        <IncidentImages
                          incidentId={incident.id}
                          isAdmin={isAdmin}
                        />
                      </div>
                    )}

                    {/* Activity Timeline Mini */}
                    {incident.status_history &&
                      incident.status_history.length > 0 && (
                        <div className="p-4 md:p-6 bg-slate-50 rounded-xl md:rounded-3xl border border-slate-100/50">
                          <h4 className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 md:mb-4">
                            Timeline
                          </h4>
                          <div className="flex flex-wrap gap-3 md:gap-4">
                            {incident.status_history.map((h, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 md:gap-3"
                              >
                                <div
                                  className={`h-2 w-2 rounded-full ${
                                    h.status === IncidentStatus.RESOLVED
                                      ? "bg-emerald-500"
                                      : "bg-indigo-400"
                                  }`}
                                ></div>
                                <div className="flex flex-col">
                                  <span className="text-[8px] md:text-[10px] font-black text-slate-800 uppercase">
                                    {h.status.split("_")[0]}
                                  </span>
                                  <span className="text-[7px] md:text-[8px] font-bold text-slate-400">
                                    {new Date(
                                      h.changed_at,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Right: Meta & Actions */}
                  <div className="space-y-4 md:space-y-6 lg:space-y-8">
                    {isAdmin && incident.reporter_email && (
                      <div className="p-4 md:p-6 bg-indigo-50/50 rounded-xl md:rounded-3xl border border-indigo-100/50">
                        <div className="text-[8px] md:text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 md:mb-3">
                          Identity
                        </div>
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="h-8 md:h-10 w-8 md:w-10 rounded-lg md:rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-100 text-xs md:text-sm flex-shrink-0">
                            {incident.reporter_email[0].toUpperCase()}
                          </div>
                          <div className="flex flex-col overflow-hidden min-w-0">
                            <span className="text-xs md:text-sm font-black text-slate-900 truncate">
                              {incident.reporter_email}
                            </span>
                            <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase">
                              Verified
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {isAdmin ? (
                      <div className="space-y-3 md:space-y-4">
                        <div className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Action
                        </div>
                        <div className="grid grid-cols-1 gap-2 md:gap-2">
                          {Object.values(IncidentStatus).map((s) => (
                            <button
                              key={s}
                              onClick={() => handleUpdateStatus(incident.id, s)}
                              className={`w-full py-2.5 md:py-3.5 px-4 md:px-6 rounded-lg md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${
                                incident.status === s
                                  ? "bg-slate-900 text-white shadow-lg"
                                  : "bg-white text-slate-500 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                              }`}
                            >
                              {s.split("_")[0]}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => handleDelete(incident.id)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 md:py-3.5 px-4 md:px-6 rounded-lg md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-50/50 border border-red-100/50 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Icons.Trash /> Delete
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 md:space-y-4">
                        <div className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Status
                        </div>
                        <div
                          className={`p-4 md:p-6 rounded-xl md:rounded-3xl border ${STATUS_COLORS[incident.status]} flex items-center gap-3 md:gap-4`}
                        >
                          <div className="animate-pulse h-2 w-2 rounded-full bg-current flex-shrink-0"></div>
                          <span className="font-black text-xs md:text-sm uppercase tracking-tight">
                            {incident.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-[9px] md:text-[10px] text-slate-400 font-medium leading-relaxed">
                          Your report is active within our investigation queue.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
