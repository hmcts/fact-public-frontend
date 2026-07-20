import { ServiceCentreDetails } from '../schemas/allLocationDetails';

import { LocationDisplayService } from './LocationDisplayService';

type ServiceCentreAddress = NonNullable<ServiceCentreDetails['serviceCentreAddresses']>[number];
type ServiceCentreAreaOfLawGroup = NonNullable<ServiceCentreDetails['serviceCentreAreasOfLaw']>[number];

export type ServiceCentreViewModel = Omit<
  ServiceCentreDetails,
  'lastUpdatedAt' | 'serviceCentreAddresses' | 'serviceCentreContactDetails' | 'serviceCentreAreasOfLaw'
> & {
  lastUpdatedAt: string;
  serviceCentreAddresses: (ServiceCentreAddress & {
    formattedAddressLines: string[];
    formattedAddressTags: string[];
    directionsUrl: string | null;
  })[];
  serviceCentreContactDetails: NonNullable<ServiceCentreDetails['serviceCentreContactDetails']>;
  serviceCentreAreasOfLaw: (Omit<ServiceCentreAreaOfLawGroup, 'areasOfLaw'> & {
    areasOfLaw: NonNullable<ServiceCentreAreaOfLawGroup['areasOfLaw']>;
  })[];
};

export class ServiceCentreService {
  private readonly locationDisplayService = new LocationDisplayService();

  public formatData(serviceCentre: ServiceCentreDetails, language: string): ServiceCentreViewModel {
    return {
      ...serviceCentre,
      lastUpdatedAt: this.locationDisplayService.formatLastUpdateDate(serviceCentre.lastUpdatedAt, language),
      serviceCentreAddresses: (serviceCentre.serviceCentreAddresses ?? []).map(address => ({
        ...address,
        formattedAddressLines: this.locationDisplayService.buildAddressLines(address),
        formattedAddressTags: [],
        directionsUrl: this.locationDisplayService.buildDirectionsUrl(address),
      })),
      serviceCentreContactDetails: serviceCentre.serviceCentreContactDetails ?? [],
      serviceCentreAreasOfLaw: (serviceCentre.serviceCentreAreasOfLaw ?? []).map(group => ({
        ...group,
        areasOfLaw: group.areasOfLaw ?? [],
      })),
    };
  }
}
