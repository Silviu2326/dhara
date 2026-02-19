import {
  supabase,
  handleSupabaseError,
  isSupabaseConfigured,
} from "../config/supabase";
import { logger } from "../utils/logger";
import { security } from "../utils/security";

/**
 * Servicio de almacenamiento con Supabase Storage
 *
 * Incluye:
 * - Upload de archivos con progreso
 * - Descarga de archivos
 * - URLs públicas y firmadas
 * - Gestión de buckets
 */
class SupabaseStorageService {
  constructor() {
    this.isEnabled = isSupabaseConfigured();

    // Nombres de buckets
    this.buckets = {
      DOCUMENTS: "documents",
      AVATARS: "avatars",
      CREDENTIALS: "credentials",
      PUBLIC: "public",
    };

    // Límites de tamaño (en bytes)
    this.limits = {
      AVATAR: 2 * 1024 * 1024, // 2MB
      DOCUMENT: 10 * 1024 * 1024, // 10MB
      CREDENTIAL: 10 * 1024 * 1024, // 10MB
    };

    // Tipos de archivo permitidos
    this.allowedTypes = {
      IMAGES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      DOCUMENTS: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      ALL: ["*/*"],
    };

    if (!this.isEnabled) {
      logger.warn("Supabase storage is not configured");
    }
  }

  /**
   * Upload de archivo con progreso
   */
  async uploadFile(file, options = {}) {
    try {
      if (!this.isEnabled) {
        throw new Error("Supabase storage is not configured");
      }

      const {
        bucket = this.buckets.DOCUMENTS,
        folder = "",
        fileName = null,
        isPublic = false,
        onProgress = null,
        metadata = {},
      } = options;

      // Validar archivo
      this.validateFile(file, options);

      // Generar nombre único si no se proporciona
      const finalFileName = fileName || this.generateFileName(file);
      const filePath = folder ? `${folder}/${finalFileName}` : finalFileName;

      logger.info("Uploading file to Supabase", {
        bucket,
        path: filePath,
        size: file.size,
        type: file.type,
      });

      // Configurar opciones de upload
      const uploadOptions = {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
        ...metadata,
      };

      // Upload con progreso usando XMLHttpRequest
      if (onProgress) {
        return await this.uploadWithProgress(
          bucket,
          filePath,
          file,
          uploadOptions,
          onProgress,
        );
      }

      // Upload simple
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, uploadOptions);

      handleSupabaseError(error);

      logger.info("File uploaded successfully", { path: data.path });

      // Obtener URL pública si es necesario
      const url = isPublic
        ? this.getPublicUrl(bucket, data.path)
        : await this.getSignedUrl(bucket, data.path);

      return {
        path: data.path,
        fullPath: data.fullPath || `${bucket}/${data.path}`,
        url,
        bucket,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Error uploading file:", error);
      throw error;
    }
  }

