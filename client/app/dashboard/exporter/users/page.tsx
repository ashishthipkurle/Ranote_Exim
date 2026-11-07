"use client";

import { useState, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Edit2,
  Trash2,
  Building2,
  Globe,
  Users,
  Activity,
  X,
  Eye,
  XCircle,
  MoreVertical,
} from "lucide-react";
import { useAuthFetch } from "@/lib/hooks/useAuthFetch";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";
import clsx from "clsx";
import Link from "next/link";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  businessName: string | null;
  country: string | null;
  phone: string | null;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";
  createdAt: string;
};

type UserDocument = {
  id: string;
  docType: string;
  fileUrl: string;
  fileName: string | null;
  mimeType: string;
  verificationStatus: string;
  createdAt: string;
};

export default function ExporterUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const authFetch = useAuthFetch();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [selectedUserForDocs, setSelectedUserForDocs] = useState<User | null>(null);
  const [userDocuments, setUserDocuments] = useState<UserDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [roleChangeModal, setRoleChangeModal] = useState<{ userId: string; currentRole: string } | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState("");
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ userId: string; name: string | null; email: string } | null>(null);

  const fetchUsers = async () => {
    if (user?.role !== "ADMIN") return;
    setLoading(true);
    try {
      const url = `/api/admin/users?page=${page}&q=${encodeURIComponent(search)}&role=${roleFilter}&verified=${verifiedFilter}`;
      const data = await authFetch<{ users: User[], total: number, totalPages: number }>(url);
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error: any) {
      console.error("Registry fetch error:", error);
      toast.error(error?.message || "Failed to fetch registry data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [page, search, roleFilter, verifiedFilter, user?.id]);

  if (authLoading) return <div className="h-full flex items-center justify-center"><Activity className="w-8 h-8 animate-spin text-muted-foreground" /></div>;

  if (user?.role !== "ADMIN") {
    return (
      <main className="flex-1 flex flex-col h-full items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "linear-gradient(to right,#1f2937 1px,transparent 1px),linear-gradient(to bottom,#1f2937 1px,transparent 1px)", backgroundSize: "2.5rem 2.5rem" }} />
        <div className="relative z-10 flex flex-col items-center text-center p-12 bg-card/40 backdrop-blur-3xl border border-border dark:border-white/5 rounded-2xl max-w-lg shadow-2xl">
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-8 animate-pulse">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">Access Denied</h2>
          <p className="text-muted-foreground text-sm font-medium leading-relaxed mb-8">Platform Administrator clearance required to view the User Registry.</p>
          <Link href="/dashboard/exporter" className="px-8 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all duration-300 shadow-md">
            Return to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const handleAction = async (userId: string, action: string, extra?: any) => {
    try {
      await authFetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({ userId, action, ...extra }),
      });
      toast.success(`User updated successfully`);
      fetchUsers();
    } catch (error) {
      toast.error(`Update failed`);
    }
  };

  const fetchUserDocuments = async (targetUserId: string) => {
    setDocsLoading(true);
    setUserDocuments([]);
    try {
      const data = await authFetch<{ documents: UserDocument[] }>(
        `/api/admin/users/documents?userId=${targetUserId}`
      );
      setUserDocuments(data.documents || []);
    } catch (error) {
      console.error("Failed to fetch user documents:", error);
    } finally {
      setDocsLoading(false);
    }
  };

  const openDocReview = (u: User) => {
    setSelectedUserForDocs(u);
    fetchUserDocuments(u.id);
  };

  const handleApproveDocs = () => {
    if (selectedUserForDocs) {
      handleAction(selectedUserForDocs.id, "verify");
      setSelectedUserForDocs(null);
      setUserDocuments([]);
    }
  };

  const handleRejectDocs = () => {
    if (selectedUserForDocs) {
      handleAction(selectedUserForDocs.id, "reject");
      setSelectedUserForDocs(null);
      setUserDocuments([]);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "EXPORTER": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "IMPORTER": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "SUPPLIER": return "text-purple-500 bg-purple-500/10 border-purple-500/20";
      case "CONSUMER": return "text-pink-500 bg-pink-500/10 border-pink-500/20";
      default: return "text-slate-500 bg-slate-500/10 border-slate-500/20";
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#fafafa] dark:bg-background relative">
      <header className="flex-shrink-0 py-8 px-8 sm:px-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border bg-white/50 dark:bg-background/40 backdrop-blur-xl z-40">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            User Registry
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              {total} Users
            </span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Manage users, roles, and verification status
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search users..."
              className="pl-10 pr-10 py-2.5 bg-white dark:bg-white/5 border border-border rounded-xl text-sm text-foreground shadow-sm w-full sm:w-64 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>}
          </div>

          <select
            className="bg-white dark:bg-white/5 border border-border rounded-xl px-4 py-2.5 text-sm font-medium text-foreground shadow-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Roles</option>
            <option value="EXPORTER">Exporter</option>
            <option value="IMPORTER">Importer</option>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>

          <select
            className="bg-white dark:bg-white/5 border border-border rounded-xl px-4 py-2.5 text-sm font-medium text-foreground shadow-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
            value={verifiedFilter}
            onChange={(e) => { setVerifiedFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 sm:p-10">
        <div className="max-w-[1600px] mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-pulse h-64" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-card border border-border rounded-2xl border-dashed">
              <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-foreground font-medium">No users found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {users.map((u) => (
                <div key={u.id} className="group relative bg-card border border-border/60 hover:border-border rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                  
                  {/* PENDING DOT */}
                  {u.verificationStatus === "PENDING" && (
                    <div className="absolute top-4 right-4 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </div>
                  )}

                  <div className="flex items-start gap-4 mb-5">
                    <div className={clsx(
                      "size-14 rounded-full flex items-center justify-center font-bold text-lg border",
                      getRoleColor(u.role)
                    )}>
                      {u.name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="text-base font-bold text-foreground truncate" title={u.name || "Unnamed User"}>
                        {u.name || "Unnamed User"}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate" title={u.email}>{u.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={clsx(
                          "text-[10px] font-bold px-2 py-0.5 rounded-md border tracking-wide",
                          getRoleColor(u.role)
                        )}>
                          {u.role}
                        </span>
                        {u.verificationStatus === "VERIFIED" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border tracking-wide text-emerald-600 bg-emerald-500/10 border-emerald-500/20 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> VERIFIED
                          </span>
                        )}
                        {u.verificationStatus === "REJECTED" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border tracking-wide text-red-600 bg-red-500/10 border-red-500/20">
                            REJECTED
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6 flex-1">
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/50">
                      <Building2 className="w-4 h-4 text-primary" />
                      <span className="truncate">{u.businessName || "No business specified"}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/50">
                      <Globe className="w-4 h-4 text-blue-500" />
                      <span className="truncate">{u.country || "Global"}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/60 grid grid-cols-4 gap-2">
                    <button
                      title="View Documents"
                      onClick={() => openDocReview(u)}
                      className="flex items-center justify-center p-2 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground relative"
                    >
                      <Eye className="w-4 h-4" />
                      {u.verificationStatus === "PENDING" && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      )}
                    </button>
                    
                    <button
                      title={u.verificationStatus === "VERIFIED" ? "Unverify User" : "Verify User"}
                      onClick={() => handleAction(u.id, u.verificationStatus === "VERIFIED" ? "unverify" : "verify")}
                      className={clsx(
                        "flex items-center justify-center p-2 rounded-lg transition-colors",
                        u.verificationStatus === "VERIFIED" 
                          ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" 
                          : "bg-muted text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600"
                      )}
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </button>

                    <button
                      title="Edit Role"
                      onClick={() => {
                        setRoleChangeModal({ userId: u.id, currentRole: u.role });
                        setSelectedNewRole(u.role);
                      }}
                      className="flex items-center justify-center p-2 rounded-lg bg-muted hover:bg-blue-500/10 hover:text-blue-600 transition-colors text-muted-foreground"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      title="Delete User"
                      onClick={() => {
                        setDeleteConfirmModal({ userId: u.id, name: u.name, email: u.email });
                      }}
                      className="flex items-center justify-center p-2 rounded-lg bg-muted hover:bg-red-500/10 hover:text-red-600 transition-colors text-muted-foreground"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && users.length > 0 && (
            <div className="mt-10 flex items-center justify-between bg-card border border-border p-4 rounded-xl shadow-sm">
              <p className="text-sm text-muted-foreground font-medium">
                Showing <span className="text-foreground font-bold">{(page - 1) * 20 + 1}—{Math.min(page * 20, total)}</span> of <span className="text-foreground font-bold">{total}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-sm">
                  {page}
                </div>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals remain structurally the same but styled nicer */}
      {selectedUserForDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="bg-card w-full max-w-3xl rounded-2xl shadow-xl border border-border overflow-hidden max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur z-10">
              <div>
                <h3 className="text-xl font-bold text-foreground">Document Review</h3>
                <p className="text-sm text-muted-foreground font-medium">{selectedUserForDocs.name || selectedUserForDocs.email}</p>
              </div>
              <button onClick={() => setSelectedUserForDocs(null)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* User Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</p>
                  <p className="text-sm font-bold text-foreground mt-1 truncate">{selectedUserForDocs.email}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</p>
                  <p className="text-sm font-bold text-foreground mt-1">{selectedUserForDocs.phone || "Not provided"}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Business</p>
                  <p className="text-sm font-bold text-foreground mt-1 truncate">{selectedUserForDocs.businessName || "Not provided"}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</p>
                  <p className={clsx("text-sm font-bold mt-1", selectedUserForDocs.verificationStatus === "VERIFIED" ? "text-emerald-600" : selectedUserForDocs.verificationStatus === "REJECTED" ? "text-red-500" : "text-amber-500")}>{selectedUserForDocs.verificationStatus}</p>
                </div>
              </div>

              {/* Docs Grid */}
              <div>
                <h4 className="text-base font-bold text-foreground mb-4">Verification Documents</h4>
                {docsLoading ? (
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse h-56" />
                    ))}
                  </div>
                ) : userDocuments.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-border bg-card p-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <Eye className="w-7 h-7 text-muted-foreground/50" />
                    </div>
                    <p className="text-base font-bold text-foreground">No Documents Found</p>
                    <p className="text-sm text-muted-foreground mt-1">User has not uploaded any files yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {userDocuments.map((doc) => {
                      const isImage = doc.mimeType?.startsWith("image/");
                      const isPdf = doc.mimeType === "application/pdf";
                      return (
                        <a
                          key={doc.id}
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-border bg-card p-4 text-center cursor-pointer group hover:border-primary/50 hover:shadow-md transition-all block relative overflow-hidden"
                        >
                          <div className="w-full h-40 bg-muted/50 rounded-lg flex items-center justify-center mb-4 border border-border/50 overflow-hidden relative">
                            {isImage ? (
                              <img src={doc.fileUrl} alt={doc.fileName || doc.docType} className="object-cover w-full h-full opacity-90 group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-muted-foreground">
                                <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                <span className="text-xs font-bold uppercase">{isPdf ? "PDF Document" : "File"}</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                              <div className="flex items-center gap-2 text-white font-bold bg-white/20 px-4 py-2 rounded-full backdrop-blur-md">
                                <Eye className="w-4 h-4" /> View Full
                              </div>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-foreground">
                            {String(doc.docType || "DOCUMENT").replace(/_/g, " ")}
                          </p>
                          {doc.fileName && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">{doc.fileName}</p>
                          )}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card">
                <p className="text-sm font-medium text-muted-foreground">
                  {selectedUserForDocs.verificationStatus === "VERIFIED" 
                    ? "This user is already verified." 
                    : "Please review carefully before approving."}
                </p>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button 
                    onClick={handleRejectDocs}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl border border-red-500/20 text-red-600 hover:bg-red-500/10 text-sm font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <button 
                    onClick={handleApproveDocs}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" /> Approve User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {roleChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Edit Role</h3>
              <button onClick={() => setRoleChangeModal(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Role</label>
                <select
                  value={selectedNewRole}
                  onChange={(e) => setSelectedNewRole(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm"
                >
                  <option value="USER">User</option>
                  <option value="IMPORTER">Importer</option>
                  <option value="EXPORTER">Exporter</option>
                  <option value="SUPPLIER">Dealer (Supplier)</option>
                  <option value="CONSUMER">Consumer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setRoleChangeModal(null)}
                  className="flex-1 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted border border-border rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleAction(roleChangeModal.userId, "changeRole", { role: selectedNewRole });
                    setRoleChangeModal(null);
                  }}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-md hover:bg-primary/90 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                <Trash2 className="w-5 h-5" /> Delete User
              </h3>
              <button onClick={() => setDeleteConfirmModal(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm text-foreground font-medium">
                Are you sure you want to delete <span className="font-bold">{deleteConfirmModal.name || "this user"}</span>?
              </p>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border/50">
                This action is permanent and will remove all their data from the system.
              </p>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmModal(null)}
                  className="flex-1 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted border border-border rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleAction(deleteConfirmModal.userId, "delete");
                    setDeleteConfirmModal(null);
                  }}
                  className="flex-1 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-red-700 transition-all"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
