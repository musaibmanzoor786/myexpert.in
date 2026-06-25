import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';

export const uploadExpertPhoto = async (expertId: string, file: File): Promise<string> => {
  if (!app) throw new Error("Firebase not initialized");
  const auth = getAuth(app);
  if (!auth.currentUser) throw new Error("Not authenticated");

  const storage = getStorage(app);
  const ext = file.name?.split('.').pop();
  
  // Upload to the admin's folder to respect existing storage.rules 
  // which only allows write if auth.uid == userId in the path
  const fileRef = ref(storage, `experts/${auth.currentUser.uid}/profile_${expertId}_${Date.now()}.${ext}`);
  
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
};
