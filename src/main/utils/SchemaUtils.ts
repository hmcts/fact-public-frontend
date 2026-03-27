import { DataApiRequests } from '../requests/DataApiRequests';
import { ServiceArea } from '../schemas/ServiceAreaSchema';
import { Service } from '../schemas/ServiceSchema';

const dataApiRequests = new DataApiRequests();

export async function calculateServiceAreaFromSlug(serviceName: string, area: string): Promise<ServiceArea> {
  const result = await dataApiRequests.getServiceAreas(serviceName);
  if (Array.isArray(result)) {
    const serviceArea = result.find(a => a.slug === area);
    if (serviceArea) {
      return serviceArea;
    }
  }
  throw new Error('Service area not found');
}

export async function calculateServiceNameFromSlug(service: string): Promise<string> {
  const services = await dataApiRequests.getAllServices();
  if (Array.isArray(services)) {
    const serviceName = services.find((s: Service) => s.slug === service)?.name;
    if (serviceName) {
      return serviceName;
    }
  }
  throw new Error('Service not found');
}
