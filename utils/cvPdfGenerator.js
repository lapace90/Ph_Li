import { COMPANY_TYPE_ANONYMOUS_LABELS, LANGUAGE_LEVELS, DIPLOMA_TYPES, DIPLOMA_MENTIONS } from '../constants/cvOptions';

/**
 * Logo PharmaLink en SVG inline pour le PDF
 */
const getPharmaLinkLogoSvg = (size = 50, crossColor = '#009B72') => `
<svg width="${size}" height="${size}" viewBox="0 0 283.5 283.5" xmlns="http://www.w3.org/2000/svg">
  <path d="M272.9,100.7c-0.3-7.6-5.8-13.6-12.5-13.6h-64v-64c0-6.7-6-12.2-13.6-12.5v0h-81.3c-7.9,0-14.4,5.6-14.4,12.6v64h-64c-6.7,0-12.2,6-12.5,13.6h0V182c0,7.9,5.6,14.4,12.6,14.4h64v64c0,6.9,6.4,12.6,14.4,12.6h81.3v0c7.6-0.3,13.6-5.8,13.6-12.5v-64h64c6.9,0,12.6-6.4,12.6-14.4L272.9,100.7L272.9,100.7z" fill="${crossColor}"/>
  <path d="M173.4,231.9c-3-1-23.5-4.8-25.4-6.7c-1.9-1.9-1.9-4.3-1.9-7v-1.1c-3.1-0.9-7-1.6-10.7-3v4.1c0,2.6,0,5.1-1.9,7c-1.9,1.9-22.4,5.7-25.4,6.7c-2.7,0.9-2.8,5,0.9,5c1.1,0,8.7,0,17.4,0c13.1,0,28.7,0,28.7,0c8.7,0,16.3,0,17.4,0C176.2,236.8,176.1,232.8,173.4,231.9z" fill="#FFFFFF"/>
  <path d="M170.8,113.7h-9.2l0-0.1c-0.7,0.1-1.5,0.1-2.3,0.1c-24.1-0.1-42.4-10.7-42.4-27.5c0-18.1,16.1-23,24.3-23c8.9,0,15.7,3.4,18.6,11.2c-2.6,1.4-4.3,4.2-4.3,7.3c0,4.6,3.7,8.4,8.4,8.4s8.4-3.7,8.4-8.4c0-2.2-0.8-4.2-2.2-5.7c-1.5-14.7-14.7-23.3-30.2-23.3c-18.4,0-33.4,15.1-33.4,33.8c0,11.8,5.5,20.7,15.3,27.2l0,0c0,0,0,0,0,0c0.7,0.5,1.4,0.9,2.1,1.3c0.1,0,0.1,0.1,0.2,0.1c1.4,0.9,3,1.7,4.6,2.4c0.1,0.1,0.2,0.1,0.3,0.2c0.8,0.4,1.6,0.7,2.5,1.1c0,0,0,0,0,0c0.8,0.3,1.6,0.7,2.5,1c0.2,0.1,0.3,0.1,0.5,0.2c0.9,0.3,1.7,0.6,2.6,0.9c0,0,0,0,0.1,0c0.8,0.3,1.7,0.6,2.6,0.8c0.2,0.1,0.4,0.1,0.7,0.2c0.9,0.3,1.8,0.5,2.8,0.8c0.8,0.2,1.5,0.4,2.3,0.6c0.2,0.1,0.5,0.1,0.7,0.2c0.5,0.2,1.1,0.3,1.6,0.5c0.2,0.1,0.5,0.2,0.7,0.2c0.7,0.2,1.3,0.5,1.9,0.7c0.3,0.1,0.5,0.2,0.8,0.3c0.4,0.2,0.8,0.3,1.1,0.5c0.3,0.1,0.6,0.3,0.9,0.4c0.3,0.1,0.6,0.3,0.9,0.4c0.6,0.3,1.3,0.6,1.9,1c0.2,0.1,0.3,0.2,0.5,0.3c0.4,0.2,0.8,0.4,1.1,0.7c0.1,0.1,0.3,0.2,0.4,0.3c1.3,0.8,2.5,1.7,3.7,2.6c0,0,0,0,0,0c1.7,1.3,3.2,2.8,4.6,4.5c2.2,2.6,4.2,5.5,6,9c0.2,0.3,0.3,0.6,0.4,0.8c0.4-0.1,0.7-0.3,1-0.4l0,0c0.1-0.1,0.3-0.1,0.4-0.2c0.1,0,0.2-0.1,0.3-0.1c0,0,0,0,0,0c16.4-6.4,30.6-17.4,40.9-31.4H170.8z" fill="#FFFFFF"/>
  <g>
    <path d="M143.8,202.7c-7.6-1.9-15.5-5.6-15.6-12.6c-0.1-3.6,2.3-6.3,5.8-8.4v-10.5c-7.4,2.9-15.8,7.6-15.7,18.7c0,11.3,11.7,17.5,23.2,20.3c11.5,2.8,15.4,5.4,18.4,7.5c1.5,1.1,2.4-0.2,2.1-2.3C161.5,213.5,155.4,205.6,143.8,202.7z" fill="#FFFFFF"/>
    <path d="M138.2,127.5c-9.9-2.4-18.3-6.5-26.6-13.8h-3.7h-6H66.2c15.8,21.6,40.8,36,69.2,37.6v19.5c0,0,0,0,0,0V181c0,0,0,0,0,0V194c2.6,1.3,6.6,2.7,10.7,3.8v-21c0,0,0,0,0,0v-9.9c0,0,0,0,0,0v-15.6c2.6-0.2,5.2-0.4,7.7-0.8c1.8,1.6,3.2,3.8,3.5,6.3c0.5,5-4.4,7.5-9.8,9.5v9.9c4.9-1.6,9.6-3.1,12.3-5.2c7-5.3,8.9-9.2,8.9-16.6C168.7,148.2,160.8,132.9,138.2,127.5z" fill="#FFFFFF"/>
  </g>
</svg>
`;

