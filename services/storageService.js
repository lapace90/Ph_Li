import { supabase } from '../lib/supabase';

/**
 * Service pour gérer les uploads vers Supabase Storage
 */
export const storageService = {
  /**
   * Upload une image
   * @param {string} bucket - Nom du bucket ('avatars', 'cvs', 'listings', etc.)
   * @param {string} userId - ID de l'utilisateur
   * @param {object} imageAsset - Asset de expo-image-picker
   * @param {string} folder - Sous-dossier optionnel
   * @returns {Promise<string>} URL publique de l'image
   */
  async uploadImage(bucket, userId, imageAsset, folder = '') {
    const fileExt = imageAsset.uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = folder 
      ? `${userId}/${folder}/${fileName}`
      : `${userId}/${fileName}`;

    // Convertir l'URI en blob
    const response = await fetch(imageAsset.uri);
    const blob = await response.blob();

    // Upload
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, {
        contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
        upsert: true,
      });

    if (error) throw error;

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
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