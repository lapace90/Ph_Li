import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateCVHtml } from './cvPdfGenerator';

/**
 * Génère et partage un PDF du CV
 * Les contacts (email, téléphone) sont inclus dans structuredData.contact_email et structuredData.contact_phone
 * @param {Object} structuredData - Données du CV
 * @param {Object} profile - Profil utilisateur
 * @param {boolean} anonymous - Mode anonyme
 * @param {string} title - Titre du fichier
 * @returns {Promise<{success: boolean, uri?: string, error?: string}>}
 */
export const exportCVToPdf = async (structuredData, profile, anonymous = false, title = 'CV') => {
  try {
    const html = generateCVHtml(structuredData, profile, anonymous);

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    return { success: true, uri };
  } catch (error) {
    console.error('Erreur export PDF:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Génère et ouvre le dialogue de partage
 */
export const shareCVPdf = async (structuredData, profile, anonymous = false, title = 'CV') => {
  try {
    const result = await exportCVToPdf(structuredData, profile, anonymous, title);
    
    if (!result.success) {
      throw new Error(result.error);
    }

    const isAvailable = await Sharing.isAvailableAsync();
    
    if (!isAvailable) {
      throw new Error('Le partage n\'est pas disponible sur cet appareil');
    }

    await Sharing.shareAsync(result.uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Partager ${title}`,
      UTI: 'com.adobe.pdf',
    });

    return { success: true };
  } catch (error) {
    console.error('Erreur partage PDF:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Prévisualise le PDF (impression)
 */
export const previewCVPdf = async (structuredData, profile, anonymous = false) => {
  try {
    const html = generateCVHtml(structuredData, profile, anonymous);
    
    await Print.printAsync({
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('Erreur preview PDF:', error);
    return { success: false, error: error.message };
  }
};