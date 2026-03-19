import { Timestamp } from 'firebase/firestore';

export interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  price?: number;
  mainPhoto: string;
  additionalPhotos?: string[];
  isSold: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Settings {
  siteTitle: string;
  siteSubtitle: string;
}

export type Category = 'Eletrônicos' | 'Informática' | 'Câmeras' | 'Outros';

export const CATEGORIES: Category[] = ['Eletrônicos', 'Informática', 'Câmeras', 'Outros'];
