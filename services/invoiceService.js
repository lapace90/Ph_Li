// Service pour la gestion des factures

import { supabase } from '../lib/supabase';

export const invoiceService = {
  // ==========================================
  // LECTURE
  // ==========================================

  /**
   * Recupere les factures d'un utilisateur
   */
  async getUserInvoices(userId, options = {}) {
    const { limit = 20, offset = 0, status = null } = options;

    let query = supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Recupere une facture par ID
   */
  async getInvoice(invoiceId) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Recupere une facture par numero
   */
  async getInvoiceByNumber(invoiceNumber) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_number', invoiceNumber)
      .single();

    if (error) throw error;
    return data;
  },

  // ==========================================
  // CREATION
  // ==========================================

  /**
   * Cree une facture pour un abonnement
   */
  async createSubscriptionInvoice(userId, subscriptionId, details) {
    const {
      tier,
      price,
      discount = 0,
      promotionId = null,
      promotionCode = null,
      periodStart,
      periodEnd,
    } = details;

    const subtotal = price;
    const tax = 0; // TVA a implementer si necessaire
    const total = Math.max(0, subtotal - discount + tax);

    const lineItems = [
      {
        description: `Abonnement ${tier}`,
        quantity: 1,
        unit_price: price,
        amount: price,
      },
    ];

    if (discount > 0) {
      lineItems.push({
        description: `Remise${promotionCode ? ` (${promotionCode})` : ''}`,
        quantity: 1,
        unit_price: -discount,
        amount: -discount,
      });
    }

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        user_id: userId,
        subscription_id: subscriptionId,
        status: 'pending',
        subtotal,
        discount,
        tax,
        total,
        description: `Abonnement ${tier} - ${new Date(periodStart).toLocaleDateString('fr-FR')} au ${new Date(periodEnd).toLocaleDateString('fr-FR')}`,
        line_items: lineItems,
        promotion_id: promotionId,
        promotion_code: promotionCode,
        period_start: periodStart,
        period_end: periodEnd,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Cree une facture pour un achat ponctuel (pub, etc.)
   */
  async createPurchaseInvoice(userId, details) {
    const {
      description,
      amount,
      discount = 0,
      promotionId = null,
      promotionCode = null,
    } = details;

    const subtotal = amount;
    const tax = 0;
    const total = Math.max(0, subtotal - discount + tax);

    const lineItems = [
      {
        description,
        quantity: 1,
        unit_price: amount,
        amount,
      },
    ];

    if (discount > 0) {
      lineItems.push({
        description: `Remise${promotionCode ? ` (${promotionCode})` : ''}`,
        quantity: 1,
        unit_price: -discount,
        amount: -discount,
      });
    }

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        user_id: userId,
        status: 'pending',
        subtotal,
        discount,
        tax,
        total,
        description,
        line_items: lineItems,
        promotion_id: promotionId,
        promotion_code: promotionCode,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ==========================================
  // MISE A JOUR
  // ==========================================

  /**
   * Marque une facture comme payee
   */
  async markAsPaid(invoiceId, paymentDetails = {}) {
    const {
      paymentMethod = 'card',
      stripePaymentIntentId = null,
    } = paymentDetails;

    const { data, error } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_method: paymentMethod,
        stripe_payment_intent_id: stripePaymentIntentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Marque une facture comme echouee
   */
  async markAsFailed(invoiceId) {
    const { data, error } = await supabase
      .from('invoices')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Marque une facture comme remboursee
   */
  async markAsRefunded(invoiceId) {
    const { data, error } = await supabase
      .from('invoices')
      .update({
        status: 'refunded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Met a jour l'URL du PDF
   */
  async setPdfUrl(invoiceId, pdfUrl) {
    const { error } = await supabase
      .from('invoices')
      .update({
        pdf_url: pdfUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    if (error) throw error;
  },

  // ==========================================
  // STATS
  // ==========================================

  /**
   * Calcule le total depense par un utilisateur
   */
  async getUserTotalSpent(userId) {
    const { data, error } = await supabase
      .from('invoices')
      .select('total')
      .eq('user_id', userId)
      .eq('status', 'paid');

    if (error) throw error;

    return (data || []).reduce((sum, inv) => sum + (inv.total || 0), 0);
  },

  // ==========================================
  // ADMIN
  // ==========================================

  /**
   * [ADMIN] Recupere toutes les factures avec filtres
   */
  async adminGetInvoices(filters = {}) {
    const { limit = 50, offset = 0, status = null, userId = null, fromDate = null, toDate = null } = filters;

    let query = supabase
      .from('invoices')
      .select(`
        *,
        user:profiles(first_name, last_name, email)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (userId) query = query.eq('user_id', userId);
    if (fromDate) query = query.gte('created_at', fromDate);
    if (toDate) query = query.lte('created_at', toDate);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * [ADMIN] Stats de facturation
   */
  async adminGetStats(period = 'month') {
    const now = new Date();
    let fromDate;

    if (period === 'week') {
      fromDate = new Date(now.setDate(now.getDate() - 7));
    } else if (period === 'month') {
      fromDate = new Date(now.setMonth(now.getMonth() - 1));
    } else if (period === 'year') {
      fromDate = new Date(now.setFullYear(now.getFullYear() - 1));
    }

    const { data, error } = await supabase
      .from('invoices')
      .select('status, total, created_at')
      .gte('created_at', fromDate.toISOString());

    if (error) throw error;

    const invoices = data || [];

    return {
      total: invoices.length,
      paid: invoices.filter(i => i.status === 'paid').length,
      pending: invoices.filter(i => i.status === 'pending').length,
      failed: invoices.filter(i => i.status === 'failed').length,
      revenue: invoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + (i.total || 0), 0),
    };
  },
};
