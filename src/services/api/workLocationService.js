import { apiClient } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { logger } from '../utils/logger';
import { cache } from '../utils/cache';
import { errorHandler } from '../utils/errorHandler';
import { privacy } from '../utils/privacy';
import { security } from '../utils/security';
import { auditService } from '../utils/auditService';

class WorkLocationService {
  constructor() {
    this.baseEndpoint = 'work-locations';
    this.cachePrefix = 'location_';
    this.cacheTags = ['locations', 'workplaces', 'addresses'];
    this.defaultCacheTTL = 900; // 15 minutes cache for location data
    this.isInitialized = false;

    this.locationTypes = {
      OFFICE: 'office',
      CLINIC: 'clinic',
      HOSPITAL: 'hospital',
      HOME_OFFICE: 'home_office',
      VIRTUAL: 'virtual',
      CLIENT_HOME: 'client_home',
      OUTDOOR: 'outdoor',
      COMMUNITY_CENTER: 'community_center',
      CORPORATE: 'corporate'
    };

    this.accessibilityFeatures = {
      WHEELCHAIR_ACCESSIBLE: 'wheelchair_accessible',
      ELEVATOR_ACCESS: 'elevator_access',
      ACCESSIBLE_PARKING: 'accessible_parking',
      BRAILLE_SIGNAGE: 'braille_signage',
      HEARING_LOOP: 'hearing_loop',
      ACCESSIBLE_RESTROOM: 'accessible_restroom',
      RAMP_ACCESS: 'ramp_access',
      WIDE_DOORWAYS: 'wide_doorways'
    };

    this.amenities = {
      PARKING: 'parking',
      PUBLIC_TRANSPORT: 'public_transport',
      WIFI: 'wifi',
      WAITING_ROOM: 'waiting_room',
      REFRESHMENTS: 'refreshments',
      CHILDCARE: 'childcare',
      SECURITY: 'security',
      AIR_CONDITIONING: 'air_conditioning',
      HEATING: 'heating',
      PRIVACY_ROOMS: 'privacy_rooms'
    };

    this.operatingStatus = {
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      MAINTENANCE: 'maintenance',
      TEMPORARILY_CLOSED: 'temporarily_closed',
      PERMANENTLY_CLOSED: 'permanently_closed'
    };

    this.addressValidationProviders = {
      GOOGLE_MAPS: 'google_maps',
      MAPBOX: 'mapbox',
      HERE_MAPS: 'here_maps',
      OPENCAGE: 'opencage'
    };

    this.roomTypes = {
      CONSULTATION: 'consultation',
      THERAPY: 'therapy',
      GROUP_THERAPY: 'group_therapy',
      ASSESSMENT: 'assessment',
      WAITING: 'waiting',
      RECEPTION: 'reception',
      ADMIN: 'admin',
      STORAGE: 'storage',
      RESTROOM: 'restroom'
    };
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing WorkLocationService');
      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize WorkLocationService', error);
      throw error;
    }
  }

  async createLocation(locationData, options = {}) {
    try {
      const {
        validateAddress = true,
        encryptSensitiveData = true,
        validateAccessibility = true,
        createAuditLog = true,
        setPrimary = false
      } = options;

      logger.info('Creating work location', {
        therapistId: locationData.therapistId,
        locationType: locationData.type,
        name: locationData.name,
        setPrimary
      });

      // Validate required fields
      this.validateLocationData(locationData);

      // Validate address if requested
      if (validateAddress && locationData.address) {
        const addressValidation = await this.validateAddress(locationData.address);
        if (!addressValidation.isValid) {
          throw errorHandler.createValidationError(
            'Address validation failed',
            addressValidation.errors
          );
        }
        locationData.validatedAddress = addressValidation.standardizedAddress;
        locationData.coordinates = addressValidation.coordinates;
      }

      // Validate accessibility compliance
      if (validateAccessibility && locationData.accessibilityFeatures) {
        const accessibilityCheck = this.validateAccessibilityCompliance(locationData);
        if (!accessibilityCheck.isCompliant) {
          logger.warn('Accessibility compliance issues detected', accessibilityCheck.warnings);
        }
      }

      let processedData = {
        ...locationData,
        locationId: security.generateSecureId('loc_'),
        createdAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
        status: this.operatingStatus.ACTIVE,
        version: 1
      };

      // Set as primary if requested or if it's the first location
      if (setPrimary) {
        processedData.isPrimary = true;
      }

      if (encryptSensitiveData) {
        const encryptionKey = await privacy.generateEncryptionKey(
          locationData.therapistId,
          processedData.locationId
        );

        processedData = await privacy.encryptSensitiveData(processedData, encryptionKey);
        processedData._encryptionKeyId = processedData.locationId;
      }

      const sanitizedData = privacy.sanitizeForLogging(processedData);
      logger.info('Creating location with sanitized data', { data: sanitizedData });

      const response = await apiClient.post(
        ENDPOINTS.workLocations.create,
        processedData
      );

      const location = response.data;

      // If setting as primary, update other locations
      if (setPrimary || location.isPrimary) {
        await this.updatePrimaryLocation(locationData.therapistId, location.id);
      }

      this.invalidateCache(['locations', 'workplaces'], locationData.therapistId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'create',
          entityType: 'work_location',
          entityId: location.id,
          action: 'create',
          details: {
            therapistId: locationData.therapistId,
            locationType: locationData.type,
            name: locationData.name,
            isPrimary: location.isPrimary
          },
          userId: locationData.createdBy || locationData.therapistId
        });
      }

      privacy.logDataAccess(
        locationData.therapistId,
        'work_location',
        'create',
        { locationId: location.id }
      );

      logger.info('Work location created successfully', {
        locationId: location.id,
        therapistId: locationData.therapistId
      });

      return location;
    } catch (error) {
      logger.error('Failed to create work location', error);
      throw errorHandler.handle(error);
    }
  }

  async getLocation(locationId, options = {}) {
    try {
      const {
        decryptSensitiveData = true,
        includeSchedule = false,
        includeRooms = false,
        includeStatistics = false
      } = options;

      const cacheKey = `${this.cachePrefix}${locationId}`;
      let location = cache.get(cacheKey);

      if (!location) {
        logger.info('Fetching location from API', { locationId });

        const params = {
          include_schedule: includeSchedule,
          include_rooms: includeRooms,
          include_statistics: includeStatistics
        };

        const response = await apiClient.get(
          ENDPOINTS.workLocations.getById.replace(':id', locationId),
          { params }
        );

        location = response.data;
        cache.set(cacheKey, location, this.defaultCacheTTL, this.cacheTags);
      }

      if (decryptSensitiveData && location._encryptionKeyId) {
        try {
          const encryptionKey = await privacy.generateEncryptionKey(
            location.therapistId,
            location._encryptionKeyId
          );
          location = await privacy.decryptSensitiveData(location, encryptionKey);
        } catch (decryptError) {
          logger.warn('Failed to decrypt location data', {
            locationId,
            error: decryptError.message
          });
        }
      }

      privacy.logDataAccess(
        location.therapistId,
        'work_location',
        'read',
        { locationId }
      );

      return location;
    } catch (error) {
      logger.error('Failed to get location', { locationId, error });
      throw errorHandler.handle(error);
    }
  }

  async updateLocation(locationId, updates, options = {}) {
    try {
      const {
        validateAddress = false,
        encryptSensitiveData = true,
        createAuditLog = true,
        incrementVersion = true
      } = options;

      logger.info('Updating work location', {
        locationId,
        updateKeys: Object.keys(updates)
      });

      const currentLocation = await this.getLocation(locationId, { decryptSensitiveData: false });

      let processedUpdates = { ...updates };

      if (incrementVersion) {
        processedUpdates.version = (currentLocation.version || 1) + 1;
        processedUpdates.lastModifiedAt = new Date().toISOString();
      }

      // Validate address if being updated
      if (validateAddress && updates.address) {
        const addressValidation = await this.validateAddress(updates.address);
        if (!addressValidation.isValid) {
          throw errorHandler.createValidationError(
            'Address validation failed',
            addressValidation.errors
          );
        }
        processedUpdates.validatedAddress = addressValidation.standardizedAddress;
        processedUpdates.coordinates = addressValidation.coordinates;
      }

      // Handle primary location changes
      if (updates.isPrimary === true) {
        await this.updatePrimaryLocation(currentLocation.therapistId, locationId);
      }

      if (encryptSensitiveData) {
        const encryptionKey = await privacy.generateEncryptionKey(
          currentLocation.therapistId,
          currentLocation._encryptionKeyId || locationId
        );

        processedUpdates = await privacy.encryptSensitiveData(processedUpdates, encryptionKey);
      }

      if (createAuditLog) {
        const auditData = {
          entityType: 'work_location',
          entityId: locationId,
          action: 'update',
          changes: processedUpdates,
          previousData: privacy.sanitizeForLogging(currentLocation),
          timestamp: new Date().toISOString(),
          therapistId: currentLocation.therapistId
        };

        await auditService.logEvent({
          eventType: 'update',
          ...auditData
        });
      }

      const response = await apiClient.put(
        ENDPOINTS.workLocations.update.replace(':id', locationId),
        processedUpdates
      );

      const updatedLocation = response.data;

      this.invalidateCache(['locations', 'workplaces'], currentLocation.therapistId);

      privacy.logDataAccess(
        currentLocation.therapistId,
        'work_location',
        'update',
        { locationId, changes: Object.keys(updates) }
      );

      logger.info('Work location updated successfully', { locationId });

      return updatedLocation;
    } catch (error) {
      logger.error('Failed to update work location', { locationId, error });
      throw errorHandler.handle(error);
    }
  }

  async deleteLocation(locationId, options = {}) {
    try {
      const {
        reason = 'user_request',
        createAuditLog = true,
        checkActiveAppointments = true
      } = options;

      logger.info('Deleting work location', { locationId, reason });

      const location = await this.getLocation(locationId, { decryptSensitiveData: false });

      // Check for active appointments if requested
      if (checkActiveAppointments) {
        const activeAppointments = await this.checkActiveAppointments(locationId);
        if (activeAppointments.hasActive) {
          throw errorHandler.createConflictError(
            'Cannot delete location with active appointments',
            activeAppointments.appointments
          );
        }
      }

      // Cannot delete primary location if there are other locations
      if (location.isPrimary) {
        const otherLocations = await this.getLocationsByTherapist(location.therapistId, {
          excludeLocationId: locationId
        });

        if (otherLocations.locations.length > 0) {
          throw errorHandler.createValidationError(
            'Cannot delete primary location. Set another location as primary first.'
          );
        }
      }

      const deletionData = {
        reason,
        deletedAt: new Date().toISOString()
      };

      await apiClient.delete(
        ENDPOINTS.workLocations.delete.replace(':id', locationId),
        { data: deletionData }
      );

      this.invalidateCache(['locations', 'workplaces'], location.therapistId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'delete',
          entityType: 'work_location',
          entityId: locationId,
          action: 'delete',
          details: {
            reason,
            originalLocation: privacy.sanitizeForLogging(location)
          },
          userId: location.therapistId
        });
      }

      privacy.logDataAccess(
        location.therapistId,
        'work_location',
        'delete',
        { locationId, reason }
      );

      logger.info('Work location deleted successfully', { locationId });

      return {
        success: true,
        locationId,
        deletedAt: new Date().toISOString(),
        reason
      };
    } catch (error) {
      logger.error('Failed to delete work location', { locationId, error });
      throw errorHandler.handle(error);
    }
  }

  async getLocationsByTherapist(therapistId, options = {}) {
    try {
      const {
        status = 'active',
        includeSchedule = false,
        includeStatistics = false,
        excludeLocationId = null,
        decryptSensitiveData = false
      } = options;

      const params = {
        therapistId: therapistId,
        status,
        include_schedule: includeSchedule,
        include_statistics: includeStatistics,
        exclude_location_id: excludeLocationId
      };

      const cacheKey = `${this.cachePrefix}therapist_${therapistId}_${security.generateHash(params)}`;
      let response = cache.get(cacheKey);

      if (!response) {
        logger.info('Fetching therapist locations from API', { therapistId, params });

        response = await apiClient.get(ENDPOINTS.WORK_LOCATIONS.GET_BY_THERAPIST, { params });
        cache.set(cacheKey, response.data, this.defaultCacheTTL, this.cacheTags);
      } else {
        response = { data: response };
      }

      let locations = response.data?.locations || response.data || [];

      if (decryptSensitiveData) {
        locations = await Promise.all(
          locations.map(async (location) => {
            if (location._encryptionKeyId) {
              try {
                const encryptionKey = await privacy.generateEncryptionKey(
                  location.therapistId,
                  location._encryptionKeyId
                );
                return await privacy.decryptSensitiveData(location, encryptionKey);
              } catch (error) {
                logger.warn('Failed to decrypt location data', {
                  locationId: location.id,
                  error: error.message
                });
                return location;
              }
            }
            return location;
          })
        );
      }

      return {
        locations,
        total: response.data?.total || locations.length,
        primary: locations.find(loc => loc.isPrimary) || null
      };
    } catch (error) {
      logger.error('Failed to get therapist locations', { therapistId, error });

      // Si no hay therapistId válido o hay problemas de autenticación, no intentar cargar
      if (!therapistId || therapistId === 'current_therapistId' ||
          error.response?.status === 401 || error.response?.status === 403) {
        logger.warn('Authentication issues or invalid therapist ID for work locations');
        throw new Error('Authentication required to load work locations');
      }

      throw errorHandler.handle(error);
    }
  }

  async validateAddress(address, options = {}) {
    try {
      const {
        provider = this.addressValidationProviders.GOOGLE_MAPS,
        includeCoordinates = true,
        standardizeFormat = true
      } = options;

      logger.info('Validating address', {
        provider,
        country: address.country,
        city: address.city
      });

      const validationData = {
        address,
        provider,
        include_coordinates: includeCoordinates,
        standardize_format: standardizeFormat
      };

      const response = await apiClient.post(
        ENDPOINTS.workLocations.validateAddress,
        validationData
      );

      const validationResult = response.data;

      logger.info('Address validation completed', {
        isValid: validationResult.isValid,
        confidence: validationResult.confidence
      });

      return validationResult;
    } catch (error) {
      logger.error('Failed to validate address', { address, error });
      // Return a default validation result instead of throwing
      return {
        isValid: false,
        errors: ['Address validation service unavailable'],
        confidence: 0
      };
    }
  }

  async searchNearbyLocations(coordinates, radius, options = {}) {
    try {
      const {
        radiusUnit = 'km', // 'km' or 'miles'
        locationTypes = [],
        amenities = [],
        limit = 20
      } = options;

      logger.info('Searching nearby locations', {
        coordinates,
        radius,
        radiusUnit
      });

      const params = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        radius,
        radius_unit: radiusUnit,
        location_types: locationTypes.join(','),
        amenities: amenities.join(','),
        limit
      };

      const response = await apiClient.get(ENDPOINTS.workLocations.searchNearby, { params });

      return response.data;
    } catch (error) {
      logger.error('Failed to search nearby locations', { coordinates, radius, error });
      throw errorHandler.handle(error);
    }
  }

  async addRoom(locationId, roomData, options = {}) {
    try {
      const { createAuditLog = true } = options;

      logger.info('Adding room to location', {
        locationId,
        roomType: roomData.type,
        roomName: roomData.name
      });

      const processedData = {
        location_id: locationId,
        ...roomData,
        roomId: security.generateSecureId('room_'),
        createdAt: new Date().toISOString()
      };

      const response = await apiClient.post(
        ENDPOINTS.workLocations.addRoom.replace(':locationId', locationId),
        processedData
      );

      const room = response.data;

      this.invalidateCache(['locations', 'workplaces'], null);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'create',
          entityType: 'location_room',
          entityId: room.id,
          action: 'add_room',
          details: {
            locationId,
            roomType: roomData.type,
            roomName: roomData.name
          }
        });
      }

      logger.info('Room added successfully', {
        roomId: room.id,
        locationId
      });

      return room;
    } catch (error) {
      logger.error('Failed to add room', { locationId, error });
      throw errorHandler.handle(error);
    }
  }

  async updateLocationSchedule(locationId, scheduleData, options = {}) {
    try {
      const { createAuditLog = true } = options;

      logger.info('Updating location schedule', { locationId });

      const processedData = {
        ...scheduleData,
        updatedAt: new Date().toISOString()
      };

      const response = await apiClient.put(
        ENDPOINTS.workLocations.updateSchedule.replace(':locationId', locationId),
        processedData
      );

      const schedule = response.data;

      this.invalidateCache(['locations', 'workplaces'], null);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'location_schedule',
          entityId: locationId,
          action: 'update_schedule',
          details: {
            locationId,
            scheduleData: privacy.sanitizeForLogging(scheduleData)
          }
        });
      }

      logger.info('Location schedule updated successfully', { locationId });

      return schedule;
    } catch (error) {
      logger.error('Failed to update location schedule', { locationId, error });
      throw errorHandler.handle(error);
    }
  }

  async getLocationStatistics(locationId, options = {}) {
    try {
      const {
        dateFrom = null,
        dateTo = null,
        includeUtilization = true,
        includeRevenue = true,
        includeRoomStats = true
      } = options;

      const params = {
        date_from: dateFrom,
        date_to: dateTo,
        include_utilization: includeUtilization,
        include_revenue: includeRevenue,
        include_room_stats: includeRoomStats
      };

      const cacheKey = `${this.cachePrefix}stats_${locationId}_${security.generateHash(params)}`;
      let stats = cache.get(cacheKey);

      if (!stats) {
        logger.info('Fetching location statistics', { locationId, params });

        const response = await apiClient.get(
          ENDPOINTS.workLocations.getStatistics.replace(':locationId', locationId),
          { params }
        );

        stats = response.data;
        cache.set(cacheKey, stats, 600, [...this.cacheTags, 'statistics']);
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get location statistics', { locationId, error });
      throw errorHandler.handle(error);
    }
  }

  async updatePrimaryLocation(therapistId, newPrimaryLocationId) {
    try {
      logger.info('Updating primary location', { therapistId, newPrimaryLocationId });

      const response = await apiClient.patch(
        ENDPOINTS.workLocations.updatePrimary,
        {
          therapistId: therapistId,
          new_primary_location_id: newPrimaryLocationId
        }
      );

      this.invalidateCache(['locations', 'workplaces'], therapistId);

      await auditService.logEvent({
        eventType: 'update',
        entityType: 'work_location',
        entityId: newPrimaryLocationId,
        action: 'set_primary',
        details: {
          therapistId,
          newPrimaryLocationId
        },
        userId: therapistId
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to update primary location', { therapistId, newPrimaryLocationId, error });
      throw errorHandler.handle(error);
    }
  }

  async checkActiveAppointments(locationId) {
    try {
      logger.info('Checking active appointments for location', { locationId });

      const response = await apiClient.get(
        ENDPOINTS.workLocations.checkActiveAppointments.replace(':locationId', locationId)
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to check active appointments', { locationId, error });
      return { hasActive: false, appointments: [] };
    }
  }

  validateLocationData(locationData) {
    const requiredFields = ['therapistId', 'name', 'type'];

    for (const field of requiredFields) {
      if (!locationData[field]) {
        throw errorHandler.createValidationError(`Missing required field: ${field}`, locationData);
      }
    }

    // Validate location type
    if (!Object.values(this.locationTypes).includes(locationData.type)) {
      throw errorHandler.createValidationError('Invalid location type', {
        provided: locationData.type,
        valid: Object.values(this.locationTypes)
      });
    }

    // Validate contact information format
    if (locationData.contactInfo) {
      if (locationData.contactInfo.email && !this.isValidEmail(locationData.contactInfo.email)) {
        throw errorHandler.createValidationError('Invalid email format', {
          email: locationData.contactInfo.email
        });
      }

      if (locationData.contactInfo.phone && !this.isValidPhone(locationData.contactInfo.phone)) {
        throw errorHandler.createValidationError('Invalid phone format', {
          phone: locationData.contactInfo.phone
        });
      }
    }

    return true;
  }

  validateAccessibilityCompliance(locationData) {
    const warnings = [];
    const recommendations = [];

    // Check for basic accessibility features
    const basicFeatures = [
      this.accessibilityFeatures.WHEELCHAIR_ACCESSIBLE,
      this.accessibilityFeatures.ACCESSIBLE_PARKING,
      this.accessibilityFeatures.ACCESSIBLE_RESTROOM
    ];

    const hasBasicFeatures = basicFeatures.some(feature =>
      locationData.accessibilityFeatures?.includes(feature)
    );

    if (!hasBasicFeatures) {
      warnings.push('No basic accessibility features declared');
      recommendations.push('Consider adding wheelchair accessibility, accessible parking, or accessible restrooms');
    }

    // Check for entrance accessibility
    const entranceFeatures = [
      this.accessibilityFeatures.RAMP_ACCESS,
      this.accessibilityFeatures.WIDE_DOORWAYS
    ];

    const hasEntranceAccessibility = entranceFeatures.some(feature =>
      locationData.accessibilityFeatures?.includes(feature)
    );

    if (!hasEntranceAccessibility) {
      warnings.push('No entrance accessibility features declared');
      recommendations.push('Consider adding ramp access or wide doorways');
    }

    return {
      isCompliant: warnings.length === 0,
      warnings,
      recommendations
    };
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone) {
    // Basic phone validation - accepts various formats
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanPhone);
  }

  invalidateCache(tags = [], specificTherapistId = null) {
    try {
      if (specificTherapistId) {
        cache.deleteByPattern(`${this.cachePrefix}*${specificTherapistId}*`);
      }

      tags.forEach(tag => {
        cache.deleteByTag(tag);
      });

      logger.debug('Work location service cache invalidated', { tags, specificTherapistId });
    } catch (error) {
      logger.warn('Failed to invalidate cache', error);
    }
  }

  clearCache() {
    try {
      cache.deleteByTag('locations');
      cache.deleteByTag('workplaces');
      cache.deleteByTag('addresses');
      logger.info('Work location service cache cleared');
    } catch (error) {
      logger.warn('Failed to clear work location service cache', error);
    }
  }

  getStats() {
    return {
      service: 'WorkLocationService',
      initialized: this.isInitialized,
      cacheStats: {
        locations: cache.getStatsByTag('locations'),
        workplaces: cache.getStatsByTag('workplaces'),
        addresses: cache.getStatsByTag('addresses')
      },
      constants: {
        locationTypes: this.locationTypes,
        accessibilityFeatures: this.accessibilityFeatures,
        amenities: this.amenities,
        operatingStatus: this.operatingStatus,
        addressValidationProviders: this.addressValidationProviders,
        roomTypes: this.roomTypes
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const workLocationService = new WorkLocationService();

export const {
  createLocation,
  getLocation,
  updateLocation,
  deleteLocation,
  getLocationsByTherapist,
  validateAddress,
  searchNearbyLocations,
  addRoom,
  updateLocationSchedule,
  getLocationStatistics
} = workLocationService;

export default workLocationService;