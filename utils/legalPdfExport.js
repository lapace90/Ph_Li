import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/**
 * Génère le HTML pour un document légal
 */
const generateLegalHtml = (title, lastUpdate, sections) => {
  const sectionsHtml = sections.map(section => `
    <div class="section">
      <h2>${section.title}</h2>
      <p>${section.content.replace(/\n/g, '<br/>')}</p>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #2D3748;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #009B72;
        }
        .logo {
          font-size: 24pt;
          font-weight: bold;
          color: #009B72;
          margin-bottom: 10px;
        }
        h1 {
          font-size: 18pt;
          color: #2D3748;
          margin-bottom: 8px;
        }
        .date {
          font-size: 10pt;
          color: #718096;
        }
        .section {
          margin-bottom: 20px;
        }
        h2 {
          font-size: 12pt;
          color: #009B72;
          margin-bottom: 8px;
          padding-bottom: 4px;
          border-bottom: 1px solid #E2E8F0;
        }
        p {
          text-align: justify;
          margin-bottom: 10px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #E2E8F0;
          text-align: center;
          font-size: 9pt;
          color: #718096;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">PharmaLink</div>
        <h1>${title}</h1>
        <p class="date">Dernière mise à jour : ${lastUpdate}</p>
      </div>

      ${sectionsHtml}

      <div class="footer">
        <p>Document généré depuis l'application PharmaLink</p>
        <p>© ${new Date().getFullYear()} PharmaLink - Tous droits réservés</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Exporte un document légal en PDF
 * @param {string} title - Titre du document
 * @param {string} lastUpdate - Date de dernière mise à jour
 * @param {Array} sections - Sections du document [{title, content}]
 * @returns {Promise<{success: boolean, uri?: string, error?: string}>}
 */
export const exportLegalToPdf = async (title, lastUpdate, sections) => {
  try {
    const html = generateLegalHtml(title, lastUpdate, sections);

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    return { success: true, uri };
  } catch (error) {
    console.error('Erreur export PDF légal:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Génère et ouvre le dialogue de partage pour un document légal
 */
export const shareLegalPdf = async (title, lastUpdate, sections) => {
  try {
    const result = await exportLegalToPdf(title, lastUpdate, sections);

    if (!result.success) {
      throw new Error(result.error);
    }

    const isAvailable = await Sharing.isAvailableAsync();

    if (!isAvailable) {
      throw new Error('Le partage n\'est pas disponible sur cet appareil');
    }

    const filename = title.includes('CGU') ? 'CGU_PharmaLink.pdf' : 'Politique_Confidentialite_PharmaLink.pdf';

    await Sharing.shareAsync(result.uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Télécharger ${title}`,
      UTI: 'com.adobe.pdf',
    });

    return { success: true };
  } catch (error) {
    console.error('Erreur partage PDF légal:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Prévisualise le document légal (impression)
 */
export const previewLegalPdf = async (title, lastUpdate, sections) => {
  try {
    const html = generateLegalHtml(title, lastUpdate, sections);

    await Print.printAsync({
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('Erreur preview PDF légal:', error);
    return { success: false, error: error.message };
  }
};
