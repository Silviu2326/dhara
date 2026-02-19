import { useState, useEffect, useCallback } from "react";
import { professionalProfileService } from "../../../services/api/professionalProfileService";
import { userService } from "../../../services/api/userService";
import { reviewService } from "../../../services/api/reviewService";
import { credentialsService } from "../../../services/api/credentialsService";
import { paymentService } from "../../../services/api/paymentService";
import { bookingService } from "../../../services/api/bookingService";
import { demoMode, demoData } from "../../../utils/demoMode";

export const useProfessionalProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState(null);

  // Cargar datos del perfil profesional
  const loadProfileData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Remover modo demostración - manejar errores normalmente

      // Cargar datos del perfil profesional
      const storedBanner = localStorage.getItem("user_banner");
      const storedAvatar = localStorage.getItem("user_avatar");
      const storedVideo = localStorage.getItem("user_videoPresentation");
      const storedVideoData = storedVideo ? JSON.parse(storedVideo) : null;

      // Cargar datos en paralelo
      const [professionalProfile, userProfile, reviews, statistics] =
        await Promise.allSettled([
          professionalProfileService.getProfile().catch(() => null),
          userService.getProfile().catch(() => null),
          reviewService
            .getReviews({ therapistId: "current", limit: 10 })
            .catch(() => []),
          getProfileStatistics().catch(() => generateFallbackStats()),
        ]);

      // Procesar datos del perfil profesional
      const profile =
        professionalProfile.status === "fulfilled" && professionalProfile.value
          ? professionalProfile.value.data || professionalProfile.value
          : {};

      // Procesar datos del usuario
      const user =
        userProfile.status === "fulfilled" && userProfile.value
          ? userProfile.value
          : {};

      // Combinar datos en la estructura esperada
      const combinedData = {
        // Información básica del usuario
        avatar: user.avatar || storedAvatar || null,
        banner: profile.banner || storedBanner || null,
        name:
          user.name || user.firstName
            ? `${user.firstName} ${user.lastName}`
            : "Profesional",

        // Información profesional
        about: profile.about || "",
        therapies: profile.specialties || [],

        // Credenciales (de education o credentials del perfil)
        credentials: profile.credentials
          ? profile.credentials.map((cred) => ({
              id: cred.id || cred._id,
              title: cred.title || cred.degree, // Manejar tanto title como degree
              institution: cred.institution,
              year:
                cred.year ||
                cred.yearObtained ||
                (cred.endDate ? new Date(cred.endDate).getFullYear() : null),
              description: cred.description || "",
            }))
          : profile.education && Array.isArray(profile.education)
            ? profile.education.map((edu) => ({
                id: edu._id || edu.id || `edu_${Date.now()}_${Math.random()}`,
                title: edu.degree || edu.title,
                institution: edu.institution,
                year: edu.year,
                description: edu.description || "",
              }))
            : [],

        // Ubicaciones de trabajo
        workLocations: profile.workLocations || [],

        // Presentación en video
        videoPresentation: profile.videoPresentation ||
          storedVideoData || {
            url: null,
            title: "Presentación Personal",
            description: "Conoce un poco más sobre mi enfoque terapéutico",
          },

        // Enlaces externos
        externalLinks: profile.externalLinks || [],

        // Testimonios destacados
        featuredTestimonials: profile.featuredTestimonials || [],

        // Experiencia laboral
        workExperience: profile.experience || [],

        // Paquetes de precios
        pricingPackages: profile.pricingPackages || {
          packages: [],
          coupons: [],
        },

        // Tarifas (ahora incluidas en el perfil profesional)
        rates: profile.rates || {
          sessionPrice: "",
          followUpPrice: "",
          packagePrice: "",
          coupleSessionPrice: "",
          currency: "EUR",
        },

        // Disponibilidad
        isAvailable:
          profile.isAvailable !== undefined ? profile.isAvailable : true,

        // Información legal
        legalInfo: profile.legalInfo || {
          licenses: [],
          professionalRegistration: "",
          ethicsCode: "",
          insuranceCoverage: "",
          dataProtectionCompliance: false,
        },
      };

      console.log("🔍 [PROFILE DATA] Combined profile data:", {
        credentialsCount: combinedData.credentials.length,
        legalInfo: combinedData.legalInfo,
        hasLegalLicenses: combinedData.legalInfo.licenses?.length || 0,
        profileEducation: profile.education?.length || 0,
        profileCredentials: profile.credentials?.length || 0,
      });

      setProfileData(combinedData);
      setOriginalData(JSON.parse(JSON.stringify(combinedData)));

      // Establecer estadísticas
      console.log("🔧 [STATS SETTING] Statistics object:", statistics);
      if (statistics.status === "fulfilled") {
        console.log("📊 [STATS SETTING] Setting stats to:", statistics.value);
        setStats(statistics.value);
      } else {
        console.log(
          "❌ [STATS SETTING] Statistics not fulfilled, status:",
          statistics.status,
        );
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
      setError(error.message || "Error al cargar los datos del perfil");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función para obtener estadísticas del perfil
  const getProfileStatistics = async () => {
    try {
      console.log(
        "🔍 [PROFILE STATS] Starting profile statistics collection...",
      );

      console.log("📊 [PROFILE STATS] Preparing API calls...");
      console.log("  - Payment stats for last 30 days");
      console.log("  - Booking stats for current therapist");
      console.log("  - Review stats for current therapist");

      const [paymentStats, bookingStats, reviewStats] =
        await Promise.allSettled([
          demoMode.handleServiceCall(() => {
            console.log("💰 [PAYMENT API] Calling getFinancialStatistics...");
            return paymentService.getFinancialStatistics({
              dateFrom: new Date(
                Date.now() - 30 * 24 * 60 * 60 * 1000,
              ).toISOString(),
              dateTo: new Date().toISOString(),
            });
          }, null),
          demoMode.handleServiceCall(() => {
            console.log("📅 [BOOKING API] Calling getAppointmentStatistics...");
            return bookingService.getAppointmentStatistics("current");
          }, null),
          demoMode.handleServiceCall(() => {
            console.log("⭐ [REVIEW API] Calling getReviewStatistics...");
            return reviewService.getReviewStatistics({
              therapistId: "current",
            });
          }, null),
        ]);

      console.log("📊 [PROFILE STATS] API calls completed. Results:");
      console.log(
        "  - Payment stats status:",
        paymentStats.status,
        paymentStats.value,
      );
      console.log(
        "  - Booking stats status:",
        bookingStats.status,
        bookingStats.value,
      );
      console.log(
        "  - Review stats status:",
        reviewStats.status,
        reviewStats.value,
      );

      // Manejar errores de autenticación silenciosamente

      const finalStats = {
        totalSessions:
          bookingStats.status === "fulfilled"
            ? bookingStats.value?.completedBookings || 0
            : 0,
        activeClients:
          bookingStats.status === "fulfilled"
            ? bookingStats.value?.activeUniqueClients || 0
            : 0,
        averageRating:
          reviewStats.status === "fulfilled"
            ? reviewStats.value?.averageRating || 0
            : 0,
        totalClients:
          bookingStats.status === "fulfilled"
            ? bookingStats.value?.totalUniqueClients || 0
            : 0,
        responseTime:
          bookingStats.status === "fulfilled"
            ? bookingStats.value?.avgSessionDuration || 0
            : 0,
        completionRate:
          bookingStats.status === "fulfilled"
            ? bookingStats.value?.completionRate || 0
            : 0,
        monthlySessions:
          bookingStats.status === "fulfilled"
            ? bookingStats.value?.completedBookings || 0
            : 0,
        newClients:
          bookingStats.status === "fulfilled"
            ? bookingStats.value?.activeUniqueClients || 0
            : 0,
        monthlyRevenue:
          paymentStats.status === "fulfilled"
            ? paymentStats.value?.currentPeriod?.totalAmount || 0
            : 0,
        satisfactionRate:
          reviewStats.status === "fulfilled"
            ? Math.round((reviewStats.value?.averageRating || 0) * 20)
            : 0,
      };

      console.log("🎯 [PROFILE STATS] Final calculated statistics:");
      console.log("  - totalSessions:", finalStats.totalSessions);
      console.log("  - activeClients:", finalStats.activeClients);
      console.log("  - averageRating:", finalStats.averageRating);
      console.log("  - totalClients:", finalStats.totalClients);
      console.log("  - completionRate:", finalStats.completionRate);
      console.log("  - satisfactionRate:", finalStats.satisfactionRate);

      return finalStats;
    } catch (error) {
      console.error("❌ [PROFILE STATS] Error loading statistics:", error);
      return generateFallbackStats();
    }
  };

  // Generar datos de estadísticas fallback (vacío)
  const generateFallbackStats = () => ({
    totalSessions: 0,
    activeClients: 0,
    averageRating: 0,
    totalClients: 0,
    responseTime: 0,
    completionRate: 0,
    monthlySessions: 0,
    newClients: 0,
    monthlyRevenue: 0,
    satisfactionRate: 0,
  });

  // Generar horario por defecto
  const generateDefaultSchedule = () => ({
    monday: { enabled: true, start: "09:00", end: "17:00" },
    tuesday: { enabled: true, start: "09:00", end: "17:00" },
    wednesday: { enabled: true, start: "09:00", end: "17:00" },
    thursday: { enabled: true, start: "09:00", end: "17:00" },
    friday: { enabled: true, start: "09:00", end: "17:00" },
    saturday: { enabled: false, start: "09:00", end: "14:00" },
    sunday: { enabled: false, start: "09:00", end: "14:00" },
  });

  // Detectar cambios
  useEffect(() => {
    if (originalData && profileData) {
      const hasChangesNow =
        JSON.stringify(profileData) !== JSON.stringify(originalData);
      setHasChanges(hasChangesNow);
    }
  }, [profileData, originalData]);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Guardar cambios
  const saveProfile = async () => {
    if (!hasChanges || !profileData) return;

    try {
      setIsSaving(true);

      // Preparar datos para enviar al backend
      const updateData = {
        about: profileData.about,
        specialties: profileData.therapies,
        videoPresentation: profileData.videoPresentation,
        externalLinks: profileData.externalLinks,
        featuredTestimonials: profileData.featuredTestimonials,
        experience: profileData.workExperience,
        workLocations: profileData.workLocations,
        pricingPackages: profileData.pricingPackages,
        rates: profileData.rates, // Incluir tarifas personalizadas
        isAvailable: profileData.isAvailable,
        legalInfo: profileData.legalInfo,
        credentials: profileData.credentials, // Incluir credenciales en el perfil
        banner: profileData.banner, // Guardar banner en perfil profesional
      };

      // Actualizar perfil profesional
      console.log("🔧 [SAVE] Updating profile with data:", {
        legalInfo: updateData.legalInfo,
        hasLegalLicenses: updateData.legalInfo?.licenses?.length || 0,
        credentialsCount: updateData.credentials?.length || 0,
        rates: updateData.rates,
        hasCustomRates: updateData.rates?.customRates ? "Yes" : "No",
      });
      console.log("🔧 [SAVE] Banner being sent:", profileData.banner);
      console.log(
        "🔧 [SAVE] VideoPresentation being sent:",
        profileData.videoPresentation,
      );
      await professionalProfileService.updateProfile(updateData);

      // Guardar video en localStorage como respaldo
      if (profileData.videoPresentation) {
        console.log(
          "🔧 [SAVE] Saving video to localStorage:",
          profileData.videoPresentation,
        );
        localStorage.setItem(
          "user_videoPresentation",
          JSON.stringify(profileData.videoPresentation),
        );
      }

      // Guardar avatar en localStorage como respaldo
      if (profileData.avatar) {
        localStorage.setItem("user_avatar", profileData.avatar);
      }

      // Guardar video en localStorage como respaldo
      if (profileData.videoPresentation) {
        localStorage.setItem(
          "user_videoPresentation",
          JSON.stringify(profileData.videoPresentation),
        );
      }

      // Actualizar información básica del usuario si cambió
      if (profileData.name !== originalData.name) {
        await userService.updateProfile({
          name: profileData.name,
        });
      }

      // Actualizar avatar si cambió
      if (profileData.avatar !== originalData.avatar) {
        await userService.updateProfile({
          avatar: profileData.avatar,
        });
      }

      // Las tarifas se actualizan como parte del perfil profesional

      // Las credenciales ya están incluidas en updateData

      // Actualizar datos originales
      setOriginalData(JSON.parse(JSON.stringify(profileData)));
      setHasChanges(false);

      return { success: true };
    } catch (error) {
      console.error("Error saving profile:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Actualizar campo específico
  const updateField = useCallback((field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Refrescar datos
  const refresh = useCallback(() => {
    loadProfileData();
  }, [loadProfileData]);

  return {
    profileData,
    stats,
    isLoading,
    isSaving,
    error,
    hasChanges,
    updateField,
    saveProfile,
    refresh,
  };
};
