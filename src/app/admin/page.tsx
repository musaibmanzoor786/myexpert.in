'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { 
    getAdminStats, 
    getPendingExperts, 
    getAllExperts, 
    getAllCustomers, 
    getAllBookings,
    approveExpert,
    rejectExpert,
    deleteExpert,
    updateExpertAdmin
} from '@/services/admin-service';

import { uploadExpertPhoto } from '@/services/storage-service';
import type { Expert, UserProfile, Booking } from '@/lib/types';
import { 
    Loader2, Users, Briefcase, Calendar, LayoutDashboard, 
    UserCheck, Check, X, Camera, Edit2, CheckCircle, LogOut, ShieldCheck 
} from 'lucide-react';
import { EditExpertForm } from '@/components/edit-expert-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type TabType = 'dashboard' | 'pending' | 'experts' | 'customers' | 'bookings';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState<any>(null);
  const [pendingExperts, setPending] = useState<Expert[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [lastPendingDoc, setLastPendingDoc] = useState<any>(null);
  const [lastExpertDoc, setLastExpertDoc] = useState<any>(null);
  const [lastCustomerDoc, setLastCustomerDoc] = useState<any>(null);
  const [lastBookingDoc, setLastBookingDoc] = useState<any>(null);

  const [hasMorePending, setHasMorePending] = useState(true);
  const [hasMoreExperts, setHasMoreExperts] = useState(true);
  const [hasMoreCustomers, setHasMoreCustomers] = useState(true);
  const [hasMoreBookings, setHasMoreBookings] = useState(true);

  const [loadingMore, setLoadingMore] = useState(false);

  const [editingExpert, setEditingExpert] = useState<Expert | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Search and Filter State
  const [expertSearch, setExpertSearch] = useState('');
  const [expertStatusFilter, setExpertStatusFilter] = useState<'all' | 'online' | 'offline' | 'busy'>('all');
  
  const [customerSearch, setCustomerSearch] = useState('');
  
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'rejected'>('all');

  useEffect(() => {
    if (!user) {
        const timer = setTimeout(() => {
            if (!user) router.replace('/');
        }, 2000);
        return () => clearTimeout(timer);
    }
    
    if (user.email !== 'suhaibmanzoormugloo13@gmail.com') {
      router.replace('/');
      return;
    }
    
    loadData(activeTab);
  }, [user, activeTab, router]);

  const performLogout = async () => {
    await logout();
    router.push('/login');
  };

  const loadData = async (tab: TabType) => {
    setLoading(true);
    try {
      if (tab === 'dashboard') {
          setStats(await getAdminStats());
      } else if (tab === 'pending') {
          const res = await getPendingExperts();
          setPending(res.data);
          setLastPendingDoc(res.lastDoc);
          setHasMorePending(res.data.length === 3);
      } else if (tab === 'experts') {
          const res = await getAllExperts();
          setExperts(res.data);
          setLastExpertDoc(res.lastDoc);
          setHasMoreExperts(res.data.length === 3);
      } else if (tab === 'customers') {
          const res = await getAllCustomers();
          setCustomers(res.data);
          setLastCustomerDoc(res.lastDoc);
          setHasMoreCustomers(res.data.length === 3);
      } else if (tab === 'bookings') {
          const res = await getAllBookings();
          setBookings(res.data);
          setLastBookingDoc(res.lastDoc);
          setHasMoreBookings(res.data.length === 3);
      }
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load data.' });
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
        await Promise.all([
          getAdminStats().then(setStats),
          getPendingExperts().then(res => { setPending(res.data); setLastPendingDoc(res.lastDoc); setHasMorePending(res.data.length === 3); }),
          getAllExperts().then(res => { setExperts(res.data); setLastExpertDoc(res.lastDoc); setHasMoreExperts(res.data.length === 3); }),
          getAllCustomers().then(res => { setCustomers(res.data); setLastCustomerDoc(res.lastDoc); setHasMoreCustomers(res.data.length === 3); }),
          getAllBookings().then(res => { setBookings(res.data); setLastBookingDoc(res.lastDoc); setHasMoreBookings(res.data.length === 3); })
        ]);
    } catch (err) {
        console.error(err);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to refresh data.' });
    } finally {
        setLoading(false);
    }
  };

  const loadMore = async (tab: TabType) => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      if (tab === 'pending' && lastPendingDoc) {
          const res = await getPendingExperts(lastPendingDoc);
          setPending(prev => [...prev, ...res.data]);
          setLastPendingDoc(res.lastDoc);
          setHasMorePending(res.data.length === 3);
      } else if (tab === 'experts' && lastExpertDoc) {
          const res = await getAllExperts(lastExpertDoc);
          setExperts(prev => [...prev, ...res.data]);
          setLastExpertDoc(res.lastDoc);
          setHasMoreExperts(res.data.length === 3);
      } else if (tab === 'customers' && lastCustomerDoc) {
          const res = await getAllCustomers(lastCustomerDoc);
          setCustomers(prev => [...prev, ...res.data]);
          setLastCustomerDoc(res.lastDoc);
          setHasMoreCustomers(res.data.length === 3);
      } else if (tab === 'bookings' && lastBookingDoc) {
          const res = await getAllBookings(lastBookingDoc);
          setBookings(prev => [...prev, ...res.data]);
          setLastBookingDoc(res.lastDoc);
          setHasMoreBookings(res.data.length === 3);
      }
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load more data.' });
    } finally {
      setLoadingMore(false);
    }
  };

  const handleApprove = async (id: string, phone: string) => {
    try {
      await approveExpert(id);
      toast({ title: 'Expert Approved', description: `Approved expert with ID ${id}` });
      loadData(activeTab);
      toast({ description: `SMS Sent to ${phone}: "Your MyExpert profile has been approved..."` });
    } catch(e) {
      toast({ variant: 'destructive', title: 'Failed to approve' });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectExpert(id);
      toast({ title: 'Expert Rejected' });
      loadData(activeTab);
    } catch(e) {
      toast({ variant: 'destructive', title: 'Failed to reject' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpert(id);
      toast({ title: 'Expert Deleted Forever' });
      loadData(activeTab);
    } catch(e) {
      toast({ variant: 'destructive', title: 'Failed to delete' });
    }
  };

  const handleSaveExpert = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingExpert) return;
      setEditLoading(true);
      try {
          await updateExpertAdmin(editingExpert.id, {
              phone: editingExpert.phone,
              location: editingExpert.location,
              area: editingExpert.location,
              serviceType: editingExpert.serviceType,
              bio: editingExpert.bio,
          });
          toast({ title: 'Expert profile updated.' });
          setEditingExpert(null);
          loadData(activeTab);
      } catch (err) {
          toast({ variant: 'destructive', title: 'Failed to update expert' });
      } finally {
          setEditLoading(false);
      }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editingExpert) return;
      
      setEditLoading(true);
      try {
          const url = await uploadExpertPhoto(editingExpert.id, file);
          await updateExpertAdmin(editingExpert.id, { profilePictureUrl: url });
          setEditingExpert(prev => prev ? { ...prev, profilePictureUrl: url } : null);
          toast({ title: 'Photo updated successfully.' });
          loadData(activeTab);
      } catch(err: any) {
          console.error(err);
          toast({ variant: 'destructive', title: 'Upload failed', description: err.message });
      } finally {
          setEditLoading(false);
      }
  };

  if (!user || user.email !== 'suhaibmanzoormugloo13@gmail.com') {
      return <div className="h-screen w-full flex justify-center items-center bg-gray-50"><Loader2 className="animate-spin w-10 h-10 text-primary" /></div>;
  }

  const renderDashboard = () => (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-6 animate-in fade-in zoom-in-95 duration-300">
        <StatCard title="Total Experts" value={stats?.totalExperts || 0} icon={Users} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="Online Experts" value={stats?.onlineExperts || 0} icon={CheckCircle} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard title="Busy Experts" value={stats?.busyExperts || 0} icon={Briefcase} color="text-amber-600" bg="bg-amber-50" />
        <StatCard title="Pending Experts" value={stats?.pendingExperts || 0} icon={UserCheck} color="text-purple-600" bg="bg-purple-50" />
        <StatCard title="Total Customers" value={stats?.totalCustomers || 0} icon={Users} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard title="Today's Bookings" value={stats?.todaysBookings || 0} icon={Calendar} color="text-pink-600" bg="bg-pink-50" />
    </div>
  );

  const renderPending = () => (
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
          <div className="overflow-x-auto w-full">
            <Table className="w-full">
                <TableHeader className="bg-gray-50/50">
                    <TableRow>
                        <TableHead className="py-4 font-semibold text-slate-600">Expert Info</TableHead>
                        <TableHead className="py-4 font-semibold text-slate-600">Service</TableHead>
                        <TableHead className="py-4 font-semibold text-slate-600">City</TableHead>
                        <TableHead className="py-4 font-semibold text-slate-600">Signup Date</TableHead>
                        <TableHead className="py-4 font-semibold text-slate-600 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? <TableSkeleton /> : pendingExperts.length === 0 ? <EmptyRow cols={5} text="No pending experts currently." /> : pendingExperts.map(expert => (
                        <TableRow key={expert.id} className="hover:bg-gray-50/50 transition-colors group">
                            <TableCell className="py-4">
                                <div className="font-bold text-slate-900">{expert.name}</div>
                                <div className="text-sm text-slate-500 font-medium mt-0.5">{expert.phone}</div>
                            </TableCell>
                            <TableCell className="py-4 font-medium text-slate-700">{expert.serviceType}</TableCell>
                            <TableCell className="py-4 text-slate-600">{expert.location}</TableCell>
                            <TableCell className="py-4 text-slate-600">
                                <Badge variant="outline" className="bg-slate-50">{(expert as any).lastSeen ? 'Recently' : 'Unknown'}</Badge>
                            </TableCell>
                            <TableCell className="py-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" onClick={() => handleApprove(expert.id, expert.phone || '')} className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm">
                                        <Check className="w-4 h-4 mr-1.5" /> Approve
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => handleReject(expert.id)} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                                        Reject
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleDelete(expert.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50">
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </div>
          {!loading && hasMorePending && pendingExperts.length > 0 && (
              <div className="p-4 flex justify-center border-t border-slate-100 bg-gray-50/30">
                  <Button variant="outline" onClick={() => loadMore('pending')} disabled={loadingMore} className="bg-white shadow-sm rounded-full px-6">
                      {loadingMore ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Load More Experts'}
                  </Button>
              </div>
          )}
      </Card>
  );

  const getStatusBadge = (expert: Expert) => {
    switch (expert.status) {
        case 'busy': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none px-3 py-1 shadow-none font-semibold">Busy</Badge>;
        case 'online': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none px-3 py-1 shadow-none font-semibold">Online</Badge>;
        case 'offline':
        default: return <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none px-3 py-1 shadow-none font-medium">Offline</Badge>;
    }
  };

  const renderExperts = () => (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col md:flex-row gap-4 w-full">
            <Input 
                placeholder="Search by name or UID..." 
                className="md:max-w-xs"
                value={expertSearch}
                onChange={(e) => setExpertSearch(e.target.value)}
            />
            <select 
                className="md:max-w-xs bg-white border border-slate-200 px-3 py-2 rounded-md text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                value={expertStatusFilter}
                onChange={(e) => setExpertStatusFilter(e.target.value as any)}
            >
                <option value="all">All Status</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="busy">Busy</option>
            </select>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <Table className="w-full">
            <TableHeader className="bg-gray-50/50">
            <TableRow>
                <TableHead className="py-4 font-semibold text-slate-600 w-24">ID</TableHead>
                <TableHead className="py-4 font-semibold text-slate-600">Expert Profile</TableHead>
                <TableHead className="py-4 font-semibold text-slate-600">Service & Location</TableHead>
                <TableHead className="py-4 font-semibold text-slate-600">Current Status</TableHead>
                <TableHead className="py-4 font-semibold text-slate-600 text-right">Actions</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {loading ? <TableSkeleton /> : (() => {
                const filteredExperts = experts.filter(e => {
                    const matchesSearch = e.name.toLowerCase().includes(expertSearch.toLowerCase()) || 
                                          e.id.toLowerCase().includes(expertSearch.toLowerCase());
                    
                    let matchesStatus = true;
                    if (expertStatusFilter !== 'all') {
                        if (expertStatusFilter === 'online') matchesStatus = !!e.online && !e.workingNow;
                        else if (expertStatusFilter === 'offline') matchesStatus = !e.online;
                        else if (expertStatusFilter === 'busy') matchesStatus = !!e.workingNow;
                    }
                    
                    return e.isVerified !== false && matchesSearch && matchesStatus;
                });
                
                return filteredExperts.length === 0 ? <EmptyRow cols={5} text="No approved experts found." /> : filteredExperts.map(expert => (
                <TableRow key={expert.id} className="hover:bg-gray-50/50 transition-colors">
                <TableCell className="py-4 font-mono text-xs text-slate-400 truncate max-w-[100px]">{expert.id}</TableCell>
                <TableCell className="py-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200 shadow-sm">
                            {expert.profilePictureUrl ? (
                                <img src={expert.profilePictureUrl} alt={expert.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-lg">{expert.name?.charAt(0) || '?'}</span>
                            )}
                        </div>
                        <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2 text-base">
                                {expert.name} 
                                {expert.isVerified && <ShieldCheck className="w-4 h-4 text-blue-500" />}
                            </div>
                            <div className="text-sm font-medium text-slate-500 mt-0.5">{expert.phone}</div>
                        </div>
                    </div>
                </TableCell>
                <TableCell className="py-4">
                    <div className="font-semibold text-slate-800">{expert.serviceType}</div>
                    <div className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                        {expert.location}
                    </div>
                </TableCell>
                <TableCell className="py-4">
                    {getStatusBadge(expert)}
                </TableCell>
                <TableCell className="py-4 text-right">
                    <Button size="sm" variant="outline" onClick={() => setEditingExpert(expert)} className="hover:bg-slate-100 text-slate-700 font-medium shadow-sm">
                        <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
                    </Button>
                </TableCell>
                </TableRow>
            ));
            })()}
            </TableBody>
        </Table>
      </div>
      {!loading && hasMoreExperts && experts.length > 0 && (
          <div className="p-4 flex justify-center border-t border-slate-100 bg-gray-50/30">
              <Button variant="outline" onClick={() => loadMore('experts')} disabled={loadingMore} className="bg-white shadow-sm rounded-full px-6">
                  {loadingMore ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Load More Experts'}
              </Button>
          </div>
      )}
    </Card>
  );

  const renderCustomers = () => (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      <div className="p-4 border-b border-slate-100">
        <Input 
            placeholder="Search by name or UID..." 
            className="md:max-w-xs"
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto w-full">
        <Table className="w-full">
            <TableHeader className="bg-gray-50/50">
            <TableRow>
                <TableHead className="py-4 font-semibold text-slate-600">UID</TableHead>
                <TableHead className="py-4 font-semibold text-slate-600">Full Name</TableHead>
                <TableHead className="py-4 font-semibold text-slate-600">Phone Number</TableHead>
                <TableHead className="py-4 font-semibold text-slate-600">Location</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {loading ? <TableSkeleton /> : customers
                .filter(c => c.fullName.toLowerCase().includes(customerSearch.toLowerCase()) || c.uid.toLowerCase().includes(customerSearch.toLowerCase()))
                .length === 0 ? <EmptyRow cols={4} text="No customers found." /> : customers
                .filter(c => c.fullName.toLowerCase().includes(customerSearch.toLowerCase()) || c.uid.toLowerCase().includes(customerSearch.toLowerCase()))
                .map(c => (
                <TableRow key={c.uid} className="hover:bg-gray-50/50 transition-colors">
                <TableCell className="py-4 font-mono text-xs text-slate-400 truncate max-w-[120px]">{c.uid}</TableCell>
                <TableCell className="py-4 font-bold text-slate-900">{c.fullName}</TableCell>
                <TableCell className="py-4 font-medium text-slate-600">{c.phone}</TableCell>
                <TableCell className="py-4 text-slate-600">
                    <Badge variant="outline" className="bg-slate-50 font-normal">{c.location || 'Not Specified'}</Badge>
                </TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
      </div>
      {!loading && hasMoreCustomers && customers.length > 0 && (
          <div className="p-4 flex justify-center border-t border-slate-100 bg-gray-50/30">
              <Button variant="outline" onClick={() => loadMore('customers')} disabled={loadingMore} className="bg-white shadow-sm rounded-full px-6">
                  {loadingMore ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Load More Customers'}
              </Button>
          </div>
      )}
    </Card>
  );

  const renderBookings = () => {
    const filteredBookings = bookings.filter(b => {
        const matchesSearch = b.userName.toLowerCase().includes(bookingSearch.toLowerCase()) || 
                              b.expertName.toLowerCase().includes(bookingSearch.toLowerCase()) || 
                              b.id.toLowerCase().includes(bookingSearch.toLowerCase());
        const matchesStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;
        return matchesSearch && matchesStatus;
    });

    const todayStr = new Date().toDateString();
    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const todays = filteredBookings.filter(b => b.createdAt.toDate().toDateString() === todayStr);
    const yesterdays = filteredBookings.filter(b => b.createdAt.toDate().toDateString() === yesterdayStr);
    const others = filteredBookings.filter(b => b.createdAt.toDate().toDateString() !== todayStr && b.createdAt.toDate().toDateString() !== yesterdayStr);

    const renderRows = (list: Booking[], title: string) => (
        <>
            {list.length > 0 && (
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-y-2 border-slate-100">
                    <TableCell colSpan={9} className="py-3 font-bold text-slate-800 text-sm tracking-wide uppercase">{title} <span className="text-slate-400 ml-2 font-medium">({list.length})</span></TableCell>
                </TableRow>
            )}
            {list.map(b => (
                <TableRow key={b.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="py-4 font-mono text-xs text-slate-400 max-w-[100px] truncate">{b.id}</TableCell>
                  <TableCell className="py-4">
                    <div className="font-bold text-slate-900">{b.userName}</div>
                    <div className="text-sm font-medium text-slate-500 mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span> 
                        Expert: <span className="text-slate-700">{b.expertName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 font-medium text-slate-600">{b.expertPhone || 'N/A'}</TableCell>
                  <TableCell className="py-4 font-medium text-slate-600">{b.userPhone || 'N/A'}</TableCell>
                  <TableCell className="py-4 font-medium text-slate-600">{b.userArea || 'N/A'}</TableCell>
                  <TableCell className="py-4 font-medium text-slate-600">{(b as any).expertArea || 'N/A'}</TableCell>
                  <TableCell className="py-4 font-semibold text-slate-800">{b.service}</TableCell>
                  <TableCell className="py-4">
                    <Badge variant="outline" className={`font-semibold shadow-sm ${
                        b.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        b.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                        {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 text-right text-sm font-medium text-slate-500">
                    {b.createdAt.toDate().toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </TableCell>
                </TableRow>
            ))}
        </>
    );

    return (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex flex-col md:flex-row gap-4">
                    <Input 
                        placeholder="Search by user, expert, or ID..." 
                        className="md:max-w-xs"
                        value={bookingSearch}
                        onChange={(e) => setBookingSearch(e.target.value)}
                    />
                    <select 
                        className="md:max-w-xs bg-white border border-slate-200 px-3 py-2 rounded-md text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                        value={bookingStatusFilter}
                        onChange={(e) => setBookingStatusFilter(e.target.value as any)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>
            
            <div className="overflow-x-auto w-full">
                <Table className="w-full">
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead className="py-4 font-semibold text-slate-600">Booking ID</TableHead>
                            <TableHead className="py-4 font-semibold text-slate-600">Parties Involved</TableHead>
                            <TableHead className="py-4 font-semibold text-slate-600">Expert Phone</TableHead>
                            <TableHead className="py-4 font-semibold text-slate-600">Customer Phone</TableHead>
                            <TableHead className="py-4 font-semibold text-slate-600">Customer Location</TableHead>
                            <TableHead className="py-4 font-semibold text-slate-600">Expert Location</TableHead>
                            <TableHead className="py-4 font-semibold text-slate-600">Service Required</TableHead>
                            <TableHead className="py-4 font-semibold text-slate-600">Status</TableHead>
                            <TableHead className="py-4 font-semibold text-slate-600 text-right">Date & Time</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? <TableSkeleton /> : filteredBookings.length === 0 ? <EmptyRow cols={6} text="No bookings found." /> : (
                            <>
                                {renderRows(todays, "Today's Bookings")}
                                {renderRows(yesterdays, "Yesterday's Bookings")}
                                {renderRows(others, "Older Bookings")}
                            </>
                        )}
                    </TableBody>
                </Table>
            </div>
            {!loading && hasMoreBookings && bookings.length > 0 && (
                <div className="p-4 flex justify-center border-t border-slate-100 bg-gray-50/30">
                    <Button variant="outline" onClick={() => loadMore('bookings')} disabled={loadingMore} className="bg-white shadow-sm rounded-full px-6">
                        {loadingMore ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Load More Bookings'}
                    </Button>
                </div>
            )}
        </Card>
    );
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans">
       {/* Sidebar - Fixed Width */}
       <aside className="sticky top-0 h-screen w-64 xl:w-72 border-r border-slate-200 bg-white flex-shrink-0 flex flex-col shadow-sm z-20">
           <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-white">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-black shadow-md shadow-primary/20">
                    A
                </div>
                <div>
                    <h1 className="font-bold text-xl tracking-tight text-slate-900 leading-none">Admin<span className="text-primary font-black">Panel</span></h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Superuser</p>
                </div>
           </div>
           <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
               <NavItem icon={LayoutDashboard} label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
               <div className="pt-4 pb-2 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Management</div>
               <NavItem icon={UserCheck} label="Pending Experts" isActive={activeTab === 'pending'} onClick={() => setActiveTab('pending')} badge={pendingExperts.length > 0 ? pendingExperts.length : null} />
               <NavItem icon={Briefcase} label="All Experts" isActive={activeTab === 'experts'} onClick={() => setActiveTab('experts')} />
               <NavItem icon={Users} label="Customers" isActive={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
               <div className="pt-4 pb-2 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Platform</div>
               <NavItem icon={Calendar} label="Bookings" isActive={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} />
           </nav>
           <div className="p-4 border-t border-slate-100 bg-slate-50/50">
               <NavItem icon={LogOut} label="Logout Securely" onClick={() => setIsLogoutDialogOpen(true)} isDanger />
           </div>
       </aside>
       
       {/* Main Content - Fluid Horizon Extension */}
       <main className="flex-1 !min-w-0 w-full !max-w-none px-6 py-8 md:px-8 lg:px-10 overflow-y-auto">
           <div className="w-full !max-w-none space-y-8">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                   <div>
                       <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 capitalize">
                           {activeTab === 'pending' ? 'Pending Experts' : activeTab}
                       </h2>
                       <p className="text-slate-500 font-medium mt-1 text-base">
                           {activeTab === 'dashboard' ? "Here's what's happening on your platform today." : "Manage and monitor your platform's data."}
                       </p>
                   </div>
                   <div className="flex items-center gap-4">
                        {activeTab === 'dashboard' && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={loadAllData} 
                                className="font-bold"
                            >
                                Refresh All Data
                            </Button>
                        )}
                        {activeTab === 'dashboard' && (
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm self-start md:self-auto">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-sm font-semibold text-slate-600">Live Updates Active</span>
                            </div>
                        )}
                   </div>
               </header>
               
               <div className="pb-20 w-full">
                   {activeTab === 'dashboard' && renderDashboard()}
                   {activeTab === 'pending' && renderPending()}
                   {activeTab === 'experts' && renderExperts()}
                   {activeTab === 'customers' && renderCustomers()}
                   {activeTab === 'bookings' && renderBookings()}
               </div>
           </div>
       </main>

       {/* Edit Dialog */}
       <Dialog open={!!editingExpert} onOpenChange={(open) => !open && setEditingExpert(null)}>
           <DialogContent className="max-w-md bg-white rounded-2xl border-slate-200 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-slate-900">Edit Expert Profile</DialogTitle>
                </DialogHeader>
                {editingExpert && (
    <EditExpertForm 
        expert={editingExpert}
        onSave={(updated) => {
            setEditingExpert(null);
            loadData(activeTab);
        }}
        onCancel={() => setEditingExpert(null)}
    />
)}
           </DialogContent>
       </Dialog>

       {/* Logout Dialog */}
       <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
            <AlertDialogContent className="bg-white rounded-2xl border-slate-200">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-bold text-slate-900">End Session?</AlertDialogTitle>
                    <AlertDialogDescription className="text-base text-slate-500 font-medium">
                        You are about to securely log out of the admin console.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6">
                    <AlertDialogCancel className="border-slate-200 text-slate-700 font-semibold hover:bg-slate-50">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={performLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold shadow-md">Yes, Logout</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

// ------ Refined Premium Reusables ------

const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full ${className}`}>
        {children}
    </div>
);

const StatCard = ({ title, value, icon: Icon, color, bg }: any) => (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between group w-full">
        <div className="flex items-start justify-between mb-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bg} group-hover:scale-105 transition-transform duration-300`}>
                <Icon className={`w-7 h-7 ${color}`} strokeWidth={2.5} />
            </div>
        </div>
        <div>
            <div className={`text-4xl font-black text-slate-900 tracking-tight`}>{value}</div>
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-1">{title}</div>
        </div>
    </div>
);

const NavItem = ({ icon: Icon, label, isActive, onClick, badge, isDanger }: any) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all duration-200 ${
            isActive 
            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
            : isDanger 
                ? 'text-slate-500 hover:bg-red-50 hover:text-red-600'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
        }`}
    >
        <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 ${isActive ? 'text-primary-foreground' : isDanger ? 'group-hover:text-red-600' : 'text-slate-400'}`} strokeWidth={isActive ? 2.5 : 2} />
            {label}
        </div>
        {badge !== undefined && badge !== null && (
            <span className={`px-2 py-0.5 rounded-md text-xs font-black ${isActive ? 'bg-white text-primary' : 'bg-primary text-white shadow-sm'}`}>
                {badge}
            </span>
        )}
    </button>
);

const TableSkeleton = () => (
    <TableRow>
        <TableCell colSpan={6} className="h-64 text-center">
            <div className="flex flex-col items-center justify-center text-slate-400 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="font-semibold text-sm animate-pulse">Loading data...</span>
            </div>
        </TableCell>
    </TableRow>
);

const EmptyRow = ({ cols, text }: { cols: number, text: string }) => (
    <TableRow>
        <TableCell colSpan={cols} className="h-64 text-center">
            <div className="flex flex-col items-center justify-center text-slate-400 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-2">
                    <LayoutDashboard className="w-8 h-8 text-slate-300" />
                </div>
                <span className="font-bold text-slate-500 text-lg">{text}</span>
            </div>
        </TableCell>
    </TableRow>
);