  /**
   * Upload con progreso usando XMLHttpRequest
   */
  async uploadWithProgress(bucket, path, file, options, onProgress) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);

      // Obtener URL de upload
      const uploadUrl = `${supabase.storage.url}/object/${bucket}/${path}`;

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = Math.round(
            (event.loaded / event.total) * 100,
          );
          onProgress(percentComplete, event);
        }
      });

      xhr.addEventListener("load", async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const url = this.getPublicUrl(bucket, path);
          resolve({
            path,
            fullPath: `${bucket}/${path}`,
            url,
            bucket,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
          });
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed"));
      });

      xhr.open("POST", uploadUrl);
      xhr.setRequestHeader("Authorization", `Bearer ${session?.access_token}`);
      xhr.send(formData);
    });
  }

  /**
   * Descargar archivo
   */
  async downloadFile(bucket, path) {
    try {
      if (!this.isEnabled) {
        throw new Error("Supabase storage is not configured");
      }

      logger.info("Downloading file from Supabase", { bucket, path });

      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

      handleSupabaseError(error);

      logger.info("File downloaded successfully");

      return data;
    } catch (error) {
      logger.error("Error downloading file:", error);
      throw error;
    }
  }

  /**
   * Obtener URL pública
   */
  getPublicUrl(bucket, path) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Obtener URL firmada (temporal)
   */
  async getSignedUrl(bucket, path, expiresIn = 3600) {
    try {
      if (!this.isEnabled) {
        throw new Error("Supabase storage is not configured");
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      handleSupabaseError(error);

      return data.signedUrl;
    } catch (error) {
      logger.error("Error creating signed URL:", error);
      throw error;
    }
  }

  /**
   * Eliminar archivo
   */
  async deleteFile(bucket, path) {
    try {
      if (!this.isEnabled) {
        throw new Error("Supabase storage is not configured");
      }

      logger.info("Deleting file from Supabase", { bucket, path });

      const { error } = await supabase.storage.from(bucket).remove([path]);

      handleSupabaseError(error);

      logger.info("File deleted successfully");

      return { success: true };
    } catch (error) {
      logger.error("Error deleting file:", error);
      throw error;
    }
  }

  /**
   * Listar archivos en un bucket/carpeta
   */
  async listFiles(bucket, folder = "", options = {}) {
    try {
      if (!this.isEnabled) {
        throw new Error("Supabase storage is not configured");
      }

      const {
        limit = 100,
        offset = 0,
        sortBy = { column: "name", order: "asc" },
      } = options;

      logger.info("Listing files from Supabase", { bucket, folder });

      const { data, error } = await supabase.storage.from(bucket).list(folder, {
        limit,
        offset,
        sortBy,
      });

      handleSupabaseError(error);

      return data;
    } catch (error) {
      logger.error("Error listing files:", error);
      throw error;
    }
  }

  /**
   * Mover archivo
   */
  async moveFile(bucket, fromPath, toPath) {
    try {
      if (!this.isEnabled) {
        throw new Error("Supabase storage is not configured");
      }

      logger.info("Moving file in Supabase", { bucket, fromPath, toPath });

      const { error } = await supabase.storage
        .from(bucket)
        .move(fromPath, toPath);

      handleSupabaseError(error);

      logger.info("File moved successfully");

      return { success: true, newPath: toPath };
    } catch (error) {
      logger.error("Error moving file:", error);
      throw error;
    }
  }

  /**
   * Validar archivo antes de upload
   */
  validateFile(file, options = {}) {
    const {
      maxSize = this.limits.DOCUMENT,
      allowedTypes = this.allowedTypes.ALL,
    } = options;

    // Validar tamaño
    if (file.size > maxSize) {
      throw new Error(
        `El archivo excede el tamaño máximo permitido de ${maxSize / 1024 / 1024}MB`,
      );
    }

    // Validar tipo si no es ALL
    if (!allowedTypes.includes("*/*") && !allowedTypes.includes(file.type)) {
      throw new Error(
        `Tipo de archivo no permitido. Tipos aceptados: ${allowedTypes.join(", ")}`,
      );
    }

    return true;
  }

  /**
   * Generar nombre de archivo único
   */
  generateFileName(file) {
    const timestamp = Date.now();
    const random = security.generateSecureId("file");
    const extension = file.name.split(".").pop();
    return `${timestamp}_${random}.${extension}`;
  }

  /**
   * Crear bucket si no existe
   */
  async createBucketIfNotExists(bucketName, options = {}) {
    try {
      if (!this.isEnabled) {
        throw new Error("Supabase storage is not configured");
      }

      const { isPublic = false } = options;

      // Verificar si el bucket existe
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some((b) => b.name === bucketName);

      if (!bucketExists) {
        logger.info("Creating bucket", { bucketName, isPublic });

        const { error } = await supabase.storage.createBucket(bucketName, {
          public: isPublic,
          fileSizeLimit: 10485760, // 10MB
        });

        handleSupabaseError(error);

        logger.info("Bucket created successfully");
      }

      return { success: true, exists: bucketExists };
    } catch (error) {
      logger.error("Error creating bucket:", error);
      throw error;
    }
  }
}

export const supabaseStorageService = new SupabaseStorageService();
export default supabaseStorageService;
