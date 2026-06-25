import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin } from 'lucide-react';

interface LocationPermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAllow: () => void;
}

export function LocationPermissionModal({ isOpen, onClose, onAllow }: LocationPermissionModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        Enable Location
                    </DialogTitle>
                    <DialogDescription>
                        We need your location to find nearby experts and calculate accurate distances.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Not Now</Button>
                    <Button onClick={onAllow}>Allow Location</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
