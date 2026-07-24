import { PropertyRepository, PropertyFilterOptions } from "./property.repository";
import { AuditService } from "@/lib/audit/audit.service";
import type { PropertyStatus } from "@/types";

export class PropertyService {
  static async searchProperties(filters: PropertyFilterOptions = {}) {
    return PropertyRepository.search(filters);
  }

  static async getProperty(id: string) {
    return PropertyRepository.findById(id);
  }

  static async createProperty(ownerId: string, payload: any) {
    const status: PropertyStatus = (payload.status ?? "DRAFT").toUpperCase() as PropertyStatus;

    const propertyRecord = {
      ownerId,
      title: payload.title,
      description: payload.description,
      type: (payload.propertyType || payload.type || "HOUSE").toUpperCase(),
      price: Number(payload.price),
      city: payload.city,
      district: payload.district || payload.neighborhood || payload.city,
      address: payload.address || null,
      rooms: Number(payload.rooms || payload.bedrooms || 1),
      bathrooms: Number(payload.bathrooms || 1),
      surface: payload.surface ? Number(payload.surface) : null,
      status,
      images: payload.images || [],
    };

    const newProperty = await PropertyRepository.create(propertyRecord as any);
    return newProperty;
  }

  /**
   * Explicitly submits a DRAFT property to PENDING for admin moderation.
   */
  static async submitPropertyForModeration(id: string, actorId: string) {
    const updated = await PropertyRepository.update(id, { status: "PENDING" as any });
    await AuditService.logAudit(actorId, "ADMIN_ACTION", id);
    return updated;
  }

  static async updateProperty(id: string, updates: any) {
    return PropertyRepository.update(id, updates);
  }

  static async deleteProperty(id: string, actorId: string) {
    await PropertyRepository.delete(id);
    await AuditService.logAudit(actorId, "PROPERTY_DELETED", id);
  }
}
