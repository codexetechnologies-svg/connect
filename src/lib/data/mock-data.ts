export type Supplier = {
  id: string;
  name: string;
  city: string;
  distanceKm: number;
  deliveryRadiusKm: number;
  stock: 'In Stock' | 'Low Stock' | 'Out of Stock';
  price: number;
  gst: number;
  scheme: string;
  lastUpdated: string;
  verified: boolean;
  brand: string;
  pack: string;
  coordinates: {
    lat: number;
    lng: number;
  };
};

export const searchResults: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Astra Pharma Distributors',
    city: 'Madurai',
    distanceKm: 4.2,
    deliveryRadiusKm: 18,
    stock: 'In Stock',
    price: 18.4,
    gst: 12,
    scheme: '10+1',
    lastUpdated: '2026-11-17T11:45:00',
    verified: true,
    brand: 'Cipla',
    pack: 'Strip of 10',
    coordinates: { lat: 9.939, lng: 78.1445 }
  },
  {
    id: 'sup-2',
    name: 'Bharat Labs',
    city: 'Tirunelveli',
    distanceKm: 7.1,
    deliveryRadiusKm: 25,
    stock: 'Low Stock',
    price: 20.1,
    gst: 12,
    scheme: '5% Trade Discount',
    lastUpdated: '2026-11-17T10:15:00',
    verified: true,
    brand: 'Generic',
    pack: 'Strip of 10',
    coordinates: { lat: 8.7139, lng: 77.7567 }
  },
  {
    id: 'sup-3',
    name: 'MediRoute Pvt Ltd',
    city: 'Coimbatore',
    distanceKm: 14.8,
    deliveryRadiusKm: 30,
    stock: 'Out of Stock',
    price: 21.6,
    gst: 18,
    scheme: 'MOQ 250 strips',
    lastUpdated: '2026-11-17T08:00:00',
    verified: false,
    brand: 'Sun Pharma',
    pack: 'Strip of 15',
    coordinates: { lat: 11.0168, lng: 76.9558 }
  }
];

export const revenueTrend = [
  { month: 'Jan', value: 390000 },
  { month: 'Feb', value: 420000 },
  { month: 'Mar', value: 470000 },
  { month: 'Apr', value: 510000 },
  { month: 'May', value: 560000 },
  { month: 'Jun', value: 650000 }
];

export const subscriptionPlans = [
  { tier: 'Basic', skuLimit: 100, fee: 999 },
  { tier: 'Standard', skuLimit: 500, fee: 1999 },
  { tier: 'Professional', skuLimit: 1500, fee: 3999 },
  { tier: 'Enterprise', skuLimit: 5000, fee: 6999 }
];

export const catalogRows = [
  { medicine: 'Paracetamol 650mg', composition: 'Paracetamol', brand: 'Cipla', pack: 'Strip of 10', basePrice: 18.4, stock: 'In Stock' },
  { medicine: 'Amoxicillin 500mg', composition: 'Amoxicillin', brand: 'Generic', pack: 'Strip of 15', basePrice: 64.2, stock: 'Low Stock' },
  { medicine: 'Vitamin B12 Injection', composition: 'Methylcobalamin', brand: 'Sun Pharma', pack: 'Bottle of 30', basePrice: 271, stock: 'In Stock' },
  { medicine: 'Metformin 500mg', composition: 'Metformin', brand: 'Zydus', pack: 'Strip of 15', basePrice: 32.5, stock: 'In Stock' }
];

export const enquiryPipeline = [
  { shop: 'Rathnam Medicals', item: 'Paracetamol 650mg', qty: 200, status: 'New' },
  { shop: 'Velan Clinic', item: 'Amoxicillin 500mg', qty: 120, status: 'Quoted' },
  { shop: 'MGR Pharmacy', item: 'Cefixime 200mg', qty: 300, status: 'Follow-up' }
];
