import { COMPANY_TYPE_ANONYMOUS_LABELS, LANGUAGE_LEVELS, DIPLOMA_TYPES } from '../constants/cvOptions';

/**
 * Génère le HTML pour l'export PDF du CV
 * @param {Object} structuredData - Données du CV
 * @param {Object} profile - Profil utilisateur
 * @param {boolean} anonymous - Mode anonyme ou complet
 * @returns {string} HTML complet
 */
export const generateCVHtml = (structuredData, profile = {}, anonymous = false) => {
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

  const getLocation = () => {
    if (anonymous) return profile.current_region || 'France';
    return profile.current_city 
      ? `${profile.current_city}, ${profile.current_region}` 
      : profile.current_region || 'France';
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

  const formatPeriod = (startDate, endDate, isCurrent) => {
    if (!startDate) return '';
    const formatMonth = (dateStr) => {
      const [year, month] = dateStr.split('-');
      const date = new Date(year, parseInt(month) - 1);
      return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    };
    const start = formatMonth(startDate);
    if (isCurrent || !endDate) return `${start} - Présent`;
    return `${start} - ${formatMonth(endDate)}`;
  };

  const calculateDuration = (startDate, endDate, isCurrent) => {
    if (!startDate) return '';
    const start = new Date(startDate + '-01');
    const end = isCurrent || !endDate ? new Date() : new Date(endDate + '-01');
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (months < 1) return '';
    if (months < 12) return `${months} mois`;
    const years = Math.floor(months / 12);
    const remaining = months % 12;
    if (remaining === 0) return `${years} an${years > 1 ? 's' : ''}`;
    return `${years} an${years > 1 ? 's' : ''} ${remaining} mois`;
  };

  const getLevelLabel = (level) => {
    return LANGUAGE_LEVELS.find(l => l.value === level)?.label || level;
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
      <div class="form-diploma">${form.diploma_name || DIPLOMA_TYPES.find(d => d.value === form.diploma_type)?.label || 'Diplôme'}</div>
      <div class="form-school">${getSchoolDisplay(form)}</div>
      <div class="form-meta">
        <span>📍 ${anonymous ? (form.school_region || 'France') : (form.school_city || form.school_region || 'France')}</span>
        <span>🎓 ${form.year || ''}</span>
        ${form.mention ? `<span>${form.mention}</span>` : ''}
      </div>
    </div>
  `).join('');

  const skillsHtml = (structuredData.skills || []).map(s => 
    `<span class="skill-chip">${s}</span>`
  ).join('');

  const softwareHtml = (structuredData.software || []).map(s => 
    `<span class="software-chip">💻 ${s}</span>`
  ).join('');

  const certsHtml = (structuredData.certifications || []).map(c => `
    <div class="cert-item">
      <span class="cert-check">✓</span>
      <span>${c.name}</span>
      ${c.year ? `<span class="cert-year">${c.year}</span>` : ''}
    </div>
  `).join('');

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
    
    .location {
      font-size: 12px;
      color: ${colors.textLight};
      margin-bottom: 4px;
    }
    
    .contact-info {
      font-size: 11px;
      color: ${colors.textLight};
    }
    
    .header-badge {
      background: ${anonymous ? colors.primary : colors.secondary};
      color: white;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 10px;
      font-weight: 600;
    }
    
    .section {
      margin-bottom: 20px;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: ${colors.primary};
      margin-bottom: 12px;
      padding-bottom: 4px;
      border-bottom: 1px solid ${colors.border};
    }
    
    .summary {
      font-size: 11px;
      color: ${colors.text};
      line-height: 1.6;
      background: ${colors.background};
      padding: 12px;
      border-radius: 6px;
    }
    
    .experience-item, .formation-item {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px dashed ${colors.border};
    }
    
    .experience-item:last-child, .formation-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    
    .exp-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 2px;
    }
    
    .exp-title, .form-diploma {
      font-size: 12px;
      font-weight: 600;
      color: ${colors.text};
    }
    
    .current-badge {
      background: ${colors.primary};
      color: white;
      font-size: 9px;
      padding: 2px 6px;
      border-radius: 10px;
    }
    
    .exp-company, .form-school {
      font-size: 11px;
      color: ${colors.primary};
      margin-bottom: 4px;
    }
    
    .exp-meta, .form-meta {
      font-size: 10px;
      color: ${colors.textLight};
      display: flex;
      gap: 12px;
      margin-bottom: 6px;
    }
    
    .duration {
      font-style: italic;
    }
    
    .exp-description {
      font-size: 10px;
      color: ${colors.text};
      margin-top: 6px;
      line-height: 1.5;
    }
    
    .exp-skills {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 8px;
    }
    
    .skill-tag {
      background: ${colors.primary}20;
      color: ${colors.primary};
      font-size: 9px;
      padding: 2px 6px;
      border-radius: 10px;
    }
    
    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    
    .skill-chip {
      background: ${colors.primary}15;
      color: ${colors.primary};
      font-size: 10px;
      padding: 4px 10px;
      border-radius: 12px;
      font-weight: 500;
    }
    
    .software-chip {
      background: ${colors.secondary}15;
      color: ${colors.secondary};
      font-size: 10px;
      padding: 4px 10px;
      border-radius: 12px;
    }
    
    .cert-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
    }
    
    .cert-check {
      color: ${colors.primary};
      font-weight: bold;
    }
    
    .cert-year {
      color: ${colors.textLight};
      font-size: 10px;
      margin-left: auto;
    }
    
    .lang-item {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px dotted ${colors.border};
    }
    
    .lang-item:last-child {
      border-bottom: none;
    }
    
    .lang-name {
      font-weight: 500;
    }
    
    .lang-level {
      color: ${colors.textLight};
      font-size: 10px;
    }
    
    .two-columns {
      display: flex;
      gap: 24px;
    }
    
    .column {
      flex: 1;
    }
    
    .footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid ${colors.border};
      text-align: center;
      font-size: 9px;
      color: ${colors.textLight};
    }
    
    .anonymous-notice {
      background: ${colors.primary}10;
      border: 1px solid ${colors.primary}30;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 16px;
      font-size: 10px;
      color: ${colors.primary};
      text-align: center;
    }
  </style>
</head>
<body>
  ${anonymous ? `
    <div class="anonymous-notice">
      🔒 CV anonymisé - Les noms d'entreprises, écoles et villes exactes sont masqués
    </div>
  ` : ''}
  
  <div class="header">
    <div class="header-info">
      <div class="name">${getDisplayName()}</div>
      <div class="location">📍 ${getLocation()}</div>
    </div>
    <div class="header-badge">${anonymous ? 'CV Anonyme' : 'CV Complet'}</div>
  </div>
  
  ${structuredData.summary ? `
    <div class="section">
      <div class="section-title">À propos</div>
      <div class="summary">${structuredData.summary}</div>
    </div>
  ` : ''}
  
  ${structuredData.experiences?.length ? `
    <div class="section">
      <div class="section-title">Expériences professionnelles</div>
      ${experiencesHtml}
    </div>
  ` : ''}
  
  ${structuredData.formations?.length ? `
    <div class="section">
      <div class="section-title">Formations</div>
      ${formationsHtml}
    </div>
  ` : ''}
  
  <div class="two-columns">
    <div class="column">
      ${structuredData.skills?.length ? `
        <div class="section">
          <div class="section-title">Compétences</div>
          <div class="chips-container">${skillsHtml}</div>
        </div>
      ` : ''}
      
      ${structuredData.software?.length ? `
        <div class="section">
          <div class="section-title">Logiciels</div>
          <div class="chips-container">${softwareHtml}</div>
        </div>
      ` : ''}
    </div>
    
    <div class="column">
      ${structuredData.certifications?.length ? `
        <div class="section">
          <div class="section-title">Certifications</div>
          ${certsHtml}
        </div>
      ` : ''}
      
      ${structuredData.languages?.length ? `
        <div class="section">
          <div class="section-title">Langues</div>
          ${languagesHtml}
        </div>
      ` : ''}
    </div>
  </div>
  
  <div class="footer">
    CV généré via Pharma Link • ${new Date().toLocaleDateString('fr-FR')}
  </div>
</body>
</html>
  `;
};