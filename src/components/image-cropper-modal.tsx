import React, { useState, useCallback } from 'react';
import Cropper, { Point, Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getCroppedImg } from '@/lib/crop-image';

interface ImageCropperModalProps {
    imageSrc: string;
    onClose: () => void;
    onSave: (croppedBlob: Blob) => void;
}

export function ImageCropperModal({ imageSrc, onClose, onSave }: ImageCropperModalProps) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!croppedAreaPixels) return;
        const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
        if (croppedBlob) {
            onSave(croppedBlob);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Edit Profile Photo</DialogTitle>
                </DialogHeader>
                <div className="relative h-80 w-full bg-slate-100 rounded-md overflow-hidden">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