/**
 * Génère le HTML pour l'export PDF du CV
 * @param {Object} structuredData - Données du CV
 * @param {Object} profile - Profil utilisateur
 * @param {boolean} anonymous - Mode anonyme ou complet
 * @param {string} cvTitle - Titre du CV (profession recherchée)
 * @returns {string} HTML complet
 */
export const generateCVHtml = (structuredData, profile = {}, anonymous = false, cvTitle = '', email = '') => {
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
    if (anonymous) {
      return profile.nickname || profile.first_name || 'Candidat';
    }
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Candidat';
  };

  const getLocation = () => {
    if (structuredData.current_city) {
      if (anonymous) return structuredData.current_region || 'France';
      return `${structuredData.current_city}, ${structuredData.current_region}`;
    }
    if (anonymous) return profile.current_region || 'France';
    return profile.current_city 
      ? `${profile.current_city}, ${profile.current_region}` 
      : profile.current_region || 'France';
  };

  const getProfessionTitle = () => {
    if (cvTitle) return cvTitle;
    if (structuredData.profession_title) return structuredData.profession_title;
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

  const getLevelLabel = (levelValue) => {
    const level = LANGUAGE_LEVELS.find(l => l.value === levelValue);
    return level?.label || levelValue;
  };

  const getDiplomaLabel = (typeValue) => {
    const diploma = DIPLOMA_TYPES.find(d => d.value === typeValue);
    return diploma?.label || typeValue;
  };

  const getMentionLabel = (mentionValue) => {
    const mention = DIPLOMA_MENTIONS.find(m => m.value === mentionValue);
    return mention?.label || mentionValue;
  };

  const formatPeriod = (startDate, endDate, isCurrent) => {
    if (!startDate) return '';
    const formatMonth = (dateStr) => {
      if (!dateStr) return '';
      const parts = dateStr.split('-');
      if (parts.length < 2) return dateStr;
      const date = new Date(parts[0], parseInt(parts[1]) - 1);
      return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    };
    const start = formatMonth(startDate);
    if (isCurrent) return `${start} - Présent`;
    if (!endDate) return start;
    return `${start} - ${formatMonth(endDate)}`;
  };

  const calculateDuration = (startDate, endDate, isCurrent) => {
    if (!startDate) return '';
    const start = new Date(startDate);
    const end = isCurrent ? new Date() : (endDate ? new Date(endDate) : new Date());
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (months < 12) return `${months} mois`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years} an${years > 1 ? 's' : ''}`;
    return `${years} an${years > 1 ? 's' : ''} ${remainingMonths} mois`;
  };

  const calculateTotalExperience = () => {
    if (!structuredData.experiences?.length) return '';
    let totalMonths = 0;
    structuredData.experiences.forEach(exp => {
      if (exp.start_date) {
        const start = new Date(exp.start_date);
        const end = exp.is_current ? new Date() : (exp.end_date ? new Date(exp.end_date) : new Date());
        totalMonths += (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      }
    });
    if (totalMonths < 12) return `${totalMonths} mois d'expérience`;
    const years = Math.floor(totalMonths / 12);
    return `${years} an${years > 1 ? 's' : ''} d'expérience`;
  };

  // Génération HTML des sections
  const experiencesHtml = (structuredData.experiences || []).map(exp => `
    <div class="experience-item">
      <div class="exp-header">
        <div class="exp-title">${exp.job_title || 'Poste'}</div>
        ${exp.is_current ? '<span class="current-badge">En poste</span>' : ''}
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
      <div class="form-diploma">${getDiplomaLabel(form.diploma_type)}${form.diploma_name ? ` - ${form.diploma_name}` : ''}</div>
      <div class="form-school">${getSchoolDisplay(form)}</div>
      <div class="form-meta">
        <span>📍 ${getSchoolLocation(form)}</span>
        ${form.year ? `<span>📅 ${form.year}</span>` : ''}
        ${form.mention ? `<span>🏆 ${getMentionLabel(form.mention)}</span>` : ''}
      </div>
    </div>
  `).join('');

  const skillsHtml = (structuredData.skills || []).map(s => 
    `<span class="skill-chip">${s}</span>`
  ).join('');

  const softwareHtml = (structuredData.software || []).map(s => 
    `<span class="software-chip">${s}</span>`
  ).join('');

  const certsHtml = (structuredData.certifications || []).map(c => {
    const certName = typeof c === 'object' ? c.name : c;
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
    @page {
      margin: 0;
      size: A4;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html, body {
      height: 100%;
    }
    
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: ${colors.text};
      background: ${colors.white};
      padding: 32px;
      padding-bottom: 60px;
      min-height: 100%;
      position: relative;
    }
    
    .header {
      display: flex;
      align-items: center;
      gap: 24px;
      padding-bottom: 20px;
      border-bottom: 3px solid ${colors.primary};
      margin-bottom: 24px;
    }
    
    .header-logo {
      flex-shrink: 0;
    }
    
    .header-info {
      flex: 1;
      text-align: center;
    }
    
    .header-badge {
      flex-shrink: 0;
      background: ${anonymous ? colors.primary + '15' : colors.secondary + '15'};
      color: ${anonymous ? colors.primary : colors.secondary};
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
    }
    
    .name {
      font-size: 20px;
      font-weight: 700;
      color: ${colors.text};
      margin-bottom: 4px;
    }
    
    .profession-title {
      font-size: 16px;
      font-weight: 700;
      color: ${colors.primary};
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .header-details {
      display: flex;
      justify-content: center;
      gap: 24px;
      font-size: 12px;
      color: ${colors.textLight};
    }
    
    .header-details span {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .header-contacts {
      display: flex;
      justify-content: center;
      gap: 24px;
      font-size: 11px;
      color: ${colors.text};
      margin-top: 8px;
    }
    
    .header-contacts a {
      color: ${colors.primary};
      text-decoration: none;
    }
    
    .experience-summary {
      color: ${colors.primary};
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
    
    .footer {
      position: absolute;
      bottom: 20px;
      left: 32px;
      right: 32px;
      padding-top: 10px;
      border-top: 1px solid ${colors.border};
      text-align: center;
      font-size: 9px;
      color: ${colors.textLight};
    }
    
    .footer-brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-bottom: 2px;
    }
    
    .footer-brand span {
      font-weight: 600;
      color: ${colors.primary};
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-logo">
      ${getPharmaLinkLogoSvg(50, colors.primary)}
    </div>
    <div class="header-info">
      <div class="name">${getDisplayName()}</div>
      <div class="profession-title">${getProfessionTitle()}</div>
      <div class="header-details">
        <span>📍 ${getLocation()}</span>
        ${calculateTotalExperience() ? `<span class="experience-summary">💼 ${calculateTotalExperience()}</span>` : ''}
      </div>
      ${!anonymous && (email || profile.phone) ? `
      <div class="header-contacts">
        ${email ? `<span>✉️ <a href="mailto:${email}">${email}</a></span>` : ''}
        ${profile.phone ? `<span>📞 ${profile.phone}</span>` : ''}
      </div>
      ` : ''}
    </div>
    <div class="header-badge">
      ${anonymous ? '🔒 Anonyme' : '👤 Complet'}
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
  
  <div class="footer">
    <div class="footer-brand">
      ${getPharmaLinkLogoSvg(16, colors.primary)}
      <span>PharmaLink</span>
    </div>
    <div>CV généré via PharmaLink</div>
  </div>
</body>
</html>
`;
};