import { describe, it, expect } from 'vitest';
import { Review, ReviewResponse, Conversation, Message } from './ReviewsAndMessaging';

describe('Review', () => {
  const row = {
    id: 'rev-1',
    transaction_id: 'tx-1',
    customer_id: 'cust-1',
    freelancer_id: 'free-1',
    ratings: { communication: 5, quality: 4, speed: 3 },
    body: 'Great work overall!',
    created_at: '2024-06-01T00:00:00Z',
  };

  it('hydrates from a database row', () => {
    const review = Review.fromRow(row);
    expect(review).toBeInstanceOf(Review);
    expect(review.id).toBe('rev-1');
    expect(review.transactionId).toBe('tx-1');
    expect(review.ratings.communication).toBe(5);
    expect(review.body).toBe('Great work overall!');
  });

  describe('validate', () => {
    it('returns true for valid ratings (1–5) and non-empty body', () => {
      const review = Review.fromRow(row);
      expect(review.validate()).toBe(true);
    });

    it('returns false when a rating is below 1', () => {
      const review = Review.fromRow({ ...row, ratings: { communication: 0, quality: 4, speed: 3 } });
      expect(review.validate()).toBe(false);
    });

    it('returns false when a rating is above 5', () => {
      const review = Review.fromRow({ ...row, ratings: { communication: 5, quality: 6, speed: 3 } });
      expect(review.validate()).toBe(false);
    });

    it('returns false when body is empty', () => {
      const review = Review.fromRow({ ...row, body: '   ' });
      expect(review.validate()).toBe(false);
    });

    it('returns false when ratings object is empty', () => {
      const review = Review.fromRow({ ...row, ratings: {} });
      expect(review.validate()).toBe(false);
    });
  });
});

describe('ReviewResponse', () => {
  it('hydrates from a database row', () => {
    const resp = ReviewResponse.fromRow({
      id: 'rr-1',
      review_id: 'rev-1',
      freelancer_id: 'free-1',
      body: 'Thank you for the feedback!',
      created_at: '2024-06-02T00:00:00Z',
    });
    expect(resp).toBeInstanceOf(ReviewResponse);
    expect(resp.reviewId).toBe('rev-1');
    expect(resp.body).toBe('Thank you for the feedback!');
  });
});

describe('Conversation', () => {
  it('hydrates from a database row', () => {
    const conv = Conversation.fromRow({
      id: 'conv-1',
      customer_id: 'cust-1',
      freelancer_id: 'free-1',
      created_at: '2024-05-01T00:00:00Z',
    });
    expect(conv).toBeInstanceOf(Conversation);
    expect(conv.customerId).toBe('cust-1');
    expect(conv.freelancerId).toBe('free-1');
  });
});

describe('Message', () => {
  it('hydrates from a database row', () => {
    const msg = Message.fromRow({
      id: 'msg-1',
      conversation_id: 'conv-1',
      sender_id: 'cust-1',
      body: 'Hello, I have a project for you.',
      created_at: '2024-05-01T12:00:00Z',
    });
    expect(msg).toBeInstanceOf(Message);
    expect(msg.conversationId).toBe('conv-1');
    expect(msg.senderId).toBe('cust-1');
    expect(msg.body).toBe('Hello, I have a project for you.');
  });
});
