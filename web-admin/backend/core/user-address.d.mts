export declare function verifiedUserAddress(
  raw: string,
  geocode: (address: string, hint?: {latitude:number;longitude:number}) => Promise<{latitude:number;longitude:number}>,
  hint?: {latitude:number;longitude:number}
): Promise<{address:string;latitude:number;longitude:number}>;
