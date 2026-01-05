import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

/**
 * Service pour gérer les uploads vers Supabase Storage
 */
export const storageService = {
  /**
   * Upload une image (compatible Android/iOS)
   * @param {string} bucket - Nom du bucket ('avatars', 'cvs', 'pharmacy-listings', etc.)
   * @param {string} userId - ID de l'utilisateur
   * @param {object} imageAsset - Asset de expo-image-picker ou { uri: string }
   * @param {string} folder - Sous-dossier optionnel
   * @returns {Promise<string>} URL publique de l'image
   */
  async uploadImage(bucket, userId, imageAsset, folder = '') {
    const uri = imageAsset.uri;
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = folder 
      ? `${userId}/${folder}/${fileName}`
      : `${userId}/${fileName}`;

    // console.log('📤 Upload start:', { bucket, filePath });

    try {
      // Lire le fichier en base64
      const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      // console.log('📦 Base64 size:', Math.round(base64Data.length / 1024), 'KB');

      // Convertir en ArrayBuffer
      const arrayBuffer = decode(base64Data);

      // Upload vers Supabase
      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
          upsert: true,
        });

      if (error) {
        console.error('❌ Supabase upload error:', error);
        throw error;
      }

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('❌ Upload failed:', error);
      throw error;
    }
  },

  /**
   * Supprimer une image
   * @param {string} bucket - Nom du bucket
   * @param {string} fileUrl - URL complète du fichier
   */
  async deleteImage(bucket, fileUrl) {
    // Extraire le chemin du fichier depuis l'URL
    const urlParts = fileUrl.split(`${bucket}/`);
    if (urlParts.length < 2) return;
    
    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;
  },

  /**
   * Upload plusieurs images
   * @param {string} bucket - Nom du bucket
   * @param {string} userId - ID de l'utilisateur
   * @param {array} imageAssets - Array d'assets
   * @param {string} folder - Sous-dossier optionnel
   * @returns {Promise<string[]>} URLs publiques
   */
  async uploadMultipleImages(bucket, userId, imageAssets, folder = '') {
    const urls = await Promise.all(
      imageAssets.map(asset => this.uploadImage(bucket, userId, asset, folder))
    );
    return urls;
  },
};