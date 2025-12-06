export interface ItemMaster {
    id: string;
    sku: string;
    name: string;
    description?: string;
    category: string;
    unitOfMeasure: string;
    weight?: number;
    unitCost: number;
    sellingPrice?: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface InventoryItem {
    id: string;
    quantity: number;
    itemMasterId: string;
    warehouseId: string;
    binId?: string;
    itemMaster?: ItemMaster;
}

export interface Warehouse {
    id: string;
    code: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Bin {
    id: string;
    code: string;
    name: string;
    row: number;
    column: number;
    level: number;
    maxCapacity: number;
    currentQty: number;
    active: boolean;
    warehouseId: string;
}

export type MovementType =
    | 'INBOUND'
    | 'OUTBOUND'
    | 'TRANSFER'
    | 'ADJUSTMENT'
    | 'RETURN'
    | 'DAMAGE';
export type MovementStatus =
    | 'PENDING'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED';

export interface Movement {
    id: string;
    referenceNo: string;
    type: MovementType;
    quantity: number;
    status: MovementStatus;
    notes?: string;
    itemId: string;
    warehouseId: string;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
}
