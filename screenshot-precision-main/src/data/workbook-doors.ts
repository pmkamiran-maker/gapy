import records from "./workbook-doors.json";

export type DoorKind = "wood" | "steel";

export interface DoorVariant {
  row: number;
  height: number;
  width: number;
  price50: number;
  namedWidth?: number;
  namedSize?: string;
  opening?: string;
  listedLength?: number;
}

export interface WorkbookDoor {
  id: string;
  model: string;
  detail: string;
  kind: DoorKind;
  asset: string;
  variants: DoorVariant[];
}

export const workbookDoors = records as WorkbookDoor[];

export function workbookDoorImage(door: WorkbookDoor) {
  return `/catalog-doors/${door.asset}.webp`;
}
