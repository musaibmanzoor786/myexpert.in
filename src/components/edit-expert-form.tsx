import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Camera, User, Phone, MapPin, Briefcase } from 'lucide-react';
import { expertRepository } from '@/services/expert-repository';
import { uploadExpertPhoto } from '@/services/storage-service';
import type { Expert } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ImageCropperModal } from '@/components/image-cropper-modal';

interface EditExpertFormProps {
    expert: Expert;
    onSave: (updatedExpert: Expert) => void;
    onCancel: () => void;
}

export function EditExpertForm({ expert, onSave, onCancel }: EditExpertFormProps) {
    const [formData, setFormData] = useState<Expert>({ ...expert });
    const [loading, setLoading] = useState(false);
    const [photoToCrop, setPhotoToCrop] = useState<string | null>(null);
    const { toast } = useToast();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = () => {
            setPhotoToCrop(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handlePhotoSave = async (croppedBlob: Blob) => {
        setPhotoToCrop(null);
        setLoading(true);
        try {
            const file = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' });
            const url = await uploadExpertPhoto(expert.id, file);
            await expertRepository.updateExpertProfilePicture(expert.id, url);
            setFormData(prev => ({ ...prev, profilePictureUrl: url }));
            toast({ title: 'Photo updated successfully.' });
        } catch(err: any) {
            console.error(err);
            toast({ variant: 'destructive', title: 'Upload failed', description: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await expertRepository.updateExpertData(expert.id, { phone: formData.phone });
            onSave(formData);
            toast({ title: 'Profile updated successfully.' });
        } catch (err) {
            toast({ variant: 'destructive', title: 'Failed to update' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="space-y-6">
            <div className="flex justify-center flex-col items-center gap-4">
                 <div className="relative w-32 h-32 rounded-full bg-slate-100 overflow-hidden border-4 border-white shadow-xl group cursor-pointer">
                    {formData.profilePictureUrl ? (
                        <img src={formData.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-black text-slate-300">{formData.name?.charAt(0) || '?'}</div>
                    )}
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-200">
                        <Camera className="w-8 h-8 text-white mb-1" />
                    </div>
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileSelect}
                    />
                 </div>
                 {formData.profilePictureUrl && (
                     <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={async () => {
                            setLoading(true);
                            await expertRepository.updateExpertProfilePicture(expert.id, "");
                            setFormData(prev => ({ ...prev, profilePictureUrl: "" }));
                            setLoading(false);
                            toast({ title: 'Photo removed.' });
                        }}
                        className="text-red-500 font-bold text-xs"
                     >
                         Remove Photo
                     </Button>
                 )}
            </div>

            {photoToCrop && (
                <ImageCropperModal 
                    imageSrc={photoToCrop}
                    onClose={() => setPhotoToCrop(null)}
                    onSave={handlePhotoSave}
                />
            )}
            
            {/* Ediitable Fields */}
            <div className="space-y-4">
                 <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Phone className="w-4 h-4"/> Phone Number</label>
                     <Input 
                        className="bg-slate-50 border-slate-200 focus-visible:ring-primary h-12"
                        value={formData.phone || ''} 
                        onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                     />
                 </div>

                 {/* Read-Only Fields */}
                 <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-400 flex items-center gap-2"><User className="w-4 h-4"/> Name</label>
                     <Input className="bg-slate-100 border-slate-100 h-10" value={formData.name || ''} readOnly disabled />
                 </div>

                 <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-400 flex items-center gap-2"><Briefcase className="w-4 h-4"/> Service Category</label>
                     <Input className="bg-slate-100 border-slate-100 h-10" value={formData.serviceType || ''} readOnly disabled />
                 </div>
                 
                 <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-400 flex items-center gap-2"><MapPin className="w-4 h-4"/> Location</label>
                     <Input className="bg-slate-100 border-slate-100 h-10" value={formData.location || ''} readOnly disabled />
                 </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={onCancel} className="font-semibold text-slate-600 hover:bg-slate-100">Cancel</Button>
                <Button type="submit" disabled={loading} className="font-bold shadow-md px-8">
                    {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : 'Save Changes'}
                </Button>
            </div>
        </form>
    );
}
