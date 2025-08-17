import { create } from "zustand";

type Group = {
  id: string;
  title: string;
};

type Album = {
  id: string;
  title: string;
};


type UploadedImage = {
  uri: string;
  caption?: string;
  group?: Group;
  album?: Album[];
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
