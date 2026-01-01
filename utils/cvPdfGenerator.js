import { COMPANY_TYPE_ANONYMOUS_LABELS, LANGUAGE_LEVELS, DIPLOMA_TYPES, DIPLOMA_MENTIONS } from '../constants/cvOptions';

/**
 * Génère le HTML pour l'export PDF du CV
 * @param {Object} structuredData - Données du CV
 * @param {Object} profile - Profil utilisateur
 * @param {boolean} anonymous - Mode anonyme ou complet
 * @param {string} cvTitle - Titre du CV (profession recherchée)
 * @returns {string} HTML complet
 */
export const generateCVHtml = (structuredData, profile = {}, anonymous = false, cvTitle = '') => {
  if (!structuredData) return '';

  const colors = {
    primary: '#009B72',
    secondary: '#2E7D8F',
    text: '#2D3748',
    textLight: '#718096',
    border: '#E2E8F0',
    background: '#F5F7FA',
    white: '#FFFFFF',
  };

  // Helpers
  const getDisplayName = () => {
    if (anonymous) return profile.first_name || 'Candidat';
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Candidat';
  };

  // Récupérer la localisation depuis les données du CV
  const getLocation = () => {
    // Priorité 1: données saisies dans le formulaire CV
    if (structuredData.current_city) {
      if (anonymous) return structuredData.current_region || 'France';
      return `${structuredData.current_city}, ${structuredData.current_region}`;
    }
    // Priorité 2: fallback sur le profil
    if (anonymous) return profile.current_region || 'France';
    return profile.current_city 
      ? `${profile.current_city}, ${profile.current_region}` 
      : profile.current_region || 'France';
  };

  // Titre de profession (depuis le CV ou la première expérience)
  const getProfessionTitle = () => {
    if (cvTitle) return cvTitle;
    // Priorité 1: titre saisi dans le CV
    if (structuredData.profession_title) return structuredData.profession_title;
    // Priorité 2: première expérience
    const firstExp = structuredData.experiences?.[0];
    return firstExp?.job_title || 'Professionnel de santé';
  };

  const getCompanyDisplay = (exp) => {
    if (anonymous) {
      return COMPANY_TYPE_ANONYMOUS_LABELS[exp.company_type] || 'Structure pharmaceutique';
    }
    return exp.company_name || COMPANY_TYPE_ANONYMOUS_LABELS[exp.company_type] || 'Non renseigné';
  };

  const getExpLocation = (exp) => {
    if (anonymous) return exp.region || 'France';
    return exp.city ? `${exp.city}, ${exp.region}` : exp.region || 'France';
  };

  const getSchoolDisplay = (form) => {
    if (anonymous) return 'Formation pharmaceutique';
    return form.school_name || 'Non renseigné';
  };

  const getSchoolLocation = (form) => {
    if (anonymous) return form.school_region || 'France';
    return form.school_city 
      ? `${form.school_city}, ${form.school_region}` 
      : form.school_region || 'France';
  };

  // Parser une date au format YYYY-MM ou YYYY-MM-DD
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    }
    return null;
  };

  const formatPeriod = (startDate, endDate, isCurrent) => {
    if (!startDate) return '';
    const start = parseDate(startDate);
    if (!start) return '';
    
    const startFormatted = start.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    
    if (isCurrent || !endDate) return `${startFormatted} - Présent`;
    
    const end = parseDate(endDate);
    if (!end) return `${startFormatted} - Présent`;
    
    const endFormatted = end.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    return `${startFormatted} - ${endFormatted}`;
  };

  const calculateDuration = (startDate, endDate, isCurrent) => {
    if (!startDate) return '';
    
    const start = parseDate(startDate);
    if (!start) return '';
    
    const end = (isCurrent || !endDate) ? new Date() : parseDate(endDate);
    if (!end) return '';
    
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    
    if (months < 1) return '';
    if (months < 12) return `${months} mois`;
    
    const years = Math.floor(months / 12);
    const remaining = months % 12;
    
    if (remaining === 0) return `${years} an${years > 1 ? 's' : ''}`;
    return `${years} an${years > 1 ? 's' : ''} ${remaining} mois`;
  };

  const calculateTotalExperience = () => {
    let totalMonths = 0;
    
    (structuredData.experiences || []).forEach(exp => {
      if (!exp.start_date) return;
      
      const start = parseDate(exp.start_date);
      if (!start) return;
      
      const end = (exp.is_current || !exp.end_date) ? new Date() : parseDate(exp.end_date);
      if (!end) return;
      
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      totalMonths += Math.max(0, months);
    });
    
    if (totalMonths < 12) return `${totalMonths} mois d'expérience`;
    const years = Math.floor(totalMonths / 12);
    return `${years} an${years > 1 ? 's' : ''} d'expérience`;
  };

  const getLevelLabel = (level) => {
    return LANGUAGE_LEVELS.find(l => l.value === level)?.label || level;
  };

  const getMentionLabel = (mention) => {
    return DIPLOMA_MENTIONS.find(m => m.value === mention)?.label || mention;
  };

  const getDiplomaLabel = (diplomaType) => {
    return DIPLOMA_TYPES.find(d => d.value === diplomaType)?.label || diplomaType;
  };

  // Sections HTML
  const experiencesHtml = (structuredData.experiences || []).map(exp => `
    <div class="experience-item">
      <div class="exp-header">
        <div class="exp-title">${exp.job_title || 'Poste non renseigné'}</div>
        ${exp.is_current ? '<span class="current-badge">Actuel</span>' : ''}
      </div>
      <div class="exp-company">${getCompanyDisplay(exp)}</div>
      <div class="exp-meta">
        <span>📍 ${getExpLocation(exp)}</span>
        <span>📅 ${formatPeriod(exp.start_date, exp.end_date, exp.is_current)}</span>
        <span class="duration">${calculateDuration(exp.start_date, exp.end_date, exp.is_current)}</span>
      </div>
      ${exp.description ? `<div class="exp-description">${exp.description}</div>` : ''}
      ${exp.skills?.length ? `
        <div class="exp-skills">
          ${exp.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
        </div>
      ` : ''}
    </div>
  `).join('');

  const formationsHtml = (structuredData.formations || []).map(form => `
    <div class="formation-item">
      <div class="form-diploma">${form.diploma_name || getDiplomaLabel(form.diploma_type) || 'Diplôme'}</div>
      <div class="form-school">${getSchoolDisplay(form)}</div>
      <div class="form-meta">
        <span>📍 ${getSchoolLocation(form)}</span>
        <span>🎓 ${form.year || ''}</span>
        ${form.mention ? `<span>Mention ${getMentionLabel(form.mention)}</span>` : ''}
      </div>
    </div>
  `).join('');

  const skillsHtml = (structuredData.skills || []).map(s => 
    `<span class="skill-chip">${s}</span>`
  ).join('');

  const softwareHtml = (structuredData.software || []).map(s => 
    `<span class="software-chip">💻 ${s}</span>`
  ).join('');

  const certsHtml = (structuredData.certifications || []).map(c => {
    const certName = typeof c === 'string' ? c : c.name;
    const certYear = typeof c === 'object' ? c.year : null;
    return `
      <div class="cert-item">
        <span class="cert-check">✓</span>
        <span>${certName}</span>
        ${certYear ? `<span class="cert-year">${certYear}</span>` : ''}
      </div>
    `;
  }).join('');

  const languagesHtml = (structuredData.languages || []).map(l => `
    <div class="lang-item">
      <span class="lang-name">${l.language?.charAt(0).toUpperCase() + l.language?.slice(1)}</span>
      <span class="lang-level">${getLevelLabel(l.level)}</span>
    </div>
  `).join('');

  // Template complet
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CV - ${getDisplayName()}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: ${colors.text};
      background: ${colors.white};
      padding: 32px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 20px;
      border-bottom: 2px solid ${colors.primary};
      margin-bottom: 24px;
    }
    
    .header-info {
      flex: 1;
    }
    
    .name {
      font-size: 24px;
      font-weight: 700;
      color: ${colors.text};
      margin-bottom: 4px;
    }
    
    .profession-title {
      font-size: 14px;
      font-weight: 600;
      color: ${colors.primary};
      margin-bottom: 8px;
    }
    
    .location {
      font-size: 12px;
      color: ${colors.textLight};
      margin-bottom: 4px;
    }
    
    .experience-summary {
      font-size: 12px;
      color: ${colors.primary};
      font-weight: 500;
    }
    
    .header-badge {
      background: ${anonymous ? colors.primary + '15' : colors.secondary + '15'};
      color: ${anonymous ? colors.primary : colors.secondary};
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
    }
    
    .section {
      margin-bottom: 24px;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: ${colors.primary};
      margin-bottom: 12px;
      padding-bottom: 4px;
      border-bottom: 1px solid ${colors.border};
    }
    
    .experience-item, .formation-item {
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid ${colors.border};
    }
    
    .experience-item:last-child, .formation-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    
    .exp-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    
    .exp-title, .form-diploma {
      font-size: 13px;
      font-weight: 600;
      color: ${colors.text};
    }
    
    .current-badge {
      background: ${colors.primary};
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 600;
    }
    
    .exp-company, .form-school {
      font-size: 12px;
      color: ${colors.textLight};
      margin-bottom: 4px;
    }
    
    .exp-meta, .form-meta {
      display: flex;
      gap: 16px;
      font-size: 11px;
      color: ${colors.textLight};
      margin-bottom: 8px;
    }
    
    .duration {
      color: ${colors.primary};
      font-weight: 500;
    }
    
    .exp-description {
      font-size: 11px;
      color: ${colors.text};
      line-height: 1.6;
      margin-bottom: 8px;
    }
    
    .exp-skills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    
    .skill-tag {
      background: ${colors.primary}15;
      color: ${colors.primary};
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
    }
    
    .skills-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .skill-chip {
      background: ${colors.primary}15;
      color: ${colors.primary};
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
    }
    
    .software-chip {
      background: ${colors.secondary}15;
      color: ${colors.secondary};
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 11px;
    }
    
    .cert-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    
    .cert-check {
      color: ${colors.primary};
      font-weight: bold;
    }
    
    .cert-year {
      color: ${colors.textLight};
      font-size: 10px;
    }
    
    .lang-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid ${colors.border};
    }
    
    .lang-item:last-child {
      border-bottom: none;
    }
    
    .lang-name {
      font-weight: 500;
    }
    
    .lang-level {
      color: ${colors.textLight};
    }
    
    .two-columns {
      display: flex;
      gap: 24px;
    }
    
    .column {
      flex: 1;
    }
    
    .summary-text {
      font-size: 12px;
      line-height: 1.7;
      color: ${colors.text};
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-info">
      <div class="name">${getDisplayName()}</div>
      <div class="profession-title">${getProfessionTitle()}</div>
      <div class="location">📍 ${getLocation()}</div>
      <div class="experience-summary">${calculateTotalExperience()}</div>
    </div>
    <div class="header-badge">
      ${anonymous ? '🔒 CV Anonyme' : '👤 CV Complet'}
    </div>
  </div>
  
  ${structuredData.summary ? `
    <div class="section">
      <div class="section-title">À propos</div>
      <div class="summary-text">${structuredData.summary}</div>
    </div>
  ` : ''}
  
  ${experiencesHtml ? `
    <div class="section">
      <div class="section-title">Expériences professionnelles</div>
      ${experiencesHtml}
    </div>
  ` : ''}
  
  ${formationsHtml ? `
    <div class="section">
      <div class="section-title">Formations</div>
      ${formationsHtml}
    </div>
  ` : ''}
  
  <div class="two-columns">
    <div class="column">
      ${skillsHtml ? `
        <div class="section">
          <div class="section-title">Compétences</div>
          <div class="skills-container">${skillsHtml}</div>
        </div>
      ` : ''}
      
      ${softwareHtml ? `
        <div class="section">
          <div class="section-title">Logiciels</div>
          <div class="skills-container">${softwareHtml}</div>
        </div>
      ` : ''}
    </div>
    
    <div class="column">
      ${certsHtml ? `
        <div class="section">
          <div class="section-title">Certifications</div>
          ${certsHtml}
        </div>
      ` : ''}
      
      ${languagesHtml ? `
        <div class="section">
          <div class="section-title">Langues</div>
          ${languagesHtml}
        </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
`;
};