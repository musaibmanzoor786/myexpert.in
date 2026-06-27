'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Search, X, Flame, ShieldAlert, Zap, Droplets, Hammer, 
    PaintRoller, ChefHat, Heart, Camera, ChevronRight 
} from 'lucide-react';
import { servicesList } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function SearchInterface() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved));
            } catch (e) {
                setRecentSearches([]);
            }
        }
    }, []);

    const saveRecentSearches = (searches: string[]) => {
        setRecentSearches(searches);
        localStorage.setItem('recentSearches', JSON.stringify(searches));
    };

    const removeRecentSearch = (e: React.MouseEvent, term: string) => {
        e.stopPropagation();
        const updated = recentSearches.filter(t => t !== term);
        saveRecentSearches(updated);
    };

    const clearAllRecentSearches = () => {
        saveRecentSearches([]);
    };

    const handleSearchSubmit = (term: string) => {
        if (!term.trim()) return;
        const matchingService = servicesList.find(s => 
            s.name.toLowerCase().includes(term.toLowerCase())
        );
        const redirectService = matchingService ? matchingService.name : 'Plumber'; // default fallback
        
        const updated = [
            term,
            ...recentSearches.filter(t => t !== term)
        ].slice(0, 5);
        
        saveRecentSearches(updated);
        router.push(`/search?service=${encodeURIComponent(redirectService)}&query=${encodeURIComponent(term)}`);
    };

    const handleServiceClick = (serviceName: string) => {
        const updated = [
            serviceName,
            ...recentSearches.filter(t => t !== serviceName)
        ].slice(0, 5);
        saveRecentSearches(updated);
        router.push(`/search?service=${encodeURIComponent(serviceName)}`);
    };

    const filteredServices = servicesList.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.tagline || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Urban Company style highly requested shortcuts mapping directly to categories and problem flows
    const highlyRequestedShortcuts = [
        { name: 'Short Circuit', service: 'Electrician', icon: Zap, bg: 'bg-amber-500/10 text-amber-600 border-amber-500/10' },
        { name: 'Water Leakage', service: 'Plumber', icon: Droplets, bg: 'bg-blue-500/10 text-blue-600 border-blue-500/10' },
        { name: 'Lock Broken', service: 'Carpenter', icon: Hammer, bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/10' },
        { name: 'Wall Design', service: 'Painter', icon: PaintRoller, bg: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/10' },
        { name: 'Kashmiri Food', service: 'Cook', icon: ChefHat, bg: 'bg-orange-500/10 text-orange-600 border-orange-500/10' },
        { name: 'Bridal Mehendi', service: 'Mehendi Artist', icon: Heart, bg: 'bg-red-500/10 text-red-600 border-red-500/10' },
        { name: 'Wedding Shoot', service: 'Photographer', icon: Camera, bg: 'bg-sky-500/10 text-sky-600 border-sky-500/10' },
    ];

    return (
        <div className="w-full flex-grow flex flex-col bg-slate-50 min-h-[85vh] pt-3 animate-in fade-in duration-500">
            
            {/* STICKY SEARCH HEADER: Native premium Uber-style */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md pb-4 pt-1 px-4 border-b border-slate-100 shadow-sm">
                <div className="relative flex items-center w-full max-w-2xl mx-auto">
                    <Search className="absolute left-4 w-5 h-5 text-primary opacity-60" />
                    <input
                        type="text"
                        placeholder="Search for services, repairs, or experts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(searchQuery)}
                        className="w-full h-12 bg-slate-100 rounded-2xl pl-12 pr-12 text-sm outline-none border border-transparent focus:border-primary/20 focus:bg-white transition-all font-bold placeholder:text-slate-400"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')} 
                            className="absolute right-4 p-1 rounded-full bg-slate-200/60 active:scale-90"
                        >
                            <X className="w-4 h-4 text-slate-500" />
                        </button>
                    )}
                </div>
            </div>

            {/* CORE DISCOVERY AREA */}
            <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 space-y-8">
                
                {searchQuery.length === 0 ? (
                    <>
                        {/* RECENT SEARCHES PANEL */}
                        {recentSearches.length > 0 && (
                            <div className="bg-white rounded-[2rem] p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] border border-slate-100/60 animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                                        Recent Searches
                                    </h3>
                                    <button 
                                        onClick={clearAllRecentSearches} 
                                        className="text-xs font-black text-primary hover:text-primary-hover active:scale-95"
                                    >
                                        Clear All
                                    </button>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {recentSearches.map(term => (
                                        <div 
                                            key={term} 
                                            onClick={() => handleSearchSubmit(term)}
                                            className="flex items-center justify-between py-3 cursor-pointer group hover:bg-slate-50/50 -mx-2 px-2 rounded-xl transition-colors"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                                                <span className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">
                                                    {term}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={(e) => removeRecentSearch(e, term)}
                                                className="p-1 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors active:scale-90"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* URGENT / HIGHLY REQUESTED SHORTCUTS */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Flame className="w-4 h-4 text-orange-500 fill-current animate-pulse" />
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">
                                    Highly Requested Shortcuts
                                </h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {highlyRequestedShortcuts.map((shortcut) => (
                                    <button
                                        key={shortcut.name}
                                        onClick={() => handleServiceClick(shortcut.service)}
                                        className={cn(
                                            "flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-primary/20 active:scale-95 text-left group"
                                        )}
                                    >
                                        <div className={cn("p-2 rounded-xl border shrink-0 group-hover:scale-105 transition-transform", shortcut.bg)}>
                                            <shortcut.icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-bold text-slate-800 leading-tight">
                                                {shortcut.name}
                                            </span>
                                            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5 mt-1">
                                                {shortcut.service}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>


                    </>
                ) : (
                    /* DYNAMIC AC-SEARCH RESULTS WITH AUTO-MATCHED TYPING PATHS */
                    <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 space-y-2">
                        {filteredServices.length > 0 ? (
                            filteredServices.map(service => (
                                <button
                                    key={service.name}
                                    onClick={() => handleServiceClick(service.name)}
                                    className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-100"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="p-2.5 bg-primary/5 rounded-xl text-primary">
                                            <service.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col items-start leading-none gap-1.5">
                                            <span className="text-sm font-black text-slate-800">
                                                {service.name}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                {service.tagline}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-12 text-slate-400 font-bold text-sm">
                                <ShieldAlert className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                                No results found for "{searchQuery}"
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
