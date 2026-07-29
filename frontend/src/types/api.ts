export interface GameCase {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
}

export interface AdminGameCase extends GameCase {
  active: boolean;
}

export interface CaseItem {
  itemId: number;
  name: string;
  imageUrl: string;
  price: number;
  weight: number;
}

export interface GameCaseDetails extends GameCase {
  active: boolean;
  items: CaseItem[];
}

export interface OpenCaseResponse {
  inventoryItemId?: number;
  itemId: number;
  name: string;
  imageUrl: string;
  price: number;
}

export interface LoginResponse {
  token: string;
}

export interface RegisterResponse {
  userId: number;
}

export interface UserResponse {
  id: number;
  email: string;
  role: "USER" | "ADMIN";
}

export interface WalletResponse {
  id: number;
  balance: number;
}

export interface InventoryItemResponse {
  id: number;
  item_id: number;
}

export interface ItemResponse {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
}

export interface StorePurchaseResponse {
  inventoryItemId: number;
  itemId: number;
  name: string;
  imageUrl: string;
  price: number;
  balance: number;
}

export interface SellInventoryItemResponse {
  inventoryItemId: number;
  itemId: number;
  creditedAmount: number;
  balance: number;
}

export interface UpgradeResponse {
  success: boolean;
  chancePercent: number;
  rollPercent: number;
  sourceInventoryItemIds: number[];
  sourceItemIds: number[];
  targetItemId: number;
  rewardInventoryItemId: number | null;
  sourcePrice: number;
  targetPrice: number;
}

export interface ImageUploadResponse {
  url: string;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}
