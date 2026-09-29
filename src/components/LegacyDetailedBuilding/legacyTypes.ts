export interface ULPINResponse {
  ulpin: string;
  source: 'api' | 'mock';
  metadata: {
    latitude: number;
    longitude: number;
    altitude: number;
    totalArea: number;
    ownerName: string;
    propertyTaxStatus: 'PAID' | 'DUE' | 'PENDING';
    encumbranceStatus: 'CLEAR' | 'ENCUMBERED';
    registrationDate: string;
    surveyPlot?: string;
  };
}
