export interface CourtRegion {
  name: string;
  country: string;
}

export interface CourtCode {
  magistrateCourtCode: number | null;
  familyCourtCode: number | null;
  tribunalCode: number | null;
  countyCourtCode: number | null;
  crownCourtCode: number | null;
  gbs: string | null;
}

export interface CourtDxCode {
  dxCode: string;
  explanation: string | null;
}

export interface CourtFaxNumber {
  faxNumber: string;
  description: string | null;
}

export interface CourtProfessionalInformation {
  interviewRooms: boolean;
  interviewRoomCount: number | null;
  interviewPhoneNumber: string | null;
  videoHearings: boolean;
  commonPlatform: boolean;
  accessScheme: boolean;
}

export interface AreaOfLaw {
  name: string;
  nameCy: string;
  externalLink: string | null;
  externalLinkCy: string | null;
  displayName: string | null;
  displayNameCy: string | null;
}

export interface CourtAreasOfLaw {
  areasOfLaw: AreaOfLaw[];
}

export interface Court {
  id: string;
  name: string;
  slug: string;
  open: boolean;
  warningNotice: string | null;
  lastUpdatedAt: string;
  openOnCath: boolean | null;
  mrdId: string | null;
  region: CourtRegion;
  courtDxCodes: CourtDxCode[];
  courtCodes: CourtCode[];
  courtFaxNumbers: CourtFaxNumber[];
  courtAddresses: CourtAddress[];
  courtOpeningHours: CourtOpeningHour[];
  courtCounterServiceOpeningHours: CourtCounterServiceOpeningHour[];
  courtContactDetails: CourtContactDetail[];
  courtTranslations: CourtTranslation[];
  courtAccessibilityOptions: CourtAccessibilityOption[];
  courtFacilities: CourtFacilities[];
  courtProfessionalInformation: CourtProfessionalInformation[];
  courtAreasOfLaw: CourtAreasOfLaw[];
}

export interface CourtFacilities {
  parking: boolean;
  freeWaterDispensers: boolean;
  snackVendingMachines: boolean;
  drinkVendingMachines: boolean;
  cafeteria: boolean;
  waitingArea: boolean;
  waitingAreaChildren: boolean;
  quietRoom: boolean;
  babyChanging: boolean;
  wifi: boolean;
}

export interface CourtTranslation {
  email: string;
  phoneNumber: string;
}

export interface CourtContactDescription {
  name: string;
  nameCy: string;
}

export interface CourtContactDetail {
  courtContactDescriptionId: string;
  explanation: string;
  explanationCy: string;
  email: string;
  phoneNumber: string;
  courtContactDescription: CourtContactDescription;
}

export interface CourtCounterServiceOpeningHour {
  counterService: boolean;
  assistWithForms: boolean;
  assistWithDocuments: boolean;
  assistWithSupport: boolean;
  appointmentNeeded: boolean;
  appointmentContact: string;
  dayOfWeek: string;
  openingHour: string;
  closingHour: string;
}

export interface OpeningHourType {
  name: string;
  nameCy: string;
}

export interface CourtOpeningHour {
  dayOfWeek: string;
  openingHour: string;
  closingHour: string;
  openingHourType: OpeningHourType;
}

export type CourtAddressType = 'VISIT_US' | 'WRITE_TO_US' | 'VISIT_OR_CONTACT_US';

export interface CourtType {
  name: string;
}

export interface CourtAddress {
  addressLine1: string;
  addressLine2: string | null;
  townCity: string;
  county: string | null;
  postcode: string;
  epimId: string | null;
  lat: number | null;
  lon: number | null;
  addressType: CourtAddressType;
  areasOfLaw: AreaOfLaw[];
  courtTypes: CourtType[];
}

export type HearingEnhancementEquipment =
  | 'INFRARED_SYSTEMS_AND_HEARING_LOOP_SYSTEMS'
  | 'INFRARED_SYSTEMS'
  | 'HEARING_LOOP_SYSTEMS';

export interface CourtAccessibilityOption {
  accessibleParking: boolean;
  accessibleParkingPhoneNumber: string;
  accessibleToiletDescription: string | null;
  accessibleToiletDescriptionCy: string | null;
  accessibleEntrance: boolean;
  accessibleEntrancePhoneNumber: string;
  hearingEnhancementEquipment: HearingEnhancementEquipment;
  lift: boolean;
  liftDoorWidth: number | null;
  liftDoorLimit: number | null;
  quietRoom: boolean;
}
