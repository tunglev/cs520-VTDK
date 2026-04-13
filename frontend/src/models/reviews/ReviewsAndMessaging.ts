import { supabase } from '../../lib/supabaseClient';

// ── Review ───────────────────────────────────────────────────

export interface RatingMap {
  communication: number;
  quality: number;
  speed: number;
  [key: string]: number;
}

export class Review {
  id: string;
  transactionId: string;
  customerId: string;
  freelancerId: string;
  ratings: RatingMap;
  body: string;
  createdAt: string;

  constructor(data: {
    id: string;
    transactionId: string;
    customerId: string;
    freelancerId: string;
    ratings: RatingMap;
    body: string;
    createdAt: string;
  }) {
    this.id            = data.id;
    this.transactionId = data.transactionId;
    this.customerId    = data.customerId;
    this.freelancerId  = data.freelancerId;
    this.ratings       = data.ratings;
    this.body          = data.body;
    this.createdAt     = data.createdAt;
  }

  // Validates that all rating values are 1–5 and body is non-empty.
  validate(): boolean {
    const values = Object.values(this.ratings);
    if (values.length === 0) return false;
    const allInRange = values.every((v) => v >= 1 && v <= 5);
    const hasBody = this.body.trim().length > 0;
    return allInRange && hasBody;
  }

  // Recomputes the freelancer_rating_aggregates view by refreshing it.
  // In practice the view is computed on-the-fly; this is a no-op placeholder
  // that can be replaced with a materialized view refresh if needed.
  async updateAggregate() {
    // The freelancer_rating_aggregates view auto-updates on SELECT.
    // For a materialized view, call: supabase.rpc('refresh_rating_aggregates')
  }

  static fromRow(row: Record<string, unknown>): Review {
    return new Review({
      id:            row.id as string,
      transactionId: row.transaction_id as string,
      customerId:    row.customer_id as string,
      freelancerId:  row.freelancer_id as string,
      ratings:       row.ratings as RatingMap,
      body:          row.body as string,
      createdAt:     row.created_at as string,
    });
  }
}

// ── ReviewResponse ───────────────────────────────────────────

export class ReviewResponse {
  id: string;
  reviewId: string;
  freelancerId: string;
  body: string;
  createdAt: string;

  constructor(data: {
    id: string;
    reviewId: string;
    freelancerId: string;
    body: string;
    createdAt: string;
  }) {
    this.id           = data.id;
    this.reviewId     = data.reviewId;
    this.freelancerId = data.freelancerId;
    this.body         = data.body;
    this.createdAt    = data.createdAt;
  }

  static fromRow(row: Record<string, unknown>): ReviewResponse {
    return new ReviewResponse({
      id:           row.id as string,
      reviewId:     row.review_id as string,
      freelancerId: row.freelancer_id as string,
      body:         row.body as string,
      createdAt:    row.created_at as string,
    });
  }
}

// ── Conversation ─────────────────────────────────────────────

export class Conversation {
  id: string;
  customerId: string;
  freelancerId: string;
  createdAt: string;

  constructor(data: {
    id: string;
    customerId: string;
    freelancerId: string;
    createdAt: string;
  }) {
    this.id           = data.id;
    this.customerId   = data.customerId;
    this.freelancerId = data.freelancerId;
    this.createdAt    = data.createdAt;
  }

  // Returns or creates the conversation between these two users.
  static async getOrCreate(customerId: string, freelancerId: string): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .upsert({ customer_id: customerId, freelancer_id: freelancerId }, { onConflict: 'customer_id,freelancer_id' })
      .select()
      .single();
    if (error) throw error;
    return Conversation.fromRow(data);
  }

  static fromRow(row: Record<string, unknown>): Conversation {
    return new Conversation({
      id:           row.id as string,
      customerId:   row.customer_id as string,
      freelancerId: row.freelancer_id as string,
      createdAt:    row.created_at as string,
    });
  }
}

// ── Message ──────────────────────────────────────────────────

export class Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;

  constructor(data: {
    id: string;
    conversationId: string;
    senderId: string;
    body: string;
    createdAt: string;
  }) {
    this.id             = data.id;
    this.conversationId = data.conversationId;
    this.senderId       = data.senderId;
    this.body           = data.body;
    this.createdAt      = data.createdAt;
  }

  static fromRow(row: Record<string, unknown>): Message {
    return new Message({
      id:             row.id as string,
      conversationId: row.conversation_id as string,
      senderId:       row.sender_id as string,
      body:           row.body as string,
      createdAt:      row.created_at as string,
    });
  }
}