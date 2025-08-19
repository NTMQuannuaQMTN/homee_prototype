import { create } from "zustand";


type UploadedImage = {
  uri: string;
  caption?: string;
};

type ImageStoreState = {
  images: UploadedImage[];
  addImage: (image: UploadedImage) => void;
  removeImage: (uri: string) => void;
  clearImages: () => void;
  setImages: (images: UploadedImage[]) => void;
};

export const useImageStore = create<ImageStoreState>((set, get) => ({
  images: [],
  addImage: (image) => set((state) => ({ images: [...state.images, image] })),
  removeImage: (uri) =>
    set((state) => ({
      images: state.images.filter((img) => img.uri !== uri),
    })),
  clearImages: () => set({ images: [] }),
  setImages: (images) => set({ images }),
}));